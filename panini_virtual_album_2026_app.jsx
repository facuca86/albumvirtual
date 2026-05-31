import React, { useEffect, useMemo, useRef, useState } from 'react';
import { db, doc, getDoc, setDoc } from './firebase';
import { playerNames } from './playerNames';
import { teamThemes } from './teamThemes';

const LOCAL_STORAGE_KEY = 'paniniWorldCup2026_stickers';
const LOCAL_STORAGE_DARK_KEY = 'paniniWorldCup2026_darkMode';

const ALBUM_OWNER = "Facundo";
const VIEW_PARAM = new URLSearchParams(window.location.search).get('view');

const STICKERS_FWCI = 9;
const STICKERS_FWCH = 12;
const STICKERS_COCA = 14;
const STICKERS_TEAM = 20;
// Coca-Cola stickers exist in the album but are not part of the official Panini collection
const TOTAL_STICKERS = 981;

const teams = [
  'FWCI1',
  'MEX','RSA','KOR','CZE','CAN','BIH','QAT','SUI','BRA','MAR','HAI','SCO',
  'USA','PAR','AUS','TUR','GER','CUW','CIV','ECU','NED','JPN','SWE','TUN',
  'BEL','EGY','IRN','NZL','ESP','CPV','KSA','URU','FRA','SEN','IRQ','NOR',
  'ARG','ALG','AUT','JOR','POR','COD','UZB','COL','ENG','CRO','GHA','PAN',
  'FWCH1',
  'FWCH2',
  'COCA'
];

const teamData = {
  FWCI1: { name: 'Intro', federation: 'Opening Section', flag: '🏆' },
  FWCI2: { name: 'Intro', federation: 'Opening Section', flag: '🌎' },
  FWCH1: { name: 'FWC History', federation: 'World Champions', flag: '⭐' },
  FWCH2: { name: 'FWC History', federation: 'World Champions', flag: '⭐' },
  COCA: { name: 'Coca-Cola', federation: 'Promotional Collection', flag: '🥤' },

  ARG: { name: 'Argentina', federation: 'Asociación del Fútbol Argentino', flag: '🇦🇷' },
  BRA: { name: 'Brasil', federation: 'Confederação Brasileira de Futebol', flag: '🇧🇷' },
  MEX: { name: 'México', federation: 'Federación Mexicana de Fútbol', flag: '🇲🇽' },
  GER: { name: 'Alemania', federation: 'Deutscher Fußball-Bund', flag: '🇩🇪' },
  FRA: { name: 'Francia', federation: 'Fédération Française de Football', flag: '🇫🇷' },
  ENG: { name: 'Inglaterra', federation: 'The Football Association', flag: '🏴' },
  ESP: { name: 'España', federation: 'Real Federación Española de Fútbol', flag: '🇪🇸' },
  URU: { name: 'Uruguay', federation: 'Asociación Uruguaya de Fútbol', flag: '🇺🇾' },
  PAN: { name: 'Panamá', federation: 'Federación Panameña de Fútbol', flag: '🇵🇦' },
  NOR: { name: 'Noruega', federation: 'Norges Fotballforbund', flag: '🇳🇴' },
  RSA: { name: 'Sudáfrica', federation: 'South African Football Association', flag: '🇿🇦' },
  KOR: { name: 'República de Corea', federation: 'Korea Football Association', flag: '🇰🇷' },
  CZE: { name: 'República Checa', federation: 'Fotbalová asociace České republiky', flag: '🇨🇿' },
  CAN: { name: 'Canadá', federation: 'Canada Soccer Association', flag: '🇨🇦' },
  BIH: { name: 'Bosnia y Herzegovina', federation: 'Nogometni/Fudbalski Savez Bosne i Hercegovine', flag: '🇧🇦' },
  QAT: { name: 'Catar', federation: 'Qatar Football Association', flag: '🇶🇦' },
  SUI: { name: 'Suiza', federation: 'Schweizerischer Fussballverband', flag: '🇨🇭' },
  MAR: { name: 'Marruecos', federation: 'Fédération Royale Marocaine de Football', flag: '🇲🇦' },
  HAI: { name: 'Haití', federation: 'Fédération Haïtienne de Football', flag: '🇭🇹' },
  SCO: { name: 'Escocia', federation: 'Scotland National Team', flag: '🏴' },
  PAR: { name: 'Paraguay', federation: 'Asociación Paraguaya de Fútbol', flag: '🇵🇾' },
  AUS: { name: 'Australia', federation: 'Football Australia', flag: '🇦🇺' },
  TUR: { name: 'Turquía', federation: 'Türkiye Futbol Federasyonu', flag: '🇹🇷' },
  CUW: { name: 'Curazao', federation: 'Federashon Futbòl Kòrsou', flag: '🇨🇼' },
  CIV: { name: 'Costa de Marfil', federation: 'Fédération Ivoirienne de Football', flag: '🇨🇮' },
  ECU: { name: 'Ecuador', federation: 'Federación Ecuatoriana de Fútbol', flag: '🇪🇨' },
  NED: { name: 'Países Bajos', federation: 'Koninklijke Nederlandse Voetbalbond', flag: '🇳🇱' },
  JPN: { name: 'Japón', federation: 'Japan Football Association', flag: '🇯🇵' },
  SWE: { name: 'Suecia', federation: 'Svenska Fotbollförbundet', flag: '🇸🇪' },
  TUN: { name: 'Túnez', federation: 'Fédération Tunisienne de Football', flag: '🇹🇳' },
  BEL: { name: 'Bélgica', federation: 'Koninklijke Belgische Voetbalbond', flag: '🇧🇪' },
  EGY: { name: 'Egipto', federation: 'Egyptian Football Association', flag: '🇪🇬' },
  IRN: { name: 'Irán', federation: 'Football Federation Islamic Republic of Iran', flag: '🇮🇷' },
  NZL: { name: 'Nueva Zelanda', federation: 'New Zealand Football', flag: '🇳🇿' },
  CPV: { name: 'Cabo Verde', federation: 'Federação Caboverdiana de Futebol', flag: '🇨🇻' },
  KSA: { name: 'Arabia Saudita', federation: 'Saudi Arabian Football Federation', flag: '🇸🇦' },
  SEN: { name: 'Senegal', federation: 'Fédération Sénégalaise de Football', flag: '🇸🇳' },
  IRQ: { name: 'Irak', federation: 'Iraqi Football Association', flag: '🇮🇶' },
  ALG: { name: 'Argelia', federation: 'Fédération Algérienne de Football', flag: '🇩🇿' },
  AUT: { name: 'Austria', federation: 'Österreichischer Fußball-Bund', flag: '🇦🇹' },
  JOR: { name: 'Jordania', federation: 'Jordan Football Association', flag: '🇯🇴' },
  POR: { name: 'Portugal', federation: 'Federação Portuguesa de Futebol', flag: '🇵🇹' },
  COD: { name: 'Congo DR', federation: 'Fédération Congolaise de Football-Association', flag: '🇨🇩' },
  UZB: { name: 'Uzbekistán', federation: 'Ozbekiston Futbol Federatsiyasi', flag: '🇺🇿' },
  COL: { name: 'Colombia', federation: 'Federación Colombiana de Fútbol', flag: '🇨🇴' },
  CRO: { name: 'Croacia', federation: 'Hrvatski nogometni savez', flag: '🇭🇷' },
  GHA: { name: 'Ghana', federation: 'Ghana Football Association', flag: '🇬🇭' },
  USA: { name: 'Estados Unidos', federation: 'U.S. Soccer Federation', flag: '🇺🇸' }
};

