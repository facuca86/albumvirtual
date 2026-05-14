import React, { useEffect, useMemo, useRef, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

const LOCAL_STORAGE_KEY = 'paniniWorldCup2026_stickers';

const teams = [
  'FWCI1',
  'FWCI2',
  'MEX','RSA','KOR','CZE','CAN','BIH','QAT','SUI','BRA','MAR','HAI','SCO',
  'USA','PAR','AUS','TUR','GER','CUW','CIV','ECU','NED','JPN','SWE','TUN',
  'BEL','EGY','IRN','NZL','ESP','CPV','KSA','URU','FRA','SEN','IRQ','NOR',
  'ARG','ALG','AUT','JOR','POR','COD','UZB','COL','ENG','CRO','GHA','PAN',
  'FWCH1',
  'FWCH2',
  'COCA'
];

const teamData = {
  FWCI1: { name: 'FWC Intro', federation: 'Opening Section', flag: '🏆' },
  FWCI2: { name: 'FWC Intro', federation: 'Opening Section', flag: '🌎' },
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
  NOR: { name: 'Noruega', federation: 'Federación Noruega de Fútbol', flag: '🇳🇴' },
  RSA: { name: 'Sudáfrica', federation: 'South African Football Association', flag: '🇿🇦' },
  KOR: { name: 'República de Corea', federation: 'Korea Football Association', flag: '🇰🇷' },
  CZE: { name: 'República Checa', federation: 'Football Association of the Czech Republic', flag: '🇨🇿' },
  CAN: { name: 'Canadá', federation: 'Canada Soccer Association', flag: '🇨🇦' },
  BIH: { name: 'Bosnia y Herzegovina', federation: 'Nogometni/Fudbalski Savez Bosne i Hercegovine', flag: '🇧🇦' },
  QAT: { name: 'Catar', federation: 'Qatar Football Association', flag: '🇶🇦' },
  SUI: { name: 'Suiza', federation: 'Schweizerischer Fussballverband', flag: '🇨🇭' },
  MAR: { name: 'Marruecos', federation: 'Fédération Royale Marocaine de Football', flag: '🇲🇦' },
  HAI: { name: 'Haití', federation: 'Fédération Haïtienne de Football', flag: '🇭🇹' },
  SCO: { name: 'Escocia', federation: 'Scottish Football Association', flag: '🏴' },
  PAR: { name: 'Paraguay', federation: 'Asociación Paraguaya de Fútbol', flag: '🇵🇾' },
  AUS: { name: 'Australia', federation: 'Football Australia', flag: '🇦🇺' },
  TUR: { name: 'Turquía', federation: 'Türkiye Futbol Federasyonu', flag: '🇹🇷' },
  CUW: { name: 'Curazao', federation: 'Curaçao Football Federation', flag: '🇨🇼' },
  CIV: { name: 'Costa de Marfil', federation: 'Fédération Ivoirienne de Football', flag: '🇨🇮' },
  ECU: { name: 'Ecuador', federation: 'Federación Ecuatoriana de Fútbol', flag: '🇪🇨' },
  NED: { name: 'Países Bajos', federation: 'Koninklijke Nederlandse Voetbalbond', flag: '🇳🇱' },
  JPN: { name: 'Japón', federation: 'Japan Football Association', flag: '🇯🇵' },
  SWE: { name: 'Suecia', federation: 'Svenska Fotbollförbundet', flag: '🇸🇪' },
  TUN: { name: 'Túnez', federation: 'Fédération Tunisienne de Football', flag: '🇹🇳' }
};

const completeTeamData = {
  ...teamData,

  RSA: { name: 'Sudáfrica', federation: 'South African Football Association', flag: '🇿🇦' },
  KOR: { name: 'República de Corea', federation: 'Korea Football Association', flag: '🇰🇷' },
  CZE: { name: 'República Checa', federation: 'Football Association of the Czech Republic', flag: '🇨🇿' },
  CAN: { name: 'Canadá', federation: 'Canada Soccer Association', flag: '🇨🇦' },
  BIH: { name: 'Bosnia y Herzegovina', federation: 'Nogometni/Fudbalski Savez Bosne i Hercegovine', flag: '🇧🇦' },
  QAT: { name: 'Catar', federation: 'Qatar Football Association', flag: '🇶🇦' },
  SUI: { name: 'Suiza', federation: 'Schweizerischer Fussballverband', flag: '🇨🇭' },
  MAR: { name: 'Marruecos', federation: 'Fédération Royale Marocaine de Football', flag: '🇲🇦' },
  HAI: { name: 'Haití', federation: 'Fédération Haïtienne de Football', flag: '🇭🇹' },
  SCO: { name: 'Escocia', federation: 'Scottish Football Association', flag: '🏴' },
  PAR: { name: 'Paraguay', federation: 'Asociación Paraguaya de Fútbol', flag: '🇵🇾' },
  AUS: { name: 'Australia', federation: 'Football Australia', flag: '🇦🇺' },
  TUR: { name: 'Turquía', federation: 'Türkiye Futbol Federasyonu', flag: '🇹🇷' },
  CUW: { name: 'Curazao', federation: 'Curaçao Football Federation', flag: '🇨🇼' },
  CIV: { name: 'Costa de Marfil', federation: 'Fédération Ivoirienne de Football', flag: '🇨🇮' },
  ECU: { name: 'Ecuador', federation: 'Federación Ecuatoriana de Fútbol', flag: '🇪🇨' },
  NED: { name: 'Países Bajos', federation: 'Koninklijke Nederlandse Voetbalbond', flag: '🇳🇱' },
  JPN: { name: 'Japón', federation: 'Japan Football Association', flag: '🇯🇵' },
  SWE: { name: 'Suecia', federation: 'Svenska Fotbollförbundet', flag: '🇸🇪' },
  TUN: { name: 'Túnez', federation: 'Fédération Tunisienne de Football', flag: '🇹🇳' },
  BEL: { name: 'Bélgica', federation: 'Royal Belgian Football Association', flag: '🇧🇪' },
  EGY: { name: 'Egipto', federation: 'Egyptian Football Association', flag: '🇪🇬' },
  IRN: { name: 'Irán', federation: 'Football Federation Islamic Republic of Iran', flag: '🇮🇷' },
  NZL: { name: 'Nueva Zelanda', federation: 'New Zealand Football', flag: '🇳🇿' },
  CPV: { name: 'Cabo Verde', federation: 'Federação Caboverdiana de Futebol', flag: '🇨🇻' },
  KSA: { name: 'Arabia Saudita', federation: 'Saudi Arabian Football Federation', flag: '🇸🇦' },
  SEN: { name: 'Senegal', federation: 'Fédération Sénégalaise de Football', flag: '🇸🇳' },
  IRQ: { name: 'Irak', federation: 'Iraq Football Association', flag: '🇮🇶' },
  ALG: { name: 'Argelia', federation: 'Fédération Algérienne de Football', flag: '🇩🇿' },
  AUT: { name: 'Austria', federation: 'Österreichischer Fußball-Bund', flag: '🇦🇹' },
  JOR: { name: 'Jordania', federation: 'Jordan Football Association', flag: '🇯🇴' },
  POR: { name: 'Portugal', federation: 'Federação Portuguesa de Futebol', flag: '🇵🇹' },
  COD: { name: 'Congo DR', federation: 'Fédération Congolaise de Football-Association', flag: '🇨🇩' },
  UZB: { name: 'Uzbekistán', federation: 'Uzbekistan Football Association', flag: '🇺🇿' },
  COL: { name: 'Colombia', federation: 'Federación Colombiana de Fútbol', flag: '🇨🇴' },
  CRO: { name: 'Croacia', federation: 'Croatian Football Federation', flag: '🇭🇷' },
  GHA: { name: 'Ghana', federation: 'Ghana Football Association', flag: '🇬🇭' },
  USA: { name: 'Estados Unidos', federation: 'United States Soccer Federation', flag: '🇺🇸' }
};

Object.assign(teamData, completeTeamData);

const progressDocRef = db ? doc(db, 'albumProgress', 'paniniWorldCup2026') : null;

export default function PaniniAlbum2026() {
  const [currentView, setCurrentView] = useState('home');
  const [currentTeamIndex, setCurrentTeamIndex] = useState(0);
  const [completed, setCompleted] = useState({});
  const [showStats, setShowStats] = useState(false);
  const isInitialLoad = useRef(true);

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

  const stickerCount = currentTeam.startsWith('FWCI') ? 8 : currentTeam.startsWith('FWCH') ? 12 : currentTeam === 'COCA' ? 14 : 20;


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
          ? 'PANINI'
          : `FWC${id - 1}`
        : `${currentTeam}${id}`;

      let type = 'player';
      let label = `Jugador ${id}`;
      let horizontal = false;

      if (currentTeam === 'FWCI2') {
        if (id === 1) {
          code = 'FWC5';
          label = 'Balón Oficial';
        }
        if (id === 2) {
          code = 'FWC6';
          label = 'Poster Canadá';
        }
        if (id === 3) {
          code = 'FWC7';
          label = 'Poster México';
        }
        if (id === 4) {
          code = 'FWC8';
          label = 'Poster USA';
        }
      } else if (currentTeam.startsWith('FWCI')) {
        if (id === 1) {
          label = '';
          horizontal = true;
        }
        if (id === 2) {
          label = 'Logo Copa 1';
          horizontal = true;
        }
        if (id === 3) {
          label = 'Logo Copa 2';
          horizontal = true;
        }
        if (id === 4) {
          label = 'Mascotas';
          horizontal = true;
        }
        if (id === 5) {
          label = 'Poster';
        }
      } else if (currentTeam === 'COCA') {
        label = `Jugador ${id}`;
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
        label = type === 'shield' ? 'Escudo' : type === 'team' ? 'Foto Equipo' : `Jugador ${id}`;
        horizontal = id === 13;
      }

      return {
        id,
        code,
        completed: completed[code] || false,
        type,
        label,
        horizontal
      };
    });
  }, [currentTeam, completed, stickerCount]);

  const toggleSticker = (code) => {
    setCompleted((prev) => ({
      ...prev,
      [code]: !prev[code]
    }));
  };

  const nextTeam = () => {
    if (currentTeam === 'COCA') {
      setCurrentView('home');
      return;
    }

    setCurrentTeamIndex((prev) =>
      prev >= teams.length - 1 ? teams.length - 1 : prev + 1
    );
  };

  const prevTeam = () => {
    setCurrentTeamIndex((prev) =>
      prev <= 0 ? 0 : prev - 1
    );
  };

  const completedCount = Object.values(completed).filter(Boolean).length;
  const completionPercent = Math.round((completedCount / 982) * 100);

  const currentTeamCompleted = currentTeam.startsWith('FWCI')
    ? ['FWC1','FWC2','FWC3','FWC4','FWC5','FWC6','FWC7','FWC8']
        .filter((code) => completed[code]).length
    : currentTeam.startsWith('FWCH')
    ? ['FWC9','FWC10','FWC11','FWC12','FWC13','FWC14','FWC15','FWC16','FWC17','FWC18','FWC19','FWC20']
        .filter((code) => completed[code]).length
    : stickers.filter((s) => s.completed).length;

  return (
    <div className="min-h-screen bg-[#880E4F] text-slate-800">
      <header className="bg-white border-b shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row gap-4 sm:gap-0 justify-between items-center">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black italic text-center sm:text-left">
              ÁLBUM VIRTUAL 2026
            </h1>

            <p className="text-xs uppercase tracking-[0.3em] text-slate-500 text-center sm:text-left">
              FIFA WORLD CUP
            </p>

            <div className="mt-2 text-sm font-black text-pink-800">
              {completionPercent}% COMPLETADO
            </div>
          </div>

          <button
            onClick={() => setCurrentView('home')}
            className="bg-red-600 text-white px-6 py-3 rounded-2xl font-black"
          >
            HOME
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-8">
        {currentView === 'home' && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <button
              onClick={() => {
                setCurrentTeamIndex(0);
                setCurrentView('album');
              }}
              className="bg-white rounded-3xl p-8 shadow-xl text-left hover:scale-105 transition"
            >
              <div className="text-3xl font-black italic uppercase">
                Explorar Álbum
              </div>
            </button>

            <button
              onClick={() => setCurrentView('teams')}
              className="bg-white rounded-3xl p-8 shadow-xl text-left hover:scale-105 transition"
            >
              <div className="text-3xl font-black italic uppercase">
                Indice
              </div>
            </button>

            <button
              onClick={() => setShowStats(true)}
              className="bg-white rounded-3xl p-8 shadow-xl text-left hover:scale-105 transition"
            >
              <div className="text-3xl font-black italic uppercase">
                Estadisticas
              </div>
            </button>
          </div>
        )}

        {currentView === 'teams' && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {teams.map((team) => (
              <button
                key={team}
                onClick={() => {
                  setCurrentTeamIndex(teams.indexOf(team));
                  setCurrentView('album');
                }}
                className="bg-white rounded-2xl p-4 shadow font-black italic hover:scale-105 transition"
              >
                {teamData[team]?.name || team}
              </button>
            ))}
          </div>
        )}

        {currentView === 'album' && (
          <div className={`rounded-3xl p-4 sm:p-8 shadow-xl ${currentTeam === 'COCA' ? 'bg-red-600 text-white' : currentTeam.startsWith('FWCH') ? 'bg-[#0d1b4d] text-white' : currentTeam.startsWith('FWCI') ? 'bg-gradient-to-r from-green-100 via-blue-100 to-red-100' : 'bg-white'}`}>
            <div className="flex flex-col lg:flex-row justify-between items-center mb-8 gap-4">
              <button
                onClick={() => currentTeam === 'FWCI1' ? setCurrentView('home') : prevTeam()}
                className="bg-white text-black rounded-full px-6 py-3 shadow font-bold italic"
              >
                {currentTeam === 'FWCI1' ? 'HOME' : '← ANTERIOR'}
              </button>

              <div className="text-center">
                <h2 className="text-3xl sm:text-5xl font-black italic uppercase break-words">
                  {currentTeamInfo.name}
                </h2>

                <div className={`mt-2 text-sm uppercase tracking-[0.25em] ${currentTeam === 'COCA' ? 'text-red-100' : 'text-slate-500'}`}>
                  {currentTeamInfo.federation}
                </div>

                <div className="mt-3 flex items-center justify-center gap-3">
                  <div className={`text-2xl font-black ${currentTeam === 'COCA' ? 'text-white' : 'text-blue-700'}`}>
                    {currentTeamCompleted}/{stickerCount}
                  </div>
                </div>
              </div>

              <button
                onClick={nextTeam}
                className="bg-white text-black rounded-full px-6 py-3 shadow font-bold italic"
              >
                {currentTeam === 'COCA' ? 'HOME' : 'SIGUIENTE →'}
              </button>
            </div>

            <div className="grid lg:grid-cols-2 overflow-hidden rounded-[2rem] border-4 border-slate-200 bg-white">
              {currentTeam.startsWith('FWCH') ? (
                <>
                  <div className="p-3 sm:p-8 border-b lg:border-b-0 lg:border-r border-slate-300 bg-[#f7f5f2]">
                    <div className="grid grid-cols-4 gap-2 sm:gap-4">
                      <div className="col-span-4">
                        <div className="text-3xl sm:text-5xl font-black uppercase leading-none mb-4 break-words text-[#0d1b4d]">
                          FIFA WORLD CUP HISTORY
                        </div>
                        <div className="flex items-center gap-3 sm:gap-4 mb-4">
                          <div className="text-5xl sm:text-6xl">⭐</div>
                          <div className="font-black uppercase text-[10px] sm:text-sm leading-tight text-[#0d1b4d]">
                            WORLD CHAMPIONS
                          </div>
                        </div>
                      </div>

                      {historyPageItems[currentTeam].slice(0, Math.ceil(historyPageItems[currentTeam].length / 2)).map((item, index) => {
                        if (item.type === 'printed') {
                          return (
                            <div
                              key={`${currentTeam}-printed-left-${index}`}
                              className="border-2 border-slate-300 rounded-xl sm:rounded-2xl p-2 sm:p-4 w-full flex items-center justify-center text-center aspect-[3/2] bg-slate-200 text-slate-600"
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
                          />
                        );
                      })}
                    </div>
                  </div>

                  <div className="p-3 sm:p-8 bg-[#faf8f5]">
                    <div className="grid grid-cols-4 gap-2 sm:gap-4">
                      {historyPageItems[currentTeam].slice(Math.ceil(historyPageItems[currentTeam].length / 2)).map((item, index) => {
                        if (item.type === 'printed') {
                          return (
                            <div
                              key={`${currentTeam}-printed-right-${index}`}
                              className="border-2 border-slate-300 rounded-xl sm:rounded-2xl p-2 sm:p-4 w-full flex items-center justify-center text-center aspect-[3/2] bg-slate-200 text-slate-600"
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
                          />
                        );
                      })}
                    </div>
                  </div>
                </>
              ) : (
              <>
              <div className={`p-3 sm:p-8 border-b lg:border-b-0 lg:border-r border-slate-300 ${currentTeam === 'FWCI1' ? 'bg-gradient-to-br from-green-200 via-yellow-100 to-blue-200' : currentTeam === 'FWCI2' ? 'bg-[#555555]' : currentTeam.startsWith('FWCH') ? 'bg-[#0d1b4d]' : 'bg-[#f7f5f2]'}`}>
                <div className="grid grid-cols-4 gap-2 sm:gap-4">
                  <div className="col-span-2">
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

                  {currentTeam === 'FWCI1' ? (
                    <>
                      <div className="col-span-2">
                        <Sticker
                          sticker={stickers[0]}
                          horizontal
                          currentTeam={currentTeam}
                          onToggle={toggleSticker}
                        />
                      </div>

                      <div className="col-span-4 border-4 border-yellow-500 rounded-xl p-6 bg-gradient-to-br from-yellow-300 via-yellow-200 to-amber-100 text-black w-full mt-2 shadow-inner">
                        <div className="text-center font-black uppercase text-sm mb-3">
                          Cuadro de Honor
                        </div>

                        <div className="grid grid-cols-4 gap-x-6 gap-y-3 text-[9px] sm:text-[11px] font-black leading-tight uppercase place-items-center text-center">
                          <div>Uruguay 1930</div>
                          <div>Italia 1934</div>
                          <div>Italia 1938</div>
                          <div>Uruguay 1950</div>
                          <div>Alemania 1954</div>
                          <div>Brasil 1958</div>
                          <div>Brasil 1962</div>
                          <div>Inglaterra 1966</div>
                          <div>Brasil 1970</div>
                          <div>Alemania 1974</div>
                          <div>Argentina 1978</div>
                          <div>Italia 1982</div>
                          <div>Argentina 1986</div>
                          <div>Alemania 1990</div>
                          <div>Brasil 1994</div>
                          <div>Francia 1998</div>
                          <div>Brasil 2002</div>
                          <div>Italia 2006</div>
                          <div>España 2010</div>
                          <div>Alemania 2014</div>
                          <div>Francia 2018</div>
                          <div>Argentina 2022</div>
                        </div>
                      </div>
                    </>
                  ) : stickers.slice(0, 2).map((sticker) => (
                    <Sticker
                      key={sticker.code}
                      sticker={sticker}
                      currentTeam={currentTeam}
                      onToggle={toggleSticker}
                    />
                  ))}

                  {currentTeam.startsWith('FWCI') ? null : stickers.slice(2, 10).map((sticker) => (
                    <Sticker
                      key={sticker.code}
                      sticker={sticker}
                      currentTeam={currentTeam}
                      onToggle={toggleSticker}
                    />
                  ))}
                </div>
              </div>

              <div className={`p-3 sm:p-8 ${currentTeam === 'FWCI1' ? 'bg-gradient-to-br from-yellow-100 via-blue-100 to-green-100' : currentTeam === 'FWCI2' ? 'bg-[#555555]' : currentTeam.startsWith('FWCH') ? 'bg-[#0d1b4d]' : 'bg-[#faf8f5]'}`}>
                <div className="grid grid-cols-4 gap-2 sm:gap-4">
                  {currentTeam === 'FWCI1' ? (
                    <>
                      <div className="col-span-3 border-4 border-black rounded-xl p-4 min-h-[300px] bg-white">
                        <div className="font-black uppercase text-sm mb-3">
                          Grupos del Mundial
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[10px] sm:text-xs font-black uppercase leading-tight">
                          <div>A: México • Suiza • Ghana • Nueva Zelanda</div>
                          <div>B: Brasil • Croacia • Egipto • Canadá</div>
                          <div>C: Argentina • Japón • Nigeria • Escocia</div>
                          <div>D: Francia • Corea • Paraguay • Túnez</div>
                          <div>E: España • Marruecos • Iraq • Noruega</div>
                          <div>F: Inglaterra • Colombia • Austria • Haití</div>
                          <div>G: Alemania • Ecuador • Arabia Saudita • Cabo Verde</div>
                          <div>H: Portugal • Uruguay • Jordania • Curazao</div>
                          <div>I: Estados Unidos • Bélgica • Uzbekistán • Panamá</div>
                          <div>J: Turquía • Bosnia • Congo DR • Catar</div>
                          <div>K: Italia • Senegal • República Checa • Argelia</div>
                          <div>L: Países Bajos • Costa de Marfil • Australia • Irán</div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-3">
                        <Sticker
                          sticker={stickers[1]}
                          horizontal
                          currentTeam={currentTeam}
                          onToggle={toggleSticker}
                        />

                        <Sticker
                          sticker={stickers[2]}
                          horizontal
                          currentTeam={currentTeam}
                          onToggle={toggleSticker}
                        />

                        <Sticker
                          sticker={stickers[3]}
                          horizontal
                          currentTeam={currentTeam}
                          onToggle={toggleSticker}
                        />

                        <Sticker
                          sticker={stickers[4]}
                          currentTeam={currentTeam}
                          onToggle={toggleSticker}
                        />
                      </div>
                    </>
                  ) : currentTeam === 'FWCI2' ? null : stickers.slice(10, 12).map((sticker) => (
                    <Sticker
                      key={sticker.code}
                      sticker={sticker}
                      currentTeam={currentTeam}
                      onToggle={toggleSticker}
                    />
                  ))}

                  {!currentTeam.startsWith('FWCH') && !currentTeam.startsWith('FWCI') && currentTeam !== 'COCA' && stickers[12] && (
                    <div className="col-span-2">
                      <Sticker
                        sticker={stickers[12]}
                        horizontal
                        currentTeam={currentTeam}
                        onToggle={toggleSticker}
                      />
                    </div>
                  )}

                  {currentTeam === 'FWCI2' ? (
                    <>
                      <div className="col-span-2">
                        <Sticker
                          sticker={stickers[2]}
                          currentTeam={currentTeam}
                          onToggle={toggleSticker}
                        />
                      </div>

                      <div className="col-span-2 row-span-2">
                        <Sticker
                          sticker={stickers[3]}
                          currentTeam={currentTeam}
                          onToggle={toggleSticker}
                        />
                      </div>
                    </>
                  ) : currentTeam.startsWith('FWCI') ? null : stickers.slice(13).map((sticker) => (
                    <Sticker
                      key={sticker.code}
                      sticker={sticker}
                      currentTeam={currentTeam}
                      onToggle={toggleSticker}
                    />
                  ))}
                </div>
              </div>
              </>
              )}
            </div>
          </div>
        )}
      </main>

      {showStats && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl w-full max-w-md">
            <h3 className="text-2xl font-black italic uppercase mb-6">Estadisticas</h3>
            <div className="space-y-3 font-black">
              <div>Figuritas completadas: {completedCount} / 980</div>
              <div>Porcentaje completado: {completionPercent}%</div>
            </div>
            <button
              onClick={() => setShowStats(false)}
              className="mt-6 bg-red-600 text-white px-6 py-3 rounded-2xl font-black"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


function Sticker({ sticker, horizontal = false, onToggle, currentTeam }) {
  const labels = {
    shield: 'Escudo',
    team: 'Foto Equipo'
  };

  return (
    <button
      onClick={() => onToggle(sticker.code)}
      className={`border-2 rounded-xl sm:rounded-2xl p-2 sm:p-4 w-full flex items-center justify-center text-center transition ${sticker.horizontal || horizontal ? 'aspect-[3/2]' : 'aspect-[2/3]'} ${sticker.code === 'FWC6' ? 'bg-red-200 border-red-400' : sticker.code === 'FWC7' ? 'bg-green-200 border-green-500' : sticker.code === 'FWC8' ? 'bg-blue-200 border-blue-500' : sticker.completed ? 'bg-green-100 border-green-500' : 'bg-white border-slate-300'} ${sticker.completed ? 'border-[4px] scale-[1.02]' : 'border-2'}`}
    >
      <div>
        <div className={`text-[9px] sm:text-xs uppercase break-all ${sticker.completed ? 'text-black font-extrabold' : 'text-slate-400 font-black'}`}>
          {sticker.code}
        </div>

        <div className={`italic uppercase text-[10px] sm:text-sm mt-1 leading-tight ${sticker.completed ? 'font-extrabold' : 'font-black'} ${currentTeam === 'COCA' || currentTeam.startsWith('FWCH') ? 'text-black' : ''}`}>
          {sticker.label || labels[sticker.type] || `Jugador ${sticker.id}`}
        </div>
      </div>
    </button>
  );
}