const teamGroups = {
  MEX: { group: 'A', members: ['México', 'Sudáfrica', 'Rep. de Corea', 'Rep. Checa'] },
  RSA: { group: 'A', members: ['México', 'Sudáfrica', 'Rep. de Corea', 'Rep. Checa'] },
  KOR: { group: 'A', members: ['México', 'Sudáfrica', 'Rep. de Corea', 'Rep. Checa'] },
  CZE: { group: 'A', members: ['México', 'Sudáfrica', 'Rep. de Corea', 'Rep. Checa'] },
  CAN: { group: 'B', members: ['Canadá', 'Bosnia y Herz.', 'Catar', 'Suiza'] },
  BIH: { group: 'B', members: ['Canadá', 'Bosnia y Herz.', 'Catar', 'Suiza'] },
  QAT: { group: 'B', members: ['Canadá', 'Bosnia y Herz.', 'Catar', 'Suiza'] },
  SUI: { group: 'B', members: ['Canadá', 'Bosnia y Herz.', 'Catar', 'Suiza'] },
  BRA: { group: 'C', members: ['Brasil', 'Marruecos', 'Haití', 'Escocia'] },
  MAR: { group: 'C', members: ['Brasil', 'Marruecos', 'Haití', 'Escocia'] },
  HAI: { group: 'C', members: ['Brasil', 'Marruecos', 'Haití', 'Escocia'] },
  SCO: { group: 'C', members: ['Brasil', 'Marruecos', 'Haití', 'Escocia'] },
  USA: { group: 'D', members: ['Estados Unidos', 'Paraguay', 'Australia', 'Turquía'] },
  PAR: { group: 'D', members: ['Estados Unidos', 'Paraguay', 'Australia', 'Turquía'] },
  AUS: { group: 'D', members: ['Estados Unidos', 'Paraguay', 'Australia', 'Turquía'] },
  TUR: { group: 'D', members: ['Estados Unidos', 'Paraguay', 'Australia', 'Turquía'] },
  GER: { group: 'E', members: ['Alemania', 'Curazao', 'Costa de Marfil', 'Ecuador'] },
  CUW: { group: 'E', members: ['Alemania', 'Curazao', 'Costa de Marfil', 'Ecuador'] },
  CIV: { group: 'E', members: ['Alemania', 'Curazao', 'Costa de Marfil', 'Ecuador'] },
  ECU: { group: 'E', members: ['Alemania', 'Curazao', 'Costa de Marfil', 'Ecuador'] },
  NED: { group: 'F', members: ['Países Bajos', 'Japón', 'Suecia', 'Túnez'] },
  JPN: { group: 'F', members: ['Países Bajos', 'Japón', 'Suecia', 'Túnez'] },
  SWE: { group: 'F', members: ['Países Bajos', 'Japón', 'Suecia', 'Túnez'] },
  TUN: { group: 'F', members: ['Países Bajos', 'Japón', 'Suecia', 'Túnez'] },
  BEL: { group: 'G', members: ['Bélgica', 'Egipto', 'Irán', 'Nueva Zelanda'] },
  EGY: { group: 'G', members: ['Bélgica', 'Egipto', 'Irán', 'Nueva Zelanda'] },
  IRN: { group: 'G', members: ['Bélgica', 'Egipto', 'Irán', 'Nueva Zelanda'] },
  NZL: { group: 'G', members: ['Bélgica', 'Egipto', 'Irán', 'Nueva Zelanda'] },
  ESP: { group: 'H', members: ['España', 'Cabo Verde', 'Arabia Saudita', 'Uruguay'] },
  CPV: { group: 'H', members: ['España', 'Cabo Verde', 'Arabia Saudita', 'Uruguay'] },
  KSA: { group: 'H', members: ['España', 'Cabo Verde', 'Arabia Saudita', 'Uruguay'] },
  URU: { group: 'H', members: ['España', 'Cabo Verde', 'Arabia Saudita', 'Uruguay'] },
  FRA: { group: 'I', members: ['Francia', 'Senegal', 'Irak', 'Noruega'] },
  SEN: { group: 'I', members: ['Francia', 'Senegal', 'Irak', 'Noruega'] },
  IRQ: { group: 'I', members: ['Francia', 'Senegal', 'Irak', 'Noruega'] },
  NOR: { group: 'I', members: ['Francia', 'Senegal', 'Irak', 'Noruega'] },
  ARG: { group: 'J', members: ['Argentina', 'Argelia', 'Austria', 'Jordania'] },
  ALG: { group: 'J', members: ['Argentina', 'Argelia', 'Austria', 'Jordania'] },
  AUT: { group: 'J', members: ['Argentina', 'Argelia', 'Austria', 'Jordania'] },
  JOR: { group: 'J', members: ['Argentina', 'Argelia', 'Austria', 'Jordania'] },
  POR: { group: 'K', members: ['Portugal', 'Congo DR', 'Uzbekistán', 'Colombia'] },
  COD: { group: 'K', members: ['Portugal', 'Congo DR', 'Uzbekistán', 'Colombia'] },
  UZB: { group: 'K', members: ['Portugal', 'Congo DR', 'Uzbekistán', 'Colombia'] },
  COL: { group: 'K', members: ['Portugal', 'Congo DR', 'Uzbekistán', 'Colombia'] },
  ENG: { group: 'L', members: ['Inglaterra', 'Croacia', 'Ghana', 'Panamá'] },
  CRO: { group: 'L', members: ['Inglaterra', 'Croacia', 'Ghana', 'Panamá'] },
  GHA: { group: 'L', members: ['Inglaterra', 'Croacia', 'Ghana', 'Panamá'] },
  PAN: { group: 'L', members: ['Inglaterra', 'Croacia', 'Ghana', 'Panamá'] },
};

const groups = {
  A: { color: '#73BB6A', teams: ['MEX','RSA','KOR','CZE'] },
  B: { color: '#E30613', teams: ['CAN','BIH','QAT','SUI'] },
  C: { color: '#B8D94A', teams: ['BRA','MAR','HAI','SCO'] },
  D: { color: '#0A4E97', teams: ['USA','PAR','AUS','TUR'] },
  E: { color: '#E55C0B', teams: ['GER','CUW','CIV','ECU'] },
  F: { color: '#006B63', teams: ['NED','JPN','SWE','TUN'] },
  G: { color: '#CACBDD', teams: ['BEL','EGY','IRN','NZL'] },
  H: { color: '#5CC9CA', teams: ['ESP','CPV','KSA','URU'] },
  I: { color: '#5B2E87', teams: ['FRA','SEN','IRQ','NOR'] },
  J: { color: '#EDD6D6', teams: ['ARG','ALG','AUT','JOR'] },
  K: { color: '#E4326C', teams: ['POR','COD','UZB','COL'] },
  L: { color: '#7A121A', teams: ['ENG','CRO','GHA','PAN'] },
};

const indexTeamIcons = {
  FWCI1: '⚽',
  FWCI2: '⚽',
  FWCH1: '🏆',
  FWCH2: '🏆',
  COCA: '⚽'
};


const progressDocRef = db ? doc(db, 'albumProgress', 'paniniWorldCup2026') : null;
const settingsDocRef = db ? doc(db, 'albumSettings', 'paniniWorldCup2026') : null;

const getThemeKey = (teamCode) => {
  if (teamCode && teamCode.startsWith('FWCI')) return 'FWCINTRO';
  if (teamCode && teamCode.startsWith('FWCH')) return 'FWCHISTORY';
  return teamCode;
};

const getTeamGradientClass = (teamCode) => {
  if (teamCode === 'COCA') return 'bg-[#e41f1f]';
  if (teamCode && teamCode.startsWith('FWCH')) return 'bg-[#0d2167]';

  const themeKey = getThemeKey(teamCode);
  const gradient = teamThemes[themeKey]?.gradient;
  return gradient ? `bg-gradient-to-r ${gradient}` : 'bg-white';
};

const getInnerPanelClass = (teamCode, darkMode = false) => {
  if (teamCode && teamCode.startsWith('FWCI')) return 'bg-[#1a1a2e]';
  return darkMode ? 'bg-[#1e1e30]' : 'bg-[#f7f5f2]';
};

const isTeamDark = (teamCode) => teamThemes[getThemeKey(teamCode)]?.dark === true;

// ─── helpers for new features ────────────────────────────────────────────────

const TAILWIND_HEX = {
  'green-300':'#86efac','green-400':'#4ade80','green-500':'#22c55e','green-600':'#16a34a',
  'red-400':'#f87171','red-500':'#ef4444','red-600':'#dc2626',
  'blue-400':'#60a5fa','blue-500':'#3b82f6','blue-600':'#2563eb','blue-900':'#1e3a5f',
  'yellow-300':'#fde047','yellow-400':'#facc15','yellow-500':'#eab308','yellow-600':'#ca8a04',
  'orange-500':'#f97316','rose-400':'#fb7185',
  'sky-200':'#bae6fd','sky-400':'#38bdf8','sky-500':'#0ea5e9',
  'slate-400':'#94a3b8','slate-900':'#0f172a','white':'#ffffff',
};

function getTeamCodes(team) {
  if (team === 'FWCI1') return ['00','FWC1','FWC2','FWC3','FWC4','FWC5','FWC6','FWC7','FWC8'];
  if (team === 'FWCH1') return ['FWC9','FWC10','FWC11','FWC12','FWC13','FWC14'];
  if (team === 'FWCH2') return ['FWC15','FWC16','FWC17','FWC18','FWC19','FWC20'];
  if (team === 'COCA') return Array.from({ length: 14 }, (_, i) => `CC${i + 1}`);
  return Array.from({ length: 20 }, (_, i) => `${team}${i + 1}`);
}

function getTeamConfettiColors(teamCode) {
  const gradient = teamThemes[getThemeKey(teamCode)]?.gradient || '';
  const colors = (gradient.match(/(?:from|via|to)-([^\s]+)/g) || [])
    .map(m => TAILWIND_HEX[m.replace(/^(?:from|via|to)-/, '')]).filter(Boolean);
  return colors.length >= 2 ? [...colors, '#ffffff'] : ['#4ade80', '#22c55e', '#60a5fa', '#ffffff'];
}

// ─────────────────────────────────────────────────────────────────────────────

export default function PaniniAlbum2026() {
  if (VIEW_PARAM === 'repetidas') return <RepeatidasView />;
  const [currentView, setCurrentView] = useState('home');
  const [currentTeamIndex, setCurrentTeamIndex] = useState(0);
  const [completed, setCompleted] = useState({});
  const [showStats, setShowStats] = useState(false);
  const [importMessage, setImportMessage] = useState('');
  const [showQR, setShowQR] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const isInitialLoad = useRef(true);

  // New feature state
  const [celebration, setCelebration] = useState(null);
  const [justPastedCode, setJustPastedCode] = useState(null);
  const [highlightCode, setHighlightCode] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadProgress = async () => {
      try {
        if (progressDocRef) {
          const progressSnap = await getDoc(progressDocRef);

          if (progressSnap.exists()) {
            const data = progressSnap.data();
            if (data?.stickers && typeof data.stickers === 'object') {
              setCompleted(data.stickers);
              return;
            }
          }
        }

        const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (localData) {
          const parsed = JSON.parse(localData);
          if (parsed && typeof parsed === 'object') {
            setCompleted(parsed);
          }
        }
      } catch (error) {
        console.error('Error loading album progress from Firestore:', error);
      } finally {
        isInitialLoad.current = false;
      }
    };

    loadProgress();
  }, []);

  useEffect(() => {
    const loadDarkMode = async () => {
      try {
        if (settingsDocRef) {
          const snap = await getDoc(settingsDocRef);
          if (snap.exists() && typeof snap.data()?.darkMode === 'boolean') {
            setDarkMode(snap.data().darkMode);
            return;
          }
        }
      } catch {}
      const local = localStorage.getItem(LOCAL_STORAGE_DARK_KEY);
      if (local !== null) setDarkMode(local === 'true');
    };
    loadDarkMode();
  }, []);

  useEffect(() => {
    const saveProgress = async () => {
      if (isInitialLoad.current) return;

      try {
        if (progressDocRef) {
          await setDoc(progressDocRef, { stickers: completed });
        }
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(completed));
      } catch (error) {
        console.error('Error saving album progress:', error);
      }
    };

    saveProgress();
  }, [completed]);

  const currentTeam = teams[currentTeamIndex] || teams[0];

  const currentTeamInfo = teamData[currentTeam] || {
    name: currentTeam,
    federation: 'Federación Nacional de Fútbol',
    flag: '🏳️'
  };

  const stickerCount = currentTeam.startsWith('FWCI') ? STICKERS_FWCI : currentTeam.startsWith('FWCH') ? STICKERS_FWCH : currentTeam === 'COCA' ? STICKERS_COCA : STICKERS_TEAM;

  const isRepeatedSticker = (value) => value === 'repeated';
  const isCompletedSticker = (value) => value === true || value === 'repeated';


  const historyPageItems = {
    FWCH1: [
      { type: 'printed', label: 'URUGUAY 1930' },
      { type: 'sticker', code: 'FWC9', label: 'ITALIA 1934' },
      { type: 'printed', label: 'ITALIA 1938' },
      { type: 'sticker', code: 'FWC10', label: 'URUGUAY 1950' },
      { type: 'sticker', code: 'FWC11', label: 'RF ALEMANIA 1954' },
      { type: 'sticker', code: 'FWC12', label: 'BRASIL 1958' },
      { type: 'sticker', code: 'FWC13', label: 'BRASIL 1962' },
      { type: 'printed', label: 'INGLATERRA 1966' },
      { type: 'printed', label: 'BRASIL 1970' },
      { type: 'sticker', code: 'FWC14', label: 'RF ALEMANIA 1974' }
    ],
    FWCH2: [
      { type: 'printed', label: 'ARGENTINA 1978' },
      { type: 'printed', label: 'ITALIA 1982' },
      { type: 'sticker', code: 'FWC15', label: 'ARGENTINA 1986' },
      { type: 'printed', label: 'ALEMANIA 1990' },
      { type: 'sticker', code: 'FWC16', label: 'BRASIL 1994' },
      { type: 'printed', label: 'FRANCIA 1998' },
      { type: 'sticker', code: 'FWC17', label: 'BRASIL 2002' },
      { type: 'sticker', code: 'FWC18', label: 'ITALIA 2006' },
      { type: 'printed', label: 'ESPAÑA 2010' },
      { type: 'sticker', code: 'FWC19', label: 'ALEMANIA 2014' },
      { type: 'printed', label: 'FRANCIA 2018' },
      { type: 'sticker', code: 'FWC20', label: 'ARGENTINA 2022' }
    ]
  };

  const stickers = useMemo(() => {
    return Array.from({ length: stickerCount }, (_, i) => {
      const id = i + 1;

      let code = currentTeam === 'COCA'
        ? `CC${id}`
        : currentTeam.startsWith('FWCI')
        ? id === 1
          ? '00'
          : `FWC${id - 1}`
        : `${currentTeam}${id}`;

      let type = 'player';
      let label = `Jugador ${id}`;
      let horizontal = false;

      if (currentTeam === 'FWCI1') {
        const fwciDefs = [
          { code: '00', label: 'PANINI', type: 'panini', displayCode: '00', displayLabel: 'PANINI' },
          { code: 'FWC1', label: 'Logo Copa 1', type: 'fwc' },
          { code: 'FWC2', label: 'Logo Copa 2', type: 'fwc' },
          { code: 'FWC3', label: 'Mascotas', type: 'fwc' },
          { code: 'FWC4', label: 'Póster', type: 'fwc' },
          { code: 'FWC5', label: 'Balón Oficial', type: 'fwc' },
          { code: 'FWC6', label: 'Póster Canadá', type: 'fwc' },
          { code: 'FWC7', label: 'Póster México', type: 'fwc' },
          { code: 'FWC8', label: 'Póster USA', type: 'fwc' },
        ];
        const def = fwciDefs[id - 1];
        code = def.code;
        label = def.label;
        type = def.type;
      } else if (currentTeam === 'COCA') {
        label = playerNames.CC?.[id] || `Jugador ${id}`;
      } else if (currentTeam.startsWith('FWCH')) {
        const historySelectable = {
          FWCH1: [
            { code: 'FWC9', label: 'ITALIA 1934' },
            { code: 'FWC10', label: 'URUGUAY 1950' },
            { code: 'FWC11', label: 'RF ALEMANIA 1954' },
            { code: 'FWC12', label: 'BRASIL 1958' },
            { code: 'FWC13', label: 'BRASIL 1962' },
            { code: 'FWC14', label: 'RF ALEMANIA 1974' }
          ],
          FWCH2: [
            { code: 'FWC15', label: 'ARGENTINA 1986' },
            { code: 'FWC16', label: 'BRASIL 1994' },
            { code: 'FWC17', label: 'BRASIL 2002' },
            { code: 'FWC18', label: 'ITALIA 2006' },
            { code: 'FWC19', label: 'ALEMANIA 2014' },
            { code: 'FWC20', label: 'ARGENTINA 2022' }
          ]
        };

        const historySticker = historySelectable[currentTeam][id - 1];
        code = historySticker?.code || code;
        label = historySticker?.label || `CAMPEÓN ${id}`;
        horizontal = true;
      } else {
        type = id === 1 ? 'shield' : id === 13 ? 'team' : 'player';
        label = type === 'shield' ? 'Escudo' : type === 'team' ? 'Foto equipo' : playerNames[currentTeam]?.[id] || `Jugador ${id}`;
        horizontal = id === 13;
      }

      return {
        id,
        code,
        completed: isCompletedSticker(completed[code]),
        repeated: isRepeatedSticker(completed[code]),
        type,
        label,
        horizontal
      };
    });
  }, [currentTeam, completed, stickerCount]);

  const toggleSticker = (code) => {
    const current = completed[code];
    let next;
    if (current === true) {
      next = { ...completed, [code]: 'repeated' };
    } else if (current === 'repeated') {
      next = { ...completed };
      delete next[code];
    } else {
      next = { ...completed, [code]: true };
    }
    setCompleted(next);

    // Only trigger animations/celebrations when going empty → completed
    if (!current) {
      setJustPastedCode(code);
      setTimeout(() => setJustPastedCode(null), 450);

      // Album completion check (excludes Coca-Cola)
      const newCount = Object.entries(next)
        .filter(([c, v]) => !c.startsWith('CC') && isCompletedSticker(v)).length;
      if (newCount === TOTAL_STICKERS) {
        setTimeout(() => setCelebration({ type: 'album' }), 350);
        return;
      }

      // Team completion check (includes Coca-Cola)
      const teamForCode = getTeamForCode(code);
      if (teamForCode) {
        const codes = getTeamCodes(teamForCode);
        const wasComplete = codes.every(c => isCompletedSticker(completed[c]));
        const nowComplete = codes.every(c => isCompletedSticker(next[c]));
        if (nowComplete && !wasComplete) {
          setTimeout(() => setCelebration({ type: 'team', team: teamForCode }), 350);
        }
      }
    }
  };

  const toggleDarkMode = async () => {
    const newVal = !darkMode;
    setDarkMode(newVal);
    localStorage.setItem(LOCAL_STORAGE_DARK_KEY, String(newVal));
    if (settingsDocRef) {
      try { await setDoc(settingsDocRef, { darkMode: newVal }, { merge: true }); } catch (_) {}
    }
  };

  const nextTeam = () => {
    window.scrollTo(0, 0);
    if (currentTeam === 'COCA') {
      setCurrentView('home');
      return;
    }

    setCurrentTeamIndex((prev) =>
      prev >= teams.length - 1 ? teams.length - 1 : prev + 1
    );
  };

  const prevTeam = () => {
    window.scrollTo(0, 0);
    setCurrentTeamIndex((prev) =>
      prev <= 0 ? 0 : prev - 1
    );
  };

  const handleExport = () => {
    const json = JSON.stringify(completed);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'panini2026_backup.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const parsed = JSON.parse(evt.target.result);
        if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) return;
        setCompleted(parsed);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(parsed));
        if (progressDocRef) {
          try { await setDoc(progressDocRef, { stickers: parsed }); } catch (_) {}
        }
        setImportMessage('✅ Progreso importado');
        setTimeout(() => setImportMessage(''), 2000);
      } catch (_) {}
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const completedCount = Object.entries(completed).filter(([code, value]) => !code.startsWith('CC') && isCompletedSticker(value)).length;
  const repeatedCount = Object.values(completed).filter((value) => isRepeatedSticker(value)).length;
  const completionPercent = Math.round((completedCount / TOTAL_STICKERS) * 100);
  const remainingCount = Math.max(TOTAL_STICKERS - completedCount, 0);

  const shieldCodes = teams
    .filter((team) => !team.startsWith('FWC') && team !== 'COCA')
    .map((team) => `${team}1`);
  const fwcBrilliantCodes = Array.from({ length: STICKERS_TEAM }, (_, i) => `FWC${i + 1}`);
  const brilliantCodes = [...shieldCodes, ...fwcBrilliantCodes];
  const brilliantCompletedCount = brilliantCodes.filter((code) => isCompletedSticker(completed[code])).length;

  const selectionTeams = teams.filter((team) => !team.startsWith('FWC') && team !== 'COCA');

  const selectionStats = useMemo(() => {
    const paniniCodes = ['00'];
    const fwcIntroCodes = Array.from({ length: 8 }, (_, i) => `FWC${i + 1}`);
    const fwcHistoryCodes = Array.from({ length: STICKERS_FWCH }, (_, i) => `FWC${i + 9}`);
    const cocaCodes = Array.from({ length: STICKERS_COCA }, (_, i) => `CC${i + 1}`);

    return [
      {
        key: '00',
        emoji: '⚽',
        name: 'PANINI',
        total: paniniCodes.length,
        completed: paniniCodes.filter((code) => isCompletedSticker(completed[code])).length
      },
      {
        key: 'FWC_INTRO',
        emoji: '⚽',
        name: 'FWC INTRO',
        total: fwcIntroCodes.length,
        completed: fwcIntroCodes.filter((code) => isCompletedSticker(completed[code])).length
      },
      ...selectionTeams.map((team) => {
        const teamCodes = Array.from({ length: STICKERS_TEAM }, (_, i) => `${team}${i + 1}`);
        return {
          key: team,
          emoji: teamData[team]?.flag || '🏳️',
          name: (teamData[team]?.name || team).toUpperCase(),
          total: teamCodes.length,
          completed: teamCodes.filter((code) => isCompletedSticker(completed[code])).length
        };
      }),
      {
        key: 'FWC_HISTORY',
        emoji: '🏆',
        name: 'CAMPEONES',
        total: fwcHistoryCodes.length,
        completed: fwcHistoryCodes.filter((code) => isCompletedSticker(completed[code])).length
      },
      {
        key: 'COCA_COLA',
        emoji: '⚽',
        name: 'COCA-COLA',
        total: cocaCodes.length,
        completed: cocaCodes.filter((code) => isCompletedSticker(completed[code])).length
      }
    ];
  }, [completed, selectionTeams]);

  // Search index: all toggleable stickers with searchable text
  const searchIndex = useMemo(() => {
    const entries = [];
    const fwciCodes = ['00','FWC1','FWC2','FWC3','FWC4','FWC5','FWC6','FWC7','FWC8'];
    const fwciLabels = ['PANINI','Logo Copa 1','Logo Copa 2','Mascotas','Póster','Balón Oficial','Póster Canadá','Póster México','Póster USA'];
    fwciCodes.forEach((code, i) => entries.push({ code, label: fwciLabels[i], team: 'FWCI1', teamName: 'Intro FWC', teamFlag: '⚽' }));

    const fwchData = [
      { code:'FWC9', label:'ITALIA 1934', team:'FWCH1' },
      { code:'FWC10', label:'URUGUAY 1950', team:'FWCH1' },
      { code:'FWC11', label:'RF ALEMANIA 1954', team:'FWCH1' },
      { code:'FWC12', label:'BRASIL 1958', team:'FWCH1' },
      { code:'FWC13', label:'BRASIL 1962', team:'FWCH1' },
      { code:'FWC14', label:'RF ALEMANIA 1974', team:'FWCH1' },
      { code:'FWC15', label:'ARGENTINA 1986', team:'FWCH2' },
      { code:'FWC16', label:'BRASIL 1994', team:'FWCH2' },
      { code:'FWC17', label:'BRASIL 2002', team:'FWCH2' },
      { code:'FWC18', label:'ITALIA 2006', team:'FWCH2' },
      { code:'FWC19', label:'ALEMANIA 2014', team:'FWCH2' },
      { code:'FWC20', label:'ARGENTINA 2022', team:'FWCH2' },
    ];
    fwchData.forEach(d => entries.push({ ...d, teamName: 'FWC Historia', teamFlag: '⭐' }));

    selectionTeams.forEach(team => {
      const info = teamData[team];
      for (let id = 1; id <= 20; id++) {
        const code = `${team}${id}`;
        const label = id === 1 ? 'Escudo' : id === 13 ? 'Foto equipo' : (playerNames[team]?.[id] || `Jugador ${id}`);
        entries.push({ code, label, team, teamName: info?.name || team, teamFlag: info?.flag || '🏳️' });
      }
    });

    for (let id = 1; id <= 14; id++) {
      entries.push({ code: `CC${id}`, label: playerNames.CC?.[id] || `Jugador ${id}`, team: 'COCA', teamName: 'Coca-Cola', teamFlag: '🥤' });
    }

    return entries;
  }, [selectionTeams]);

  const searchResults = useMemo(() => {
    if (searchQuery.length < 2) return [];
    const q = searchQuery.toLowerCase().trim();
    return searchIndex.filter(e =>
      e.code.toLowerCase().startsWith(q) ||
      e.label.toLowerCase().includes(q) ||
      e.teamName.toLowerCase().includes(q)
    ).slice(0, 6);
  }, [searchQuery, searchIndex]);

  const handleSearchSelect = (entry) => {
    setSearchOpen(false);
    setSearchQuery('');
    const teamIdx = teams.indexOf(entry.team);
    if (teamIdx >= 0) {
      window.scrollTo(0, 0);
      setCurrentTeamIndex(teamIdx);
      setCurrentView('album');
      setHighlightCode(entry.code);
      setTimeout(() => setHighlightCode(null), 3000);
    }
  };

  const currentTeamCompleted = currentTeam.startsWith('FWCI')
    ? ['00','FWC1','FWC2','FWC3','FWC4','FWC5','FWC6','FWC7','FWC8']
        .filter((code) => isCompletedSticker(completed[code])).length
    : currentTeam.startsWith('FWCH')
    ? ['FWC9','FWC10','FWC11','FWC12','FWC13','FWC14','FWC15','FWC16','FWC17','FWC18','FWC19','FWC20']
        .filter((code) => isCompletedSticker(completed[code])).length
    : stickers.filter((s) => s.completed).length;

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-[#0f0f1a] text-white' : 'bg-[#880E4F] text-slate-800'}`}>
      <header className={`border-b shadow-sm sticky top-0 z-50 transition-colors duration-300 ${darkMode ? 'bg-[#1a1a2e] border-[#2a2a4a]' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 sm:py-4 flex flex-row gap-2 justify-between items-center">
          <div className="min-w-0">
            <h1 className={`text-lg sm:text-3xl font-black italic truncate ${darkMode ? 'text-white' : ''}`}>
              ÁLBUM VIRTUAL 2026
            </h1>

            <p className={`hidden sm:block text-xs uppercase tracking-[0.3em] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              FIFA WORLD CUP
            </p>

            <div className={`mt-0.5 sm:mt-2 text-xs sm:text-sm font-black ${darkMode ? 'text-pink-400' : 'text-pink-800'}`}>
              {completionPercent}% COMPLETADO
            </div>

            <div className={`mt-1 sm:mt-2 h-2 sm:h-2.5 w-24 sm:w-56 rounded-full overflow-hidden ${darkMode ? 'bg-[#2a2a4a]' : 'bg-slate-200'}`}>
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-lime-500 to-green-600 transition-all"
                style={{ width: `${completionPercent}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 relative">
            {/* Search */}
            {searchOpen && (
              <div className="relative flex items-center gap-1">
                <input
                  autoFocus
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Escape') { setSearchOpen(false); setSearchQuery(''); } }}
                  placeholder="Código o jugador…"
                  className={`px-3 py-2 rounded-xl text-sm font-black border-2 w-32 sm:w-48 outline-none transition-all ${darkMode ? 'bg-[#2a2a4a] border-[#4a4a6a] text-white placeholder-slate-500' : 'bg-white border-slate-300 text-slate-800 placeholder-slate-400'}`}
                />
                <button
                  onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
                  className={`font-black text-base leading-none px-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}
                >
                  ✕
                </button>
                {searchResults.length > 0 && (
                  <div className={`absolute top-full right-0 mt-1 w-72 max-w-[calc(100vw-1.5rem)] rounded-2xl shadow-2xl overflow-hidden z-[200] ${darkMode ? 'bg-[#1a1a2e] border border-[#3a3a5a]' : 'bg-white border border-slate-200'}`}>
                    {searchResults.map(entry => (
                      <button
                        key={entry.code}
                        onClick={() => handleSearchSelect(entry)}
                        className={`w-full px-4 py-2.5 text-left flex items-center gap-3 border-b last:border-b-0 transition-colors ${darkMode ? 'border-[#2a2a4a] hover:bg-[#2a2a4a] text-white' : 'border-slate-100 hover:bg-slate-50'}`}
                      >
                        <span className="text-xl leading-none shrink-0">{entry.teamFlag}</span>
                        <div className="min-w-0">
                          <div className={`font-black text-xs uppercase ${darkMode ? 'text-slate-400' : 'text-slate-400'}`}>{entry.code}</div>
                          <div className="font-black text-sm truncate">{entry.label}</div>
                          <div className={`text-xs truncate ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>{entry.teamName}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            <button
              onClick={() => setSearchOpen(s => !s)}
              title="Buscar figurita"
              className={`px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl font-black text-sm sm:text-base transition-colors duration-300 ${darkMode ? 'bg-white text-slate-900' : 'bg-slate-800 text-white'}`}
            >
              🔍
            </button>
            <button
              onClick={toggleDarkMode}
              className={`px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl font-black text-sm sm:text-base transition-colors duration-300 ${darkMode ? 'bg-white text-slate-900' : 'bg-slate-800 text-white'}`}
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
            <button
              onClick={() => setCurrentView('home')}
              className={`px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl font-black text-sm sm:text-base transition-colors duration-300 ${darkMode ? 'bg-white text-red-600' : 'bg-red-600 text-white'}`}
            >
              HOME
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-8">
        {currentView === 'home' && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <button
              onClick={() => setCurrentView('groups')}
              className={`rounded-3xl p-8 shadow-xl text-left active:scale-95 transition-colors duration-300 ${darkMode ? 'bg-[#1e1e30] text-white' : 'bg-white'}`}
            >
              <div className="text-3xl font-black italic uppercase">
                Explorar Álbum
              </div>
            </button>

            <button
              onClick={() => setCurrentView('teams')}
              className={`rounded-3xl p-8 shadow-xl text-left active:scale-95 transition-colors duration-300 ${darkMode ? 'bg-[#1e1e30] text-white' : 'bg-white'}`}
            >
              <div className="text-3xl font-black italic uppercase">
                Índice
              </div>
            </button>

            <button
              onClick={() => setShowStats(true)}
              className={`rounded-3xl p-8 shadow-xl text-left active:scale-95 transition-colors duration-300 ${darkMode ? 'bg-[#1e1e30] text-white' : 'bg-white'}`}
            >
              <div className="text-3xl font-black italic uppercase">
                Estadísticas
              </div>
            </button>
          </div>
        )}

        {currentView === 'stats-selections' && (
          <div className={`rounded-3xl p-6 sm:p-8 shadow-xl max-w-4xl mx-auto transition-colors duration-300 ${darkMode ? 'bg-[#1e1e30] text-white' : 'bg-white'}`}>
            <h2 className="text-3xl font-black italic uppercase mb-6">Estadísticas Selecciones</h2>
            <div className="max-h-[60vh] overflow-y-auto space-y-3 pr-1">
              {selectionStats.map((item) => (
                <div key={item.key} className="font-black text-lg sm:text-xl">
                  {item.emoji} {item.name}: {item.completed} / {item.total}
                </div>
              ))}
            </div>
            <button
              onClick={() => {
                setCurrentView('home');
                setShowStats(true);
              }}
              className="mt-6 bg-red-600 text-white px-6 py-3 rounded-2xl font-black"
            >
              VOLVER
            </button>
          </div>
        )}

        {currentView === 'teams' && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {teams.filter(team => team !== 'FWCI2').map((team) => (
              <button
                key={team}
                onClick={() => {
                  setCurrentTeamIndex(teams.indexOf(team));
                  setCurrentView('album');
                }}
                className={`rounded-2xl p-4 shadow font-black italic active:scale-95 transition-colors duration-300 flex items-center gap-2 ${darkMode ? 'bg-[#1e1e30] text-white' : 'bg-white'}`}
              >
                <span>{indexTeamIcons[team] || teamData[team]?.flag || '🏳️'}</span>
                <span>{teamData[team]?.name || team}</span>
              </button>
            ))}
          </div>
        )}

        {currentView === 'groups' && (
          <div
            className="rounded-3xl p-4 sm:p-8 pb-24 sm:pb-8 shadow-xl"
            style={{ background: 'radial-gradient(ellipse at center, #C92A7A, #A11C5B, #FF5A00, #B18BEA, #5D93E6, #8FC8FF, #E9F52A, #006B4F)' }}
          >
            {/* Desktop nav */}
            <div className="hidden lg:flex justify-between items-center mb-6">
              <button
                onClick={() => setCurrentView('home')}
                className="rounded-full px-6 py-3 shadow font-bold italic bg-white text-black"
              >
                HOME
              </button>
              <h2 className="text-3xl font-black italic uppercase text-white drop-shadow-lg">GRUPOS</h2>
              <button
                onClick={() => { setCurrentTeamIndex(0); setCurrentView('album'); }}
                className="rounded-full px-6 py-3 shadow font-bold italic bg-white text-black"
              >
                SIGUIENTE →
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {/* INTRO button */}
              <button
                onClick={() => { setCurrentTeamIndex(0); setCurrentView('album'); }}
                className="col-span-2 rounded-2xl p-4 font-black text-2xl sm:text-3xl active:scale-95 transition-transform"
                style={{ backgroundColor: '#FFD700', color: '#E30613' }}
              >
                INTRO
              </button>

              {/* Group buttons */}
              {Object.entries(groups).map(([letter, group]) => {
                const isLightGroup = letter === 'G' || letter === 'J';
                const textColor = isLightGroup ? '#1a1a1a' : '#ffffff';
                return (
                  <button
                    key={letter}
                    onClick={() => {
                      setCurrentTeamIndex(teams.indexOf(group.teams[0]));
                      setCurrentView('album');
                    }}
                    className="rounded-2xl py-2 px-3 font-black active:scale-95 transition-transform text-left flex gap-2 items-center"
                    style={{ backgroundColor: group.color, color: textColor }}
                  >
                    <span className="text-2xl sm:text-3xl font-black leading-none shrink-0">{letter}</span>
                    <div className="flex flex-col gap-0.5 text-sm leading-tight min-w-0">
                      {group.teams.map((team) => (
                        <span key={team}>{teamData[team]?.flag || '🏳️'} {teamData[team]?.name || team}</span>
                      ))}
                    </div>
                  </button>
                );
              })}

              {/* CAMPEONES button */}
              <button
                onClick={() => {
                  setCurrentTeamIndex(teams.indexOf('FWCH1'));
                  setCurrentView('album');
                }}
                className="col-span-2 rounded-2xl p-4 font-black text-2xl sm:text-3xl active:scale-95 transition-transform"
                style={{ backgroundColor: '#0A4E97', color: '#FFD700' }}
              >
                CAMPEONES
              </button>
            </div>
          </div>
        )}

        {currentView === 'groups' && (
          <div className={`lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t shadow-lg transition-colors duration-300 ${darkMode ? 'bg-[#1a1a2e] border-[#2a2a4a]' : 'bg-white border-slate-200'}`}>
            <div className="flex">
              <button
                onClick={() => setCurrentView('home')}
                className={`flex-1 py-4 font-black italic text-sm border-r active:bg-slate-100 transition-colors ${darkMode ? 'border-[#2a2a4a] text-white' : 'border-slate-200'}`}
              >
                HOME
              </button>
              <div className={`flex-1 border-r ${darkMode ? 'border-[#2a2a4a]' : 'border-slate-200'}`} />
              <button
                onClick={() => { setCurrentTeamIndex(0); setCurrentView('album'); }}
                className={`flex-1 py-4 font-black italic text-sm active:bg-slate-100 transition-colors ${darkMode ? 'text-white' : ''}`}
              >
                SIGUIENTE →
              </button>
            </div>
          </div>
        )}

        {currentView === 'album' && (
          <div className={`rounded-3xl px-4 pt-4 pb-24 sm:px-8 sm:pt-8 sm:pb-8 shadow-xl ${getTeamGradientClass(currentTeam)}`}>
            <div className="hidden lg:flex justify-between items-center mb-8 gap-4">
              <button
                onClick={() => currentTeam === 'FWCI1' ? setCurrentView('groups') : prevTeam()}
                className={`rounded-full px-6 py-3 shadow font-bold italic transition-colors duration-300 ${darkMode ? 'bg-[#1a1a2e] text-white border border-[#3a3a5a]' : 'bg-white text-black'}`}
              >
                ← ANTERIOR
              </button>

              <div className="text-center">
                <div className="flex items-center justify-center gap-3 flex-wrap">
                  <h2 className={`text-3xl sm:text-5xl font-black italic uppercase break-words ${isTeamDark(currentTeam) || currentTeam.startsWith('FWCH') ? 'text-white drop-shadow-lg' : 'text-slate-800'}`}>
                    {currentTeamInfo.name}
                  </h2>
                  <button
                    onClick={() => setCurrentView('teams')}
                    className={`${currentTeam === 'COCA' ? 'bg-white text-red-600' : 'bg-red-600 text-white'} px-4 py-2 rounded-2xl font-black uppercase text-lg sm:text-2xl leading-none`}
                  >
                    INDICE
                  </button>
                </div>

                <div className={`mt-2 text-sm uppercase tracking-[0.25em] ${currentTeam === 'COCA' ? 'text-red-100' : isTeamDark(currentTeam) || currentTeam.startsWith('FWCH') ? 'text-white/80' : 'text-slate-500'}`}>
                  {currentTeamInfo.federation}
                </div>

                <div className="mt-3 flex items-center justify-center gap-3">
                  <div className={`text-2xl font-black ${currentTeam === 'COCA' ? 'text-white' : isTeamDark(currentTeam) || currentTeam.startsWith('FWCH') ? 'text-white' : 'text-blue-700'}`}>
                    {currentTeamCompleted}/{stickerCount}
                  </div>
                </div>
              </div>

              <button
                onClick={nextTeam}
                className={`rounded-full px-6 py-3 shadow font-bold italic transition-colors duration-300 ${darkMode ? 'bg-[#1a1a2e] text-white border border-[#3a3a5a]' : 'bg-white text-black'}`}
              >
                {currentTeam === 'COCA' ? 'HOME' : 'SIGUIENTE →'}
              </button>
            </div>

            {/* Mobile identity strip */}
            <div className="lg:hidden flex items-center gap-3 mb-4 px-3 py-2 bg-black/20 rounded-2xl">
              <span className="text-3xl leading-none">{currentTeamInfo.flag}</span>
              <div className="flex-1 min-w-0">
                <div className="font-black italic uppercase text-base leading-none text-white truncate">
                  {currentTeamInfo.name}
                </div>
                <div className="text-[10px] text-white/75 uppercase tracking-widest mt-0.5 truncate">
                  {currentTeamInfo.federation}
                </div>
              </div>
              <div className="font-black text-sm text-white/90 shrink-0">
                {currentTeamCompleted}/{stickerCount}
              </div>
            </div>

            <div className={`overflow-hidden rounded-[2rem] border-4 transition-colors duration-300 ${darkMode ? 'border-[#2a2a4a] bg-[#1e1e30]' : 'border-slate-200 bg-white'} grid lg:grid-cols-2`}>
              {currentTeam.startsWith('FWCH') ? (
                <>
                  <div className={`p-3 sm:p-8 border-b lg:border-b-0 lg:border-r transition-colors duration-300 ${darkMode ? 'border-[#2a2a4a] bg-[#1e1e30]' : 'border-slate-300 bg-[#0d2167]'}`}>
                    <div className="grid grid-cols-4 gap-2 sm:gap-4">
                      <div className="col-span-4 hidden lg:block">
                        <div className="text-3xl sm:text-5xl font-black uppercase leading-none mb-4 break-words text-white">
                          FIFA WORLD CUP HISTORY
                        </div>
                        <div className="flex items-center gap-3 sm:gap-4 mb-4">
                          <div className="text-5xl sm:text-6xl">⭐</div>
                          <div className="font-black uppercase text-[10px] sm:text-sm leading-tight text-white">
                            WORLD CHAMPIONS
                          </div>
                        </div>
                      </div>

                      {historyPageItems[currentTeam].slice(0, Math.ceil(historyPageItems[currentTeam].length / 2)).map((item, index) => {
                        if (item.type === 'printed') {
                          return (
                            <div
                              key={`${currentTeam}-printed-left-${index}`}
                              className={`border-2 rounded-xl sm:rounded-2xl p-2 sm:p-4 w-full flex items-center justify-center text-center aspect-[3/2] transition-colors duration-300 ${darkMode ? 'border-slate-600 bg-[#2a2a4a] text-slate-400' : 'border-slate-300 bg-slate-200 text-slate-600'}`}
                            >
                              <div className="italic uppercase text-[10px] sm:text-sm mt-1 leading-tight font-black">
                                {item.label}
                              </div>
                            </div>
                          );
                        }
                        const sticker = stickers.find((s) => s.code === item.code);
                        return (
                          <Sticker
                            key={item.code}
                            sticker={sticker}
                            horizontal
                            currentTeam={currentTeam}
                            onToggle={toggleSticker}
                            darkMode={darkMode}
                            justPasted={justPastedCode === sticker?.code}
                            highlighted={highlightCode === sticker?.code}
                          />
                        );
                      })}
                    </div>
                  </div>

                  <div className={`p-3 sm:p-8 transition-colors duration-300 ${darkMode ? 'bg-[#252535]' : 'bg-[#faf8f5]'}`}>
                    <div className="grid grid-cols-4 gap-2 sm:gap-4">
                      {historyPageItems[currentTeam].slice(Math.ceil(historyPageItems[currentTeam].length / 2)).map((item, index) => {
                        if (item.type === 'printed') {
                          return (
                            <div
                              key={`${currentTeam}-printed-right-${index}`}
                              className={`border-2 rounded-xl sm:rounded-2xl p-2 sm:p-4 w-full flex items-center justify-center text-center aspect-[3/2] transition-colors duration-300 ${darkMode ? 'border-slate-600 bg-[#2a2a4a] text-slate-400' : 'border-slate-300 bg-slate-200 text-slate-600'}`}
                            >
                              <div className="italic uppercase text-[10px] sm:text-sm mt-1 leading-tight font-black">
                                {item.label}
                              </div>
                            </div>
                          );
                        }
                        const sticker = stickers.find((s) => s.code === item.code);
                        return (
                          <Sticker
                            key={item.code}
                            sticker={sticker}
                            horizontal
                            currentTeam={currentTeam}
                            onToggle={toggleSticker}
                            darkMode={darkMode}
                            justPasted={justPastedCode === sticker?.code}
                            highlighted={highlightCode === sticker?.code}
                          />
                        );
                      })}
                    </div>
                  </div>
                </>
              ) : currentTeam === 'FWCI1' ? (
                <>
                  {/* Mobile: todos los stickers en columna única */}
                  <div className={`lg:hidden p-3 ${getInnerPanelClass(currentTeam, darkMode)}`}>
                    <div className="grid grid-cols-4 gap-2">
                      {stickers.map((sticker) => (
                        <Sticker
                          key={sticker.code}
                          sticker={sticker}
                          currentTeam={currentTeam}
                          onToggle={toggleSticker}
                          darkMode={darkMode}
                          justPasted={justPastedCode === sticker.code}
                          highlighted={highlightCode === sticker.code}
                        />
                      ))}
                    </div>
                  </div>
                  {/* Panel izquierdo - desktop */}
                  <div className={`p-3 sm:p-8 border-b lg:border-b-0 lg:border-r transition-colors duration-300 ${darkMode ? 'border-[#2a2a4a]' : 'border-slate-300'} ${getInnerPanelClass(currentTeam, darkMode)} hidden lg:block`}>
                    <div className="grid grid-cols-4 gap-2 sm:gap-4">
                      <div className="col-span-2">
                        <div className="text-3xl sm:text-5xl font-black uppercase leading-none mb-4 break-words text-white">
                          {currentTeamInfo.name}
                        </div>
                        <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 mb-4 text-center sm:text-left">
                          <div className="text-5xl sm:text-6xl">{currentTeamInfo.flag}</div>
                          <div className="font-black uppercase text-[10px] sm:text-sm leading-tight text-white">
                            {currentTeamInfo.federation}
                          </div>
                        </div>
                      </div>
                      {stickers.slice(0, 2).map((sticker) => (
                        <Sticker
                          key={sticker.code}
                          sticker={sticker}
                          currentTeam={currentTeam}
                          onToggle={toggleSticker}
                          darkMode={darkMode}
                          justPasted={justPastedCode === sticker.code}
                          highlighted={highlightCode === sticker.code}
                        />
                      ))}
                      {stickers.slice(2, 6).map((sticker) => (
                        <Sticker
                          key={sticker.code}
                          sticker={sticker}
                          currentTeam={currentTeam}
                          onToggle={toggleSticker}
                          darkMode={darkMode}
                          justPasted={justPastedCode === sticker.code}
                          highlighted={highlightCode === sticker.code}
                        />
                      ))}
                    </div>
                  </div>
                  {/* Panel derecho - desktop */}
                  <div className={`p-3 sm:p-8 ${getInnerPanelClass(currentTeam, darkMode)} hidden lg:block`}>
                    <div className="grid grid-cols-4 gap-2 sm:gap-4">
                      {stickers.slice(6, 9).map((sticker) => (
                        <Sticker
                          key={sticker.code}
                          sticker={sticker}
                          currentTeam={currentTeam}
                          onToggle={toggleSticker}
                          darkMode={darkMode}
                          justPasted={justPastedCode === sticker.code}
                          highlighted={highlightCode === sticker.code}
                        />
                      ))}
                    </div>
                  </div>
                </>
              ) : (
              <>
              {currentTeam !== 'COCA' && (
                <div className={`lg:hidden p-3 ${getInnerPanelClass(currentTeam, darkMode)}`}>
                  <div className="grid grid-cols-4 gap-2">
                    {stickers.map((sticker) =>
                      sticker.id === 13 ? (
                        <div key={sticker.code} className="col-span-2">
                          <Sticker
                            sticker={sticker}
                            horizontal
                            currentTeam={currentTeam}
                            onToggle={toggleSticker}
                            darkMode={darkMode}
                            justPasted={justPastedCode === sticker.code}
                            highlighted={highlightCode === sticker.code}
                          />
                        </div>
                      ) : (
                        <Sticker
                          key={sticker.code}
                          sticker={sticker}
                          currentTeam={currentTeam}
                          onToggle={toggleSticker}
                          darkMode={darkMode}
                          justPasted={justPastedCode === sticker.code}
                          highlighted={highlightCode === sticker.code}
                        />
                      )
                    )}
                    {teamGroups[currentTeam] && (() => {
                      const grpKey = teamGroups[currentTeam].group;
                      const grpTeams = groups[grpKey]?.teams || [];
                      const currentIdxInGroup = grpTeams.indexOf(currentTeam);
                      const grpColor = groups[grpKey]?.color || '#475569';
                      return (
                        <div
                          className="col-span-3 border-2 rounded-2xl p-2 flex flex-col justify-center"
                          style={darkMode
                            ? { backgroundColor: '#2a2a4a', borderColor: '#475569' }
                            : { backgroundColor: 'rgba(255,255,255,0.6)', borderColor: '#cbd5e1' }
                          }
                        >
                          <div
                            className="font-black uppercase text-[11px] mb-1.5 tracking-widest text-center"
                            style={{ color: darkMode ? '#e2e8f0' : grpColor }}
                          >
                            GRUPO {grpKey}
                          </div>
                          <div className="flex flex-col gap-0.5">
                            {teamGroups[currentTeam].members.map((member, i) => {
                              const isCurrent = i === currentIdxInGroup;
                              const flag = teamData[grpTeams[i]]?.flag || '';
                              return (
                                <div
                                  key={i}
                                  className={`text-[9px] font-black uppercase leading-tight px-1.5 py-0.5 rounded flex items-center gap-1 ${
                                    isCurrent
                                      ? darkMode ? 'bg-white text-slate-800' : 'bg-black text-white'
                                      : darkMode ? 'text-slate-300' : 'text-slate-700'
                                  }`}
                                >
                                  <span>{flag}</span>
                                  <span>{member}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}
              <div className={`p-3 sm:p-8 border-b lg:border-b-0 lg:border-r transition-colors duration-300 ${darkMode ? 'border-[#2a2a4a]' : 'border-slate-300'} ${getInnerPanelClass(currentTeam, darkMode)} ${currentTeam !== 'COCA' ? 'hidden lg:block' : ''}`}>
                <div className="grid grid-cols-4 gap-2 sm:gap-4">
                  <div className="col-span-2 hidden lg:block">
                    <div className={`text-3xl sm:text-5xl font-black uppercase leading-none mb-4 break-words ${currentTeam === 'COCA' ? 'text-black' : ''}`}>
                      {currentTeamInfo.name}
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 mb-4 text-center sm:text-left">
                      <div className="text-5xl sm:text-6xl">
                        {currentTeamInfo.flag}
                      </div>

                      <div className={`font-black uppercase text-[10px] sm:text-sm leading-tight max-w-[180px] ${currentTeam === 'COCA' ? 'text-black' : ''}`}>
                        {currentTeamInfo.federation}
                      </div>
                    </div>
                  </div>

                  {stickers.slice(0, 2).map((sticker) => (
                    <Sticker
                      key={sticker.code}
                      sticker={sticker}
                      currentTeam={currentTeam}
                      onToggle={toggleSticker}
                      darkMode={darkMode}
                      justPasted={justPastedCode === sticker.code}
                      highlighted={highlightCode === sticker.code}
                    />
                  ))}

                  {stickers.slice(2, 10).map((sticker) => (
                    <Sticker
                      key={sticker.code}
                      sticker={sticker}
                      currentTeam={currentTeam}
                      onToggle={toggleSticker}
                      darkMode={darkMode}
                      justPasted={justPastedCode === sticker.code}
                      highlighted={highlightCode === sticker.code}
                    />
                  ))}
                </div>
              </div>

              <div className={`p-3 sm:p-8 ${getInnerPanelClass(currentTeam, darkMode)} ${currentTeam !== 'COCA' ? 'hidden lg:block' : ''}`}>
                <div className="grid grid-cols-4 gap-2 sm:gap-4">
                  {stickers.slice(10, 12).map((sticker) => (
                    <Sticker
                      key={sticker.code}
                      sticker={sticker}
                      currentTeam={currentTeam}
                      onToggle={toggleSticker}
                      darkMode={darkMode}
                      justPasted={justPastedCode === sticker.code}
                      highlighted={highlightCode === sticker.code}
                    />
                  ))}

                  {!currentTeam.startsWith('FWCH') && currentTeam !== 'COCA' && stickers[12] && (
                    <div className="col-span-2">
                      <Sticker
                        sticker={stickers[12]}
                        horizontal
                        currentTeam={currentTeam}
                        onToggle={toggleSticker}
                        darkMode={darkMode}
                        justPasted={justPastedCode === stickers[12].code}
                        highlighted={highlightCode === stickers[12].code}
                      />
                    </div>
                  )}

                  {stickers.slice(13).map((sticker) => (
                    <Sticker
                      key={sticker.code}
                      sticker={sticker}
                      currentTeam={currentTeam}
                      onToggle={toggleSticker}
                      darkMode={darkMode}
                      justPasted={justPastedCode === sticker.code}
                      highlighted={highlightCode === sticker.code}
                    />
                  ))}

                  {teamGroups[currentTeam] && (() => {
                    const grpKey = teamGroups[currentTeam].group;
                    const grpTeams = groups[grpKey]?.teams || [];
                    const currentIdxInGroup = grpTeams.indexOf(currentTeam);
                    const grpColor = groups[grpKey]?.color || '#475569';
                    return (
                      <div
                        className="border-2 rounded-2xl p-2 h-full flex flex-col justify-center"
                        style={darkMode
                          ? { backgroundColor: '#2a2a4a', borderColor: '#475569' }
                          : { backgroundColor: 'rgba(255,255,255,0.6)', borderColor: '#cbd5e1' }
                        }
                      >
                        <div
                          className="font-black uppercase text-[11px] mb-1.5 tracking-widest text-center"
                          style={{ color: darkMode ? '#e2e8f0' : grpColor }}
                        >
                          GRUPO {grpKey}
                        </div>
                        <div className="flex flex-col gap-0.5">
                          {teamGroups[currentTeam].members.map((member, i) => {
                            const isCurrent = i === currentIdxInGroup;
                            const flag = teamData[grpTeams[i]]?.flag || '';
                            return (
                              <div
                                key={i}
                                className={`text-[9px] font-black uppercase leading-tight px-1.5 py-0.5 rounded flex items-center gap-1 ${
                                  isCurrent
                                    ? darkMode ? 'bg-white text-slate-800' : 'bg-black text-white'
                                    : darkMode ? 'text-slate-300' : 'text-slate-700'
                                }`}
                              >
                                <span>{flag}</span>
                                <span>{member}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
              </>
              )}
            </div>

          </div>
        )}

      {currentView === 'album' && (
        <div className={`lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t shadow-lg transition-colors duration-300 ${darkMode ? 'bg-[#1a1a2e] border-[#2a2a4a]' : 'bg-white border-slate-200'}`}>
          <div className="flex">
            <button
              onClick={() => currentTeam === 'FWCI1' ? setCurrentView('groups') : prevTeam()}
              className={`flex-1 py-4 font-black italic text-sm border-r active:bg-slate-100 transition-colors ${darkMode ? 'border-[#2a2a4a] text-white' : 'border-slate-200'}`}
            >
              ← ANTERIOR
            </button>
            <button
              onClick={() => setCurrentView('teams')}
              className={`flex-1 py-4 font-black uppercase text-sm border-r active:bg-slate-100 transition-colors ${darkMode ? 'border-[#2a2a4a] text-white' : 'border-slate-200'}`}
            >
              ÍNDICE
            </button>
            <button
              onClick={nextTeam}
              className={`flex-1 py-4 font-black italic text-sm active:bg-slate-100 transition-colors ${darkMode ? 'text-white' : ''}`}
            >
              {currentTeam === 'COCA' ? 'HOME' : 'SIGUIENTE →'}
            </button>
          </div>
        </div>
      )}

      </main>

      {showStats && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
          <div className={`rounded-3xl p-6 sm:p-8 shadow-2xl w-full max-w-md transition-colors duration-300 ${darkMode ? 'bg-[#1e1e30] text-white' : 'bg-white'}`}>
            <h3 className="text-2xl font-black italic uppercase mb-6">Estadísticas</h3>
            <div className="space-y-3 font-black">
              <div>Figuritas completadas: {completedCount} / {TOTAL_STICKERS}</div>
              <div>Porcentaje completado: {completionPercent}%</div>
              <div>Me faltan: {remainingCount}</div>
              <div>Brillantes: {brilliantCompletedCount} / 68</div>
              <div>Repetidas: {repeatedCount}</div>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={handleExport}
                className="bg-green-600 text-white px-6 py-3 rounded-2xl font-black"
              >
                EXPORTAR
              </button>
              <label className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black cursor-pointer">
                IMPORTAR
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleImport}
                />
              </label>
              {importMessage && (
                <span className="w-full text-green-600 font-black">{importMessage}</span>
              )}
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                onClick={() => {
                  setShowStats(false);
                  setCurrentView('stats-selections');
                }}
                className="bg-red-600 text-white px-6 py-3 rounded-2xl font-black"
              >
                Estadísticas Selecciones
              </button>
              <button
                onClick={() => setShowQR(true)}
                className="bg-purple-600 text-white px-6 py-3 rounded-2xl font-black"
              >
                Generar QR
              </button>
              <button
                onClick={() => setShowStats(false)}
                className="bg-red-600 text-white px-6 py-3 rounded-2xl font-black"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
      {showQR && <QRModal onClose={() => setShowQR(false)} />}
      {celebration && (
        <CelebrationModal celebration={celebration} onClose={() => setCelebration(null)} />
      )}
    </div>
  );
}


function Sticker({ sticker, horizontal = false, onToggle, currentTeam, darkMode = false, justPasted = false, highlighted = false }) {
  const labels = {
    shield: 'Escudo',
    team: 'Foto Equipo'
  };

  const isPlayerSticker = sticker.type === 'player'
    && !sticker.code.startsWith('FWC')
    && !sticker.code.startsWith('CC')
    && sticker.code !== '00';

  const isShieldSticker = sticker.type === 'shield';

  // empty → slate-300 (más visible), completed → green-400 (verde sólido), repeated → slate-400
  const decorColor = sticker.repeated ? '#94a3b8' : sticker.completed ? '#4ade80' : '#cbd5e1';

  const svgStyle = { position: 'absolute', top: '6%', left: '20%', width: '60%', opacity: 0.5, pointerEvents: 'none', zIndex: 0 };

  const repeatedBg = darkMode ? 'bg-slate-300 border-slate-400' : 'bg-slate-500 border-slate-500';
  const emptyBg = darkMode ? 'bg-[#2a2a4a] border-slate-600' : 'bg-white border-slate-300';
  const completedBg = darkMode ? 'bg-green-900 border-green-500' : 'bg-green-100 border-green-500';

  const repeatedCodeClass = darkMode ? 'text-slate-700 font-extrabold' : 'text-slate-100 font-extrabold';
  const repeatedLabelClass = darkMode ? 'text-slate-800 font-extrabold' : 'text-slate-100';

  const paniniStyle = sticker.code === '00' && !sticker.repeated ? {
    background: 'linear-gradient(135deg, #c0c0c0, #f8f8f8, #a8a8a8, #e8e8e8, #c0c0c0)',
    borderColor: '#a0a0a0'
  } : undefined;

  const animClass = justPasted ? 'sticker-paste' : highlighted ? 'sticker-pulse' : '';

  return (
    <button
      onClick={() => onToggle(sticker.code)}
      style={paniniStyle}
      className={`relative border-2 rounded-xl sm:rounded-2xl p-2 sm:p-4 w-full flex items-center justify-center text-center transition active:opacity-60 ${sticker.horizontal || horizontal ? 'aspect-[3/2]' : 'aspect-[2/3]'} ${sticker.repeated ? repeatedBg : sticker.code === '00' ? '' : sticker.code === 'FWC6' ? 'bg-red-200 border-red-400' : sticker.code === 'FWC7' ? 'bg-green-200 border-green-500' : sticker.code === 'FWC8' ? 'bg-blue-200 border-blue-500' : sticker.completed ? completedBg : emptyBg} ${sticker.completed || sticker.repeated ? 'border-[4px] scale-[1.02]' : 'border-2'} ${animClass}`}
    >
      {isPlayerSticker && (
        <svg viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={svgStyle}>
          <circle cx="50" cy="35" r="22" fill={decorColor} />
          <path d="M 50 57 C 28 57 10 75 10 120 L 90 120 C 90 75 72 57 50 57 Z" fill={decorColor} />
        </svg>
      )}
      {isShieldSticker && (
        <svg viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={svgStyle}>
          <path d="M 10 10 L 90 10 L 90 65 Q 90 105 50 118 Q 10 105 10 65 Z" fill={decorColor} />
        </svg>
      )}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div className={`text-[9px] sm:text-xs uppercase break-all ${sticker.repeated ? repeatedCodeClass : sticker.completed ? 'text-black font-extrabold' : 'text-slate-400 font-black'}`}>
          {sticker.displayCode || sticker.code}
        </div>

        <div className={`italic uppercase text-[10px] sm:text-sm mt-1 leading-tight ${sticker.completed || sticker.repeated ? 'font-extrabold' : 'font-black'} ${sticker.repeated ? repeatedLabelClass : currentTeam === 'COCA' || currentTeam.startsWith('FWCH') ? 'text-black' : ''}`}>
          {sticker.displayLabel || sticker.label || labels[sticker.type] || `Jugador ${sticker.id}`}
        </div>
      </div>
    </button>
  );
}

const FWC_LABELS = {
  '00': 'PANINI', FWC1: 'Logo Copa 1', FWC2: 'Logo Copa 2', FWC3: 'Mascotas',
  FWC4: 'Póster', FWC5: 'Balón Oficial', FWC6: 'Póster Canadá',
  FWC7: 'Póster México', FWC8: 'Póster USA',
  FWC9: 'ITALIA 1934', FWC10: 'URUGUAY 1950', FWC11: 'RF ALEMANIA 1954',
  FWC12: 'BRASIL 1958', FWC13: 'BRASIL 1962', FWC14: 'RF ALEMANIA 1974',
  FWC15: 'ARGENTINA 1986', FWC16: 'BRASIL 1994', FWC17: 'BRASIL 2002',
  FWC18: 'ITALIA 2006', FWC19: 'ALEMANIA 2014', FWC20: 'ARGENTINA 2022',
};

function getTeamForCode(code) {
  if (code === '00') return 'FWCI1';
  const fwcMatch = code.match(/^FWC(\d+)$/);
  if (fwcMatch) {
    const n = parseInt(fwcMatch[1]);
    if (n <= 8) return 'FWCI1';
    if (n <= 14) return 'FWCH1';
    return 'FWCH2';
  }
  if (code.startsWith('CC')) return 'COCA';
  const m = code.match(/^([A-Z]+)\d+$/);
  return (m && teamData[m[1]]) ? m[1] : null;
}

function getPlayerNameForCode(code, team) {
  if (code === '00' || code.match(/^FWC\d+$/)) return FWC_LABELS[code] || code;
  if (team === 'COCA') {
    const m = code.match(/^CC(\d+)$/);
    return m ? (playerNames.CC?.[parseInt(m[1])] || code) : code;
  }
  const m = code.match(/^[A-Z]+(\d+)$/);
  if (m) {
    const id = parseInt(m[1]);
    if (id === 1) return 'Escudo';
    if (id === 13) return 'Foto equipo';
    return playerNames[team]?.[id] || `Jugador ${id}`;
  }
  return code;
}

function QRModal({ onClose }) {
  const qrRef = useRef(null);
  const url = window.location.origin + window.location.pathname + '?view=repetidas';

  useEffect(() => {
    if (qrRef.current && window.QRCode) {
      new window.QRCode(qrRef.current, { text: url, width: 200, height: 200 });
    }
  }, []);

  return (
    <div className="fixed inset-0 z-[70] bg-black/70 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 shadow-2xl flex flex-col items-center gap-4 max-w-xs w-full">
        <h3 className="text-lg font-black italic uppercase">Figuritas Repetidas</h3>
        <div ref={qrRef} />
        <p className="text-xs text-slate-400 text-center break-all">{url}</p>
        <button
          onClick={onClose}
          className="bg-red-600 text-white px-6 py-3 rounded-2xl font-black w-full"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}

function RepeatidasView() {
  const [stickerData, setStickerData] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        if (progressDocRef) {
          const snap = await getDoc(progressDocRef);
          if (snap.exists()) {
            const data = snap.data();
            setStickerData(data?.stickers || {});
            return;
          }
        }
        const local = localStorage.getItem(LOCAL_STORAGE_KEY);
        setStickerData(local ? JSON.parse(local) : {});
      } catch {
        setStickerData({});
      }
    };
    load();
  }, []);

  const grouped = useMemo(() => {
    if (!stickerData) return [];
    const byTeam = {};
    for (const [code, value] of Object.entries(stickerData)) {
      if (value !== 'repeated') continue;
      const team = getTeamForCode(code);
      if (!team) continue;
      if (!byTeam[team]) byTeam[team] = [];
      byTeam[team].push(code);
    }
    return teams
      .filter(t => byTeam[t])
      .map(t => ({ team: t, info: teamData[t], codes: byTeam[t] }));
  }, [stickerData]);

  if (!stickerData) {
    return (
      <div className="min-h-screen bg-[#880E4F] flex items-center justify-center">
        <div className="text-white font-black text-xl">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#880E4F]">
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <h1 className="text-lg font-black italic uppercase text-slate-800">
            Figuritas repetidas de {ALBUM_OWNER}
          </h1>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest">FIFA World Cup 2026</p>
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-5 space-y-3">
        {grouped.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center text-slate-800">
            <div className="text-4xl mb-3">🙌</div>
            <div className="font-black text-xl">¡No hay repetidas!</div>
            <div className="text-slate-500 mt-2 text-sm">
              Cuando tengas figuritas repetidas aparecerán acá.
            </div>
          </div>
        ) : grouped.map(({ team, info, codes }) => (
          <div key={team} className="bg-white rounded-2xl p-4 shadow">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl leading-none">{info?.flag || '🏳️'}</span>
              <div>
                <div className="font-black uppercase text-sm text-slate-800">{info?.name || team}</div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider">
                  {codes.length} repetida{codes.length !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {codes.map(code => {
                const name = getPlayerNameForCode(code, team);
                return (
                  <span key={code} className="bg-slate-500 text-white text-xs font-black px-2.5 py-1 rounded-lg">
                    {code}{name !== code ? ` · ${name}` : ''}
                  </span>
                );
              })}
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}

// ─── Confetti ────────────────────────────────────────────────────────────────

function Confetti({ colors }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width = window.innerWidth;
    const H = canvas.height = window.innerHeight;

    const particles = Array.from({ length: 120 }, () => ({
      x: Math.random() * W,
      y: -10 - Math.random() * 220,
      w: 7 + Math.random() * 10,
      h: 3 + Math.random() * 6,
      color: colors[Math.floor(Math.random() * colors.length)],
      rot: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.13,
      vx: (Math.random() - 0.5) * 3.5,
      vy: 2.5 + Math.random() * 3.5,
      alpha: 1,
    }));

    let raf;
    const t0 = Date.now();

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      const elapsed = Date.now() - t0;
      let alive = false;

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.rotSpeed;
        if (elapsed > 1800) p.alpha = Math.max(0, p.alpha - 0.016);
        if (p.alpha > 0 && p.y < H + 20) alive = true;

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }

      if (alive) raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 190 }}
    />
  );
}

// ─── CelebrationModal ────────────────────────────────────────────────────────

function CelebrationModal({ celebration, onClose }) {
  const isAlbum = celebration.type === 'album';
  const team = celebration.team;
  const teamInfo = team ? teamData[team] : null;
  const themeKey = team ? getThemeKey(team) : null;
  const theme = themeKey ? teamThemes[themeKey] : null;

  const gradientClass = isAlbum
    ? 'from-yellow-400 via-pink-500 to-purple-600'
    : theme?.gradient || 'from-emerald-500 to-green-600';

  const confettiColors = isAlbum
    ? ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FF8E53', '#FFEAA7', '#ffffff']
    : team === 'COCA'
    ? ['#e41f1f', '#ff4444', '#ff6666', '#cc0000', '#ffffff', '#ffcccc']
    : getTeamConfettiColors(team);

  const isDark = isAlbum || theme?.dark;

  return (
    <div className="fixed inset-0 z-[160]">
      <Confetti colors={confettiColors} />
      <div
        className="absolute inset-0 bg-black/60 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div
          className={`celebrate-card bg-gradient-to-br ${gradientClass} rounded-3xl p-8 shadow-2xl max-w-sm w-full text-center`}
          onClick={e => e.stopPropagation()}
        >
          <div className="text-7xl mb-4 drop-shadow-lg select-none">
            {isAlbum ? '🏆' : teamInfo?.flag || '🏅'}
          </div>
          <div className={`text-4xl font-black italic uppercase mb-2 drop-shadow ${isDark ? 'text-white' : 'text-slate-800'}`}>
            ¡Felicitaciones!
          </div>
          <div className={`text-xl font-black mb-8 ${isDark ? 'text-white/90' : 'text-slate-700'}`}>
            {isAlbum
              ? '¡Completaste el álbum!'
              : `¡Completaste ${teamInfo?.name || team}!`}
          </div>
          <button
            onClick={onClose}
            className={`px-10 py-4 rounded-2xl font-black text-xl shadow-lg active:scale-95 transition-transform ${isDark ? 'bg-white text-slate-800 hover:bg-slate-100' : 'bg-slate-800 text-white hover:bg-slate-700'}`}
          >
            ¡Gracias! 🎉
          </button>
        </div>
      </div>
    </div>
  );
}
