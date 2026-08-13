import React, { useEffect, useMemo, useRef, useState } from 'react';
import { db, doc, getDoc, setDoc, onSnapshot, arrayUnion } from './firebase';
import { playerNames } from './playerNames';
import { teamThemes } from './teamThemes';
import { albumConfig } from './albumConfig_2026';

// ── Constantes derivadas de la configuración externa ──────────────────────────
// Todos los datos antes hardcodeados viven ahora en `albumConfig_2026.js`. Acá se
// re-exponen con los mismos nombres locales para no alterar el resto del archivo.
const ALBUM_ID = albumConfig.id;

const LOCAL_STORAGE_KEY = albumConfig.localStorageKey;
const LOCAL_STORAGE_DARK_KEY = albumConfig.localStorageDarkKey;
const LOCAL_STORAGE_HISTORY_KEY = `${ALBUM_ID}_progressHistory`;

const PROYECTOS = albumConfig.proyectos;
const PAL = albumConfig.palette;

const ALBUM_OWNER = albumConfig.owner;
const VIEW_PARAM = new URLSearchParams(window.location.search).get('view');

const STICKERS_FWCI = albumConfig.counts.fwci;
const STICKERS_FWCH = albumConfig.counts.fwch;
const STICKERS_COCA = albumConfig.counts.coca;
const STICKERS_TEAM = albumConfig.counts.team;
// Coca-Cola stickers exist in the album but are not part of the official Panini collection
const TOTAL_STICKERS = albumConfig.totalStickers;

const teams = albumConfig.teams;

const teamData = albumConfig.teamData;

const teamGroups = albumConfig.teamGroups;

const groups = albumConfig.groups;

const indexTeamIcons = albumConfig.indexTeamIcons;


const progressDocRef = db ? doc(db, 'albumProgress', ALBUM_ID) : null;
const settingsDocRef = db ? doc(db, 'albumSettings', ALBUM_ID) : null;
const progressHistoryDocRef = db ? doc(db, 'albumProgressHistory', ALBUM_ID) : null;

const formatDateTime = (date) => {
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

// Porcentaje redondeado a 2 decimales (ej: 33.33), para mostrar precisión con álbumes grandes.
const calcPercent = (numerator, denominator) => Math.round((numerator / denominator) * 10000) / 100;
const formatPercent = (value) => value.toFixed(2);

// Entradas guardadas antes de que existieran id/timestamp (versión previa de handleMarkProgress)
// reciben acá un id/timestamp derivado, de forma determinística, para no perderlas al mergear.
const parseDateLabel = (label) => {
  const m = /^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2})$/.exec(label || '');
  if (!m) return null;
  const [, d, mo, y, h, mi] = m;
  return new Date(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi)).getTime();
};

const normalizeHistoryEntry = (entry) => {
  if (!entry || (entry.id && entry.timestamp)) return entry;
  return {
    ...entry,
    id: entry.id ?? `legacy-${entry.dateLabel}-${entry.completedCount}-${entry.remainingCount}`,
    timestamp: entry.timestamp ?? parseDateLabel(entry.dateLabel) ?? 0,
  };
};

const mergeHistoryEntries = (...lists) => {
  const byId = new Map();
  for (const raw of lists.flat()) {
    const entry = normalizeHistoryEntry(raw);
    if (entry && entry.id) byId.set(entry.id, entry);
  }
  return [...byId.values()].sort((a, b) => (a.timestamp ?? 0) - (b.timestamp ?? 0));
};

const getThemeKey = (teamCode) => {
  if (teamCode && teamCode.startsWith('FWCI')) return 'FWCINTRO';
  if (teamCode && teamCode.startsWith('FWCH')) return 'FWCHISTORY';
  return teamCode;
};

const getTeamGradientClass = (teamCode) => {
  if (teamCode === 'COCA') return `bg-[${PAL.cocaBg}]`;
  if (teamCode && teamCode.startsWith('FWCH')) return `bg-[${PAL.historyBg}]`;

  const themeKey = getThemeKey(teamCode);
  const gradient = teamThemes[themeKey]?.gradient;
  return gradient ? `bg-gradient-to-r ${gradient}` : 'bg-white';
};

const getInnerPanelClass = (teamCode, darkMode = false) => {
  if (teamCode && teamCode.startsWith('FWCI')) return `bg-[${PAL.surfaceDark}]`;
  return darkMode ? `bg-[${PAL.surfaceCardDark}]` : `bg-[${PAL.panelLight}]`;
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
  if (team === 'FWCH1') return ['FWC9','FWC10','FWC11','FWC12','FWC13'];
  if (team === 'FWCH2') return ['FWC14','FWC15','FWC16','FWC17','FWC18','FWC19'];
  if (team === 'COCA') return Array.from({ length: 14 }, (_, i) => `CC${i + 1}`);
  return Array.from({ length: 20 }, (_, i) => `${team}${i + 1}`);
}

function getTeamConfettiColors(teamCode) {
  const gradient = teamThemes[getThemeKey(teamCode)]?.gradient || '';
  const colors = (gradient.match(/(?:from|via|to)-([^\s]+)/g) || [])
    .map(m => TAILWIND_HEX[m.replace(/^(?:from|via|to)-/, '')]).filter(Boolean);
  return colors.length >= 2 ? [...colors, '#ffffff'] : PAL.confettiDefault;
}

// ─── Sistema de Logros ────────────────────────────────────────────────────────

const LOCAL_STORAGE_ACHIEVEMENTS_KEY = `${ALBUM_ID}_achievements`;
const REAL_TEAMS = teams.filter((team) => !team.startsWith('FWC') && team !== 'COCA');
const isCompletedStickerValue = (value) => value === true || value === 'repeated';

const calcularStats = (completed, players) => {
  const pegadas = Object.entries(completed)
    .filter(([code, value]) => !code.startsWith('CC') && isCompletedStickerValue(value)).length;
  const pct = calcPercent(pegadas, TOTAL_STICKERS);

  let equiposCompletos = 0;
  let escudosPegados = 0;
  let estrellasPegadas = 0;
  for (const team of REAL_TEAMS) {
    const codes = getTeamCodes(team);
    if (codes.every((code) => isCompletedStickerValue(completed[code]))) equiposCompletos++;
    if (isCompletedStickerValue(completed[`${team}1`])) escudosPegados++;
    const starNum = players[team]?.star;
    if (starNum && isCompletedStickerValue(completed[`${team}${starNum}`])) estrellasPegadas++;
  }

  const seccionCompleta = (teamCode) => {
    const codes = getTeamCodes(teamCode);
    return codes.every((code) => isCompletedStickerValue(completed[code]));
  };

  const stickerPegado = (code) => isCompletedStickerValue(completed[code]);

  return { pct, equiposCompletos, escudosPegados, estrellasPegadas, seccionCompleta, stickerPegado };
};

const LOGRO_CATEGORIAS = [
  { id: 'progreso', label: 'Progreso del Álbum' },
  { id: 'selecciones', label: 'Selecciones' },
  { id: 'escudos', label: 'Escudos' },
  { id: 'estrellas', label: 'Estrellas' },
  { id: 'campeones', label: 'Campeones del Mundo' },
  { id: 'especiales', label: 'Logros Especiales' },
];

const LOGROS = [
  // Progreso del álbum — con mensaje de celebración
  { id: 'la-mitad', titulo: 'La Mitad', mensaje: '¡Alcanzaste el 50% del álbum completado, felicitaciones!', icono: '🏅', categoria: 'progreso', evaluar: (stats) => stats.pct >= 50 },
  { id: 'ya-casi', titulo: 'Ya Casi', mensaje: '¡Llegaste al 75%! Ya te salen todas repetidas pero no podés parar, ¡a seguir!', icono: '🏅', categoria: 'progreso', evaluar: (stats) => stats.pct >= 75 },
  { id: 'campeon-album', titulo: 'Campeón del Álbum', mensaje: '¡Completaste el álbum del Mundial! Un recuerdo para toda la vida.', icono: '🏆', categoria: 'progreso', evaluar: (stats) => stats.pct >= 100 },

  // Selecciones completadas — sin mensaje
  { id: 'equipos-12', titulo: '12 Equipos', icono: '👥', categoria: 'selecciones', evaluar: (stats) => stats.equiposCompletos >= 12 },
  { id: 'equipos-24', titulo: '24 Equipos', icono: '👥', categoria: 'selecciones', evaluar: (stats) => stats.equiposCompletos >= 24 },
  { id: 'equipos-36', titulo: '36 Equipos', icono: '👥', categoria: 'selecciones', evaluar: (stats) => stats.equiposCompletos >= 36 },

  // Escudos conseguidos — sin mensaje
  { id: 'escudos-16', titulo: '16 Escudos', icono: '🛡️', categoria: 'escudos', evaluar: (stats) => stats.escudosPegados >= 16 },
  { id: 'escudos-32', titulo: '32 Escudos', icono: '🛡️', categoria: 'escudos', evaluar: (stats) => stats.escudosPegados >= 32 },
  { id: 'escudos-48', titulo: '48 Escudos', icono: '🛡️', categoria: 'escudos', evaluar: (stats) => stats.escudosPegados >= 48 },

  // Estrellas conseguidas — sin mensaje
  { id: 'estrellas-16', titulo: '16 Estrellas', icono: '⭐', categoria: 'estrellas', evaluar: (stats) => stats.estrellasPegadas >= 16 },
  { id: 'estrellas-32', titulo: '32 Estrellas', icono: '⭐', categoria: 'estrellas', evaluar: (stats) => stats.estrellasPegadas >= 32 },
  { id: 'estrellas-48', titulo: '48 Estrellas', icono: '⭐', categoria: 'estrellas', evaluar: (stats) => stats.estrellasPegadas >= 48 },

  // Campeones del mundo presentes en el álbum 2026 — con mensaje de celebración
  { id: 'campeon-URU', titulo: 'Uruguay Campeón', mensaje: 'Uruguay, la Celeste, bicampeona del mundo (1930 y 1950).', icono: '🏆', categoria: 'campeones', evaluar: (stats) => stats.seccionCompleta('URU') },
  { id: 'campeon-GER', titulo: 'Alemania Campeón', mensaje: 'Alemania, tetracampeona del mundo (1954, 1974, 1990 y 2014).', icono: '🏆', categoria: 'campeones', evaluar: (stats) => stats.seccionCompleta('GER') },
  { id: 'campeon-BRA', titulo: 'Brasil Campeón', mensaje: 'Brasil, pentacampeón del mundo (1958, 1962, 1970, 1994 y 2002).', icono: '🏆', categoria: 'campeones', evaluar: (stats) => stats.seccionCompleta('BRA') },
  { id: 'campeon-ENG', titulo: 'Inglaterra Campeón', mensaje: 'Inglaterra, campeona del mundo en 1966, en su propia casa.', icono: '🏆', categoria: 'campeones', evaluar: (stats) => stats.seccionCompleta('ENG') },
  { id: 'campeon-ARG', titulo: 'Argentina Campeón', mensaje: 'Argentina, tricampeona del mundo (1978, 1986 y 2022).', icono: '🏆', categoria: 'campeones', evaluar: (stats) => stats.seccionCompleta('ARG') },
  { id: 'campeon-FRA', titulo: 'Francia Campeón', mensaje: 'Francia, bicampeona del mundo (1998 y 2018).', icono: '🏆', categoria: 'campeones', evaluar: (stats) => stats.seccionCompleta('FRA') },
  { id: 'campeon-ESP', titulo: 'España Campeón', mensaje: 'España, la Roja, campeona del mundo en 2010.', icono: '🏆', categoria: 'campeones', evaluar: (stats) => stats.seccionCompleta('ESP') },

  // Logros especiales — con mensaje de celebración
  { id: 'la-cabra', titulo: 'La Cabra', mensaje: 'Te tocó Él. El 10 de Rosario, el que levantó la Copa en Catar, el ídolo del Barcelona, el mejor de la historia.', icono: '🐐', categoria: 'especiales', evaluar: (stats) => stats.stickerPegado('ARG17') },
];

// Recalcula el set de logros desbloqueados contra el estado actual del álbum:
// agrega los que se cumplen y recién se cumplen, y quita los que ya no se
// cumplen (ej. se destildó una figurita que hacía falta para "X Campeón").
// Sin esto, un logro quedaba prendido para siempre aunque después el álbum
// dejara de cumplir la condición que lo desbloqueó.
const sincronizarLogros = (achievementsSet, stats) => {
  const nuevoSet = new Set(achievementsSet);
  const nuevosLogros = [];
  let changed = false;

  for (const logro of LOGROS) {
    const cumple = logro.evaluar(stats);
    if (cumple && !nuevoSet.has(logro.id)) {
      nuevoSet.add(logro.id);
      nuevosLogros.push(logro);
      changed = true;
    } else if (!cumple && nuevoSet.has(logro.id)) {
      nuevoSet.delete(logro.id);
      changed = true;
    }
  }

  return { nuevoSet, nuevosLogros, changed };
};

const cargarAchievements = async () => {
  try {
    if (progressDocRef) {
      const snap = await getDoc(progressDocRef);
      if (snap.exists() && Array.isArray(snap.data()?.achievements)) {
        return new Set(snap.data().achievements);
      }
    }
  } catch (error) {
    console.error('Error loading achievements from Firestore:', error);
  }
  try {
    const local = localStorage.getItem(LOCAL_STORAGE_ACHIEVEMENTS_KEY);
    if (local) return new Set(JSON.parse(local));
  } catch (_) {}
  return new Set();
};

const persistirAchievements = async (achievementsSet) => {
  const arr = [...achievementsSet];
  try {
    if (progressDocRef) {
      await setDoc(progressDocRef, { achievements: arr }, { merge: true });
    }
  } catch (error) {
    console.error('Error saving achievements to Firestore:', error);
  }
  try {
    localStorage.setItem(LOCAL_STORAGE_ACHIEVEMENTS_KEY, JSON.stringify(arr));
  } catch (_) {}
};

// ─────────────────────────────────────────────────────────────────────────────

export default function PaniniAlbum2026() {
  if (VIEW_PARAM === 'repetidas') return <RepeatidasView />;
  if (VIEW_PARAM === 'repetidasusuario') return <RepeatidasUsuarioExternoView />;
  if (VIEW_PARAM === 'faltan') return <FaltanView />;
  const [currentView, setCurrentView] = useState('home');
  const [currentTeamIndex, setCurrentTeamIndex] = useState(0);
  const [completed, setCompleted] = useState({});
  const [showStats, setShowStats] = useState(false);
  const [importMessage, setImportMessage] = useState('');
  const [showQR, setShowQR] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const isInitialLoad = useRef(true);
  const skipNextCloudSave = useRef(false);

  // New feature state
  // Cola de celebraciones: cuando una misma acción dispara varios festejos
  // (ej. pegar la última figurita de una selección desbloquea un logro
  // individual, el cartel de sección completa y el logro de "Campeón"), se
  // encolan todos y se muestran de a uno para que ninguno se pise con otro.
  const [celebrationQueue, setCelebrationQueue] = useState([]);
  const celebration = celebrationQueue[0] ?? null;
  const closeCelebration = () => setCelebrationQueue((q) => q.slice(1));
  const [justPastedCode, setJustPastedCode] = useState(null);
  const [highlightCode, setHighlightCode] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [repetidasPending, setRepetidasPending] = useState({});
  const [repetidasSelected, setRepetidasSelected] = useState({});
  const [repetidasConfirmSelected, setRepetidasConfirmSelected] = useState(false);
  const [repetidasConfirmSave, setRepetidasConfirmSave] = useState(false);
  const [repetidasConfirmExit, setRepetidasConfirmExit] = useState(false);
  const [repetidasConfirmLimpiar, setRepetidasConfirmLimpiar] = useState(false);
  const [showRepetidasQR, setShowRepetidasQR] = useState(false);
  const [showExportText, setShowExportText] = useState(false);
  const [showFaltanQR, setShowFaltanQR] = useState(false);
  const [showExportTextFaltan, setShowExportTextFaltan] = useState(false);
  const [progressHistory, setProgressHistory] = useState([]);
  const [showProgressHistory, setShowProgressHistory] = useState(false);
  const [progressMessage, setProgressMessage] = useState('');
  const [otrosProyectosProgress, setOtrosProyectosProgress] = useState({});
  const [achievements, setAchievements] = useState(new Set());
  const [achievementsLoaded, setAchievementsLoaded] = useState(false);
  const [progressLoaded, setProgressLoaded] = useState(false);
  const initialAchievementsValidated = useRef(false);

  useEffect(() => {
    const loadFromLocal = () => {
      try {
        const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (localData) {
          const parsed = JSON.parse(localData);
          if (parsed && typeof parsed === 'object') {
            setCompleted(parsed);
          }
        }
      } catch (_) {}
    };

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

        loadFromLocal();
      } catch (error) {
        console.error('Error loading album progress from Firestore:', error);
        // No pudimos confirmar el estado real en la nube (red, adblocker, etc.):
        // mostramos el respaldo local de este dispositivo, pero evitamos que el
        // próximo guardado lo suba a Firestore, para no pisar progreso ya
        // sincronizado desde otro dispositivo con datos locales viejos/incompletos.
        skipNextCloudSave.current = true;
        loadFromLocal();
      } finally {
        isInitialLoad.current = false;
        setProgressLoaded(true);
      }
    };

    loadProgress();
  }, []);

  // ── Logros: carga inicial de logros ya desbloqueados ──────────────────────
  useEffect(() => {
    let cancelled = false;
    cargarAchievements().then((set) => {
      if (!cancelled) {
        setAchievements(set);
        setAchievementsLoaded(true);
      }
    });
    return () => { cancelled = true; };
  }, []);

  // ── Logros: validación inicial única (sin celebración) ────────────────────
  useEffect(() => {
    if (!progressLoaded || !achievementsLoaded || initialAchievementsValidated.current) return;
    initialAchievementsValidated.current = true;

    const stats = calcularStats(completed, playerNames);
    const { nuevoSet, changed } = sincronizarLogros(achievements, stats);
    if (changed) {
      setAchievements(nuevoSet);
      persistirAchievements(nuevoSet);
    }
  }, [progressLoaded, achievementsLoaded]);

  useEffect(() => {
    // La preferencia local (de este dispositivo) manda siempre: es síncrona
    // y confiable. Firestore solo se usa como valor por defecto para
    // dispositivos nuevos que todavía no tienen una preferencia guardada.
    const local = localStorage.getItem(LOCAL_STORAGE_DARK_KEY);
    if (local !== null) setDarkMode(local === 'true');

    const loadDarkMode = async () => {
      if (!settingsDocRef) return;
      try {
        const snap = await getDoc(settingsDocRef);
        if (local === null && snap.exists() && typeof snap.data()?.darkMode === 'boolean') {
          setDarkMode(snap.data().darkMode);
        }
      } catch (err) {
        console.warn('No se pudo sincronizar el modo oscuro con Firestore:', err);
      }
    };
    loadDarkMode();
  }, []);

  // ── Load progress of other projects (Otros Proyectos) ─────────────────────
  useEffect(() => {
    if (currentView !== 'otros-proyectos' || !db) return;
    let cancelled = false;
    const fetchProgress = async () => {
      // Se leen todos los álbumes en paralelo (no secuencial) y se usa el
      // `completedCount` ya calculado que cada álbum guarda junto con `stickers`,
      // para no tener que bajar el mapa completo de figuritas de cada uno.
      const entries = await Promise.all(
        PROYECTOS.filter(proyecto => proyecto.id !== ALBUM_ID).map(async (proyecto) => {
          try {
            const snap = await getDoc(doc(db, 'albumProgress', proyecto.id));
            if (!snap.exists()) return [proyecto.id, null];
            const data = snap.data();
            const pegadas = typeof data?.completedCount === 'number'
              ? data.completedCount
              : Object.values(data?.stickers || {}).filter(v => v === true || v === 'repeated').length;
            return [proyecto.id, {
              pegadas,
              total: proyecto.totalStickers,
              pct: Math.round((pegadas / proyecto.totalStickers) * 100),
            }];
          } catch (_) {
            return [proyecto.id, null];
          }
        })
      );
      if (!cancelled) setOtrosProyectosProgress(Object.fromEntries(entries));
    };
    fetchProgress();
    return () => { cancelled = true; };
  }, [currentView]);

  useEffect(() => {
    const loadHistory = async () => {
      let localEntries = [];
      try {
        const localData = localStorage.getItem(LOCAL_STORAGE_HISTORY_KEY);
        if (localData) {
          const parsed = JSON.parse(localData);
          if (Array.isArray(parsed)) localEntries = parsed;
        }
      } catch (_) {}

      let remoteEntries = null;
      try {
        if (progressHistoryDocRef) {
          const snap = await getDoc(progressHistoryDocRef);
          if (snap.exists() && Array.isArray(snap.data()?.entries)) {
            remoteEntries = snap.data().entries;
          }
        }
      } catch (error) {
        console.error('Error loading progress history from Firestore:', error);
      }

      if (remoteEntries === null) {
        setProgressHistory(localEntries.map(normalizeHistoryEntry));
        return;
      }

      const merged = mergeHistoryEntries(localEntries, remoteEntries);
      setProgressHistory(merged);
      try { localStorage.setItem(LOCAL_STORAGE_HISTORY_KEY, JSON.stringify(merged)); } catch (_) {}

      // Re-sube al proveedor de la nube cualquier registro local (incluidas entradas
      // "legacy" sin id/timestamp) que no haya llegado a Firestore — por ejemplo, un
      // guardado previo que falló por estar offline.
      const remoteIds = new Set(remoteEntries.map(e => normalizeHistoryEntry(e).id));
      const missingFromCloud = merged.filter(e => !remoteIds.has(e.id));
      if (missingFromCloud.length > 0 && progressHistoryDocRef) {
        try { await setDoc(progressHistoryDocRef, { entries: arrayUnion(...missingFromCloud) }, { merge: true }); } catch (_) {}
      }
    };
    loadHistory();
  }, []);

  useEffect(() => {
    const saveProgress = async () => {
      if (isInitialLoad.current) return;

      if (skipNextCloudSave.current) {
        skipNextCloudSave.current = false;
        try { localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(completed)); } catch (_) {}
        return;
      }

      // completedCount se guarda ya calculado junto con stickers para que la vista
      // "Otros Proyectos" de otros álbumes no tenga que bajar el mapa completo de
      // stickers de este álbum y contarlo cliente-side en cada carga.
      const completedCountToSave = Object.entries(completed)
        .filter(([code, value]) => !code.startsWith('CC') && isCompletedSticker(value)).length;

      try {
        if (progressDocRef) {
          // mergeFields (no merge:true): reemplaza stickers/completedCount por
          // completo -para no resucitar códigos borrados- sin pisar `achievements`,
          // que vive en el mismo doc.
          await setDoc(progressDocRef, { stickers: completed, completedCount: completedCountToSave }, { mergeFields: ['stickers', 'completedCount'] });
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
    FWCH1: albumConfig.specialSections.FWCH1.pageItems,
    FWCH2: albumConfig.specialSections.FWCH2.pageItems
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
        const fwciDefs = albumConfig.specialSections.FWCI1.items;
        const def = fwciDefs[id - 1];
        code = def.code;
        label = def.label;
        type = def.type;
      } else if (currentTeam === 'COCA') {
        label = playerNames.CC?.[id] || `Jugador ${id}`;
      } else if (currentTeam.startsWith('FWCH')) {
        const historySelectable = {
          FWCH1: albumConfig.specialSections.FWCH1.selectable,
          FWCH2: albumConfig.specialSections.FWCH2.selectable
        };

        const historySticker = historySelectable[currentTeam][id - 1];
        code = historySticker?.code || code;
        label = historySticker?.label || `CAMPEÓN ${id}`;
        horizontal = true;
      } else {
        type = id === 1 ? 'shield' : id === 13 ? 'team' : 'player';
        label = type === 'shield' ? 'Escudo' : type === 'team' ? 'Foto equipo' : playerNames[currentTeam]?.players?.[id] || `Jugador ${id}`;
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

  // Devuelve los logros recién desbloqueados que tienen mensaje (es decir,
  // los que deben mostrar un cartel de celebración), sin encolar nada todavía.
  const evaluarLogros = (nuevoCompleted) => {
    if (!achievementsLoaded) return [];
    const stats = calcularStats(nuevoCompleted, playerNames);
    const { nuevoSet, nuevosLogros, changed } = sincronizarLogros(achievements, stats);
    if (!changed) return [];

    setAchievements(nuevoSet);
    persistirAchievements(nuevoSet);

    return nuevosLogros.filter((l) => l.mensaje);
  };

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

    const toCelebracion = (l) => ({ type: 'achievement', titulo: l.titulo, mensaje: l.mensaje, icono: l.icono });
    const nuevosLogros = evaluarLogros(next);
    // Los logros de "Campeón" celebran el mismo hito que el cartel de
    // sección completa, así que se muestran después de ese cartel a modo de
    // cierre. El resto de los logros (ligados a la figurita recién pegada,
    // como "La Cabra") se muestran primero, ya que son la reacción más
    // inmediata a la acción del usuario.
    const logrosIndividuales = nuevosLogros.filter((l) => l.categoria !== 'campeones');
    const logrosCampeon = nuevosLogros.filter((l) => l.categoria === 'campeones');
    const pendientes = logrosIndividuales.map(toCelebracion);

    // Only trigger animations/celebrations when going empty → completed
    if (!current) {
      setJustPastedCode(code);
      setTimeout(() => setJustPastedCode(null), 450);

      // Album completion check (excludes Coca-Cola)
      const newCount = Object.entries(next)
        .filter(([c, v]) => !c.startsWith('CC') && isCompletedSticker(v)).length;
      if (newCount === TOTAL_STICKERS) {
        pendientes.push({ type: 'album' });
      } else {
        // Team completion check (includes Coca-Cola)
        const teamForCode = getTeamForCode(code);
        if (teamForCode) {
          const codes = getTeamCodes(teamForCode);
          const wasComplete = codes.every(c => isCompletedSticker(completed[c]));
          const nowComplete = codes.every(c => isCompletedSticker(next[c]));
          if (nowComplete && !wasComplete) {
            pendientes.push({ type: 'team', team: teamForCode });
          }
        }
      }
    }

    pendientes.push(...logrosCampeon.map(toCelebracion));

    if (pendientes.length > 0) {
      setTimeout(() => setCelebrationQueue((q) => [...q, ...pendientes]), 350);
    }
  };

  const toggleDarkMode = async () => {
    const newVal = !darkMode;
    setDarkMode(newVal);
    localStorage.setItem(LOCAL_STORAGE_DARK_KEY, String(newVal));
    if (settingsDocRef) {
      try {
        await setDoc(settingsDocRef, { darkMode: newVal }, { merge: true });
      } catch (err) {
        console.warn('No se pudo guardar el modo oscuro en Firestore (quedó guardado solo en este dispositivo):', err);
      }
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
    a.download = albumConfig.exportFileName;
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
          try { await setDoc(progressDocRef, { stickers: parsed }, { mergeFields: ['stickers'] }); } catch (_) {}
        }
        if (achievementsLoaded) {
          const stats = calcularStats(parsed, playerNames);
          const { nuevoSet, changed } = sincronizarLogros(achievements, stats);
          if (changed) {
            setAchievements(nuevoSet);
            persistirAchievements(nuevoSet);
          }
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
  const completionPercent = calcPercent(completedCount, TOTAL_STICKERS);
  const remainingPercent = Math.round((100 - completionPercent) * 100) / 100;
  const remainingCount = Math.max(TOTAL_STICKERS - completedCount, 0);

  const handleMarkProgress = async () => {
    const now = new Date();
    const entry = {
      id: `${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: now.getTime(),
      dateLabel: formatDateTime(now),
      percentCompleted: completionPercent,
      percentRemaining: remainingPercent,
      completedCount,
      remainingCount,
    };
    const nextHistory = [...progressHistory, entry];
    setProgressHistory(nextHistory);
    try { localStorage.setItem(LOCAL_STORAGE_HISTORY_KEY, JSON.stringify(nextHistory)); } catch (_) {}
    try {
      // Se usa arrayUnion (append atómico) en vez de sobreescribir todo el array,
      // para no perder registros guardados casi al mismo tiempo desde otro dispositivo.
      if (progressHistoryDocRef) await setDoc(progressHistoryDocRef, { entries: arrayUnion(entry) }, { merge: true });
    } catch (error) {
      console.error('Error saving progress history to Firestore:', error);
    }
    setProgressMessage('✅ Progreso marcado');
    setTimeout(() => setProgressMessage(''), 2000);
  };

  const shieldCodes = teams
    .filter((team) => !team.startsWith('FWC') && team !== 'COCA')
    .map((team) => `${team}1`);
  const fwcBrilliantCodes = Array.from({ length: STICKERS_FWCH + 8 }, (_, i) => `FWC${i + 1}`);
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

  const repetidasGrouped = useMemo(() => {
    const byTeam = {};
    for (const [code, value] of Object.entries(completed)) {
      if (value !== 'repeated' || repetidasPending[code]) continue;
      const team = getTeamForCode(code);
      if (!team) continue;
      if (!byTeam[team]) byTeam[team] = [];
      byTeam[team].push(code);
    }
    return teams
      .filter(t => byTeam[t])
      .map(t => ({ team: t, info: teamData[t], codes: byTeam[t] }));
  }, [completed, repetidasPending]);

  const faltantesGrouped = useMemo(() => {
    const byTeam = {};
    for (const team of teams) {
      const missing = getTeamCodes(team).filter((code) => !isCompletedSticker(completed[code]));
      if (missing.length) byTeam[team] = missing;
    }
    return teams
      .filter(t => byTeam[t])
      .map(t => ({ team: t, info: teamData[t], codes: byTeam[t] }));
  }, [completed]);

  // Search index: all toggleable stickers with searchable text
  const searchIndex = useMemo(() => {
    const entries = [];
    const fwciCodes = ['00','FWC1','FWC2','FWC3','FWC4','FWC5','FWC6','FWC7','FWC8'];
    const fwciLabels = ['PANINI','Logo Copa 1','Logo Copa 2','Mascotas','Póster','Balón Oficial','Póster Canadá','Póster México','Póster USA'];
    fwciCodes.forEach((code, i) => entries.push({ code, label: fwciLabels[i], team: 'FWCI1', teamName: 'Intro FWC', teamFlag: '⚽' }));

    const fwchData = [
      { code:'FWC9', label:'ITALIA 1934', team:'FWCH1' },
      { code:'FWC10', label:'BRASIL 1950', team:'FWCH1' },
      { code:'FWC11', label:'RF ALEMANIA 1954', team:'FWCH1' },
      { code:'FWC12', label:'BRASIL 1962', team:'FWCH1' },
      { code:'FWC13', label:'RF ALEMANIA 1974', team:'FWCH1' },
      { code:'FWC14', label:'ARGENTINA 1986', team:'FWCH2' },
      { code:'FWC15', label:'BRASIL 1994', team:'FWCH2' },
      { code:'FWC16', label:'BRASIL 2002', team:'FWCH2' },
      { code:'FWC17', label:'ITALIA 2006', team:'FWCH2' },
      { code:'FWC18', label:'ALEMANIA 2014', team:'FWCH2' },
      { code:'FWC19', label:'ARGENTINA 2022', team:'FWCH2' },
    ];
    fwchData.forEach(d => entries.push({ ...d, teamName: 'FWC Historia', teamFlag: '⭐' }));

    selectionTeams.forEach(team => {
      const info = teamData[team];
      for (let id = 1; id <= 20; id++) {
        const code = `${team}${id}`;
        const label = id === 1 ? 'Escudo' : id === 13 ? 'Foto equipo' : (playerNames[team]?.players?.[id] || `Jugador ${id}`);
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
    ? ['FWC9','FWC10','FWC11','FWC12','FWC13','FWC14','FWC15','FWC16','FWC17','FWC18','FWC19']
        .filter((code) => isCompletedSticker(completed[code])).length
    : stickers.filter((s) => s.completed).length;

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? `bg-[${PAL.bgDark}] text-white` : `bg-[${PAL.bgMain}] text-slate-800`}`}>
      <header className={`border-b shadow-sm sticky top-0 z-50 transition-colors duration-300 ${darkMode ? `bg-[${PAL.surfaceDark}] border-[${PAL.borderDark}]` : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 sm:py-4 flex flex-row gap-2 justify-between items-center">
          <div className="min-w-0">
            <h1 className={`text-lg sm:text-3xl font-black italic truncate ${darkMode ? 'text-white' : ''}`}>
              {albumConfig.title}
            </h1>

            <p className={`hidden sm:block text-xs uppercase tracking-[0.3em] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              {albumConfig.subtitle}
            </p>

            <div className={`mt-0.5 sm:mt-2 text-xs sm:text-sm font-black ${darkMode ? 'text-pink-400' : 'text-pink-800'}`}>
              {formatPercent(completionPercent)}% COMPLETADO
            </div>

            <div className={`mt-1 sm:mt-2 h-2 sm:h-2.5 w-24 sm:w-56 rounded-full overflow-hidden ${darkMode ? `bg-[${PAL.borderDark}]` : 'bg-slate-200'}`}>
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
                  className={`px-3 py-2 rounded-xl text-sm font-black border-2 w-32 sm:w-48 outline-none transition-all ${darkMode ? `bg-[${PAL.borderDark}] border-[${PAL.inputBorderDark}] text-white placeholder-slate-500` : 'bg-white border-slate-300 text-slate-800 placeholder-slate-400'}`}
                />
                <button
                  onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
                  className={`font-black text-base leading-none px-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}
                >
                  ✕
                </button>
                {searchResults.length > 0 && (
                  <div className={`absolute top-full right-0 mt-1 w-72 max-w-[calc(100vw-1.5rem)] rounded-2xl shadow-2xl overflow-hidden z-[200] ${darkMode ? `bg-[${PAL.surfaceDark}] border border-[${PAL.borderDarkAlt}]` : 'bg-white border border-slate-200'}`}>
                    {searchResults.map(entry => (
                      <button
                        key={entry.code}
                        onClick={() => handleSearchSelect(entry)}
                        className={`w-full px-4 py-2.5 text-left flex items-center gap-3 border-b last:border-b-0 transition-colors ${darkMode ? `border-[${PAL.borderDark}] hover:bg-[${PAL.borderDark}] text-white` : 'border-slate-100 hover:bg-slate-50'}`}
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
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            <button
              onClick={() => setCurrentView('groups')}
              className={`rounded-3xl p-8 shadow-xl text-left active:scale-95 transition-colors duration-300 ${darkMode ? `bg-[${PAL.surfaceCardDark}] text-white` : 'bg-white'}`}
            >
              <div className="text-3xl font-black italic uppercase">
                Explorar Álbum
              </div>
            </button>

            <button
              onClick={() => setCurrentView('teams')}
              className={`rounded-3xl p-8 shadow-xl text-left active:scale-95 transition-colors duration-300 ${darkMode ? `bg-[${PAL.surfaceCardDark}] text-white` : 'bg-white'}`}
            >
              <div className="text-3xl font-black italic uppercase">
                Índice
              </div>
            </button>

            <button
              onClick={() => setShowStats(true)}
              className={`rounded-3xl p-8 shadow-xl text-left active:scale-95 transition-colors duration-300 ${darkMode ? `bg-[${PAL.surfaceCardDark}] text-white` : 'bg-white'}`}
            >
              <div className="text-3xl font-black italic uppercase">
                Estadísticas
              </div>
            </button>

            <button
              onClick={() => setCurrentView('repetidas')}
              className={`rounded-3xl p-8 shadow-xl text-left active:scale-95 transition-colors duration-300 ${darkMode ? `bg-[${PAL.surfaceCardDark}] text-white` : 'bg-white'}`}
            >
              <div className="text-3xl font-black italic uppercase">
                Repetidas
              </div>
            </button>

            <button
              onClick={() => setCurrentView('logros')}
              className={`rounded-3xl p-8 shadow-xl text-left active:scale-95 transition-colors duration-300 ${darkMode ? `bg-[${PAL.surfaceCardDark}] text-white` : 'bg-white'}`}
            >
              <div className="text-3xl font-black italic uppercase">
                Logros
              </div>
            </button>

            <button
              onClick={() => setCurrentView('faltan')}
              className={`rounded-3xl p-8 shadow-xl text-left active:scale-95 transition-colors duration-300 ${darkMode ? `bg-[${PAL.surfaceCardDark}] text-white` : 'bg-white'}`}
            >
              <div className="text-3xl font-black italic uppercase">
                Me Faltan
              </div>
            </button>

            <button
              onClick={() => setCurrentView('otros-proyectos')}
              className={`rounded-3xl p-8 shadow-xl text-left active:scale-95 transition-colors duration-300 ${darkMode ? `bg-[${PAL.surfaceCardDark}] text-white` : 'bg-white'}`}
            >
              <div className="text-3xl font-black italic uppercase">
                Otros Proyectos
              </div>
            </button>
          </div>
        )}

        {currentView === 'logros' && (
          <div className={`rounded-3xl p-6 sm:p-8 shadow-xl max-w-4xl mx-auto transition-colors duration-300 ${darkMode ? `bg-[${PAL.surfaceCardDark}] text-white` : 'bg-white'}`}>
            <h2 className="text-3xl font-black italic uppercase mb-6">Logros</h2>
            <div className="max-h-[65vh] overflow-y-auto pr-1 space-y-8">
              {LOGRO_CATEGORIAS.map((categoria) => {
                const logrosCategoria = LOGROS.filter((l) => l.categoria === categoria.id);
                return (
                  <div key={categoria.id}>
                    <h3 className={`text-sm font-black uppercase tracking-widest mb-3 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      {categoria.label}
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {logrosCategoria.map((logro) => {
                        const desbloqueado = achievements.has(logro.id);
                        return (
                          <div
                            key={logro.id}
                            className={`rounded-2xl p-4 flex flex-col items-center text-center gap-2 border-2 transition-colors duration-300 ${
                              desbloqueado
                                ? darkMode
                                  ? 'border-yellow-400 bg-yellow-400/10'
                                  : 'border-yellow-500 bg-yellow-50'
                                : darkMode
                                ? 'border-slate-700 bg-slate-800/40'
                                : 'border-slate-200 bg-slate-100'
                            }`}
                          >
                            <div className={`text-4xl ${desbloqueado ? '' : 'grayscale opacity-30'}`}>
                              {logro.icono}
                            </div>
                            <div className={`text-xs font-black uppercase leading-tight ${
                              desbloqueado
                                ? darkMode ? 'text-white' : 'text-slate-800'
                                : darkMode ? 'text-slate-500' : 'text-slate-400'
                            }`}>
                              {logro.titulo}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
            <button
              onClick={() => setCurrentView('home')}
              className="mt-6 bg-red-600 text-white px-6 py-3 rounded-2xl font-black"
            >
              VOLVER
            </button>
          </div>
        )}

        {currentView === 'otros-proyectos' && (
          <div className={`rounded-3xl p-6 sm:p-8 shadow-xl max-w-2xl mx-auto transition-colors duration-300 ${darkMode ? `bg-[${PAL.surfaceCardDark}] text-white` : 'bg-white'}`}>
            <h2 className="text-3xl font-black italic uppercase mb-6">Otros Proyectos</h2>
            <div className="space-y-4">
              {PROYECTOS.filter(p => p.id !== ALBUM_ID).map(proyecto => {
                let btnStyle = {};
                let btnClass = 'rounded-3xl p-8 shadow-xl w-full text-left active:scale-95 transition-transform font-black';
                if (proyecto.style === 'multicolor') {
                  btnStyle = { background: PAL.projectStyles.multicolor };
                  btnClass += ' text-white';
                } else if (proyecto.style === 'qatar') {
                  btnStyle = { backgroundColor: PAL.projectStyles.qatarBg, border: `2px solid ${PAL.projectStyles.qatarBorder}` };
                  btnClass += ' text-white';
                } else if (proyecto.style === 'cwc') {
                  btnStyle = { backgroundColor: PAL.projectStyles.cwcBg, border: `2px solid ${PAL.projectStyles.cwcBorder}` };
                  btnClass += ' text-yellow-400';
                } else if (proyecto.style === 'russia') {
                  btnStyle = { backgroundColor: PAL.projectStyles.russiaBg, border: `2px solid ${PAL.projectStyles.russiaBorder}` };
                  btnClass += ' text-white';
                } else if (proyecto.style === 'brazil2014') {
                  btnStyle = { backgroundColor: PAL.projectStyles.brazil2014Bg, color: PAL.projectStyles.brazil2014Text, border: `2px solid ${PAL.projectStyles.brazil2014Border}` };
                } else if (proyecto.style === 'southafrica2010') {
                  btnStyle = { backgroundColor: PAL.projectStyles.southafrica2010Bg, color: PAL.projectStyles.southafrica2010Text, border: `2px solid ${PAL.projectStyles.southafrica2010Border}` };
                } else if (proyecto.style === 'germany2006') {
                  btnStyle = { backgroundColor: PAL.projectStyles.germany2006Bg, border: `2px solid ${PAL.projectStyles.germany2006Border}` };
                  btnClass += ' text-white';
                }
                const progress = otrosProyectosProgress[proyecto.id];
                return (
                  <button
                    key={proyecto.id}
                    style={btnStyle}
                    className={btnClass}
                    onClick={() => { window.location.href = proyecto.url; }}
                  >
                    <div className="text-3xl font-black italic uppercase">{proyecto.label}</div>
                    {progress === undefined ? (
                      <div style={{ marginTop: 6 }}>
                        <div style={{ height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.15)', overflow: 'hidden' }} />
                        <div style={{ fontSize: 11, marginTop: 3, opacity: 0.7, textAlign: 'right' }}>cargando...</div>
                      </div>
                    ) : progress && (
                      <div style={{ marginTop: 6 }}>
                        <div style={{ height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${progress.pct}%`, backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: 2, transition: 'width 0.6s ease' }} />
                        </div>
                        <div style={{ fontSize: 11, marginTop: 3, opacity: 0.85, textAlign: 'right' }}>
                          {progress.pct}% · {progress.pegadas} pegadas
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            {(() => {
              // "Colección completa" incluye este álbum (host) más los que hayan
              // cargado bien desde Firebase. El promedio es el promedio simple de
              // % de cada álbum (no ponderado por cantidad de figuritas de cada uno).
              if (Object.keys(otrosProyectosProgress).length === 0) return null;
              const otherEntries = Object.values(otrosProyectosProgress).filter(Boolean);
              const allPercents = [completionPercent, ...otherEntries.map(p => p.pct)];
              const promedio = Math.round(allPercents.reduce((sum, pct) => sum + pct, 0) / allPercents.length);
              const totalPegadas = completedCount + otherEntries.reduce((sum, p) => sum + p.pegadas, 0);
              const totalFaltantes = remainingCount + otherEntries.reduce((sum, p) => sum + (p.total - p.pegadas), 0);
              return (
                <div className={`mt-6 px-4 py-2.5 rounded-xl text-xs leading-relaxed ${darkMode ? 'bg-white/5 text-white/70' : 'bg-black/5 text-slate-600'}`}>
                  * Colección completa · {promedio}% promedio · {totalPegadas.toLocaleString()} figuritas pegadas · {totalFaltantes.toLocaleString()} faltantes
                </div>
              );
            })()}
            <button
              onClick={() => setCurrentView('home')}
              className={`mt-6 px-6 py-3 rounded-2xl font-black ${darkMode ? `bg-[${PAL.borderDark}] text-white` : 'bg-gray-200 text-black'}`}
            >
              ← VOLVER
            </button>
          </div>
        )}

        {currentView === 'repetidas' && (
          <div className={`rounded-3xl p-6 sm:p-8 shadow-xl max-w-2xl mx-auto transition-colors duration-300 ${darkMode ? `bg-[${PAL.surfaceCardDark}] text-white` : 'bg-white'}`}>
            <h2 className="text-3xl font-black italic uppercase mb-6">Repetidas</h2>
            {repetidasGrouped.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">🙌</div>
                <div className="font-black text-xl">¡No hay repetidas!</div>
                <div className={`mt-2 text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  {Object.keys(repetidasPending).length > 0
                    ? `${Object.keys(repetidasPending).length} cambio${Object.keys(repetidasPending).length !== 1 ? 's' : ''} pendiente${Object.keys(repetidasPending).length !== 1 ? 's' : ''} sin guardar`
                    : 'Cuando tengas figuritas repetidas aparecerán acá.'}
                </div>
              </div>
            ) : (
              <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-1 mb-4">
                {repetidasGrouped.map(({ team, info, codes }) => (
                  <div key={team} className={`rounded-2xl p-4 ${darkMode ? `bg-[${PAL.borderDark}]` : 'bg-slate-50'}`}>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-2xl leading-none">{info?.flag || '🏳️'}</span>
                      <div>
                        <div className="font-black uppercase text-sm">{info?.name || team}</div>
                        <div className={`text-[10px] uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-400'}`}>
                          {codes.length} repetida{codes.length !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {codes.map(code => {
                        const name = getPlayerNameForCode(code, team);
                        return (
                          <button
                            key={code}
                            onClick={() => setRepetidasSelected(prev => {
                              const n = { ...prev };
                              if (n[code]) delete n[code]; else n[code] = true;
                              return n;
                            })}
                            className={`text-white text-xs font-black px-2.5 py-1 rounded-lg active:scale-95 transition-all ${repetidasSelected[code] ? 'bg-slate-800 ring-2 ring-white/40' : 'bg-slate-500 hover:bg-slate-600'}`}
                          >
                            {repetidasSelected[code] ? '✓ ' : ''}{code}{name !== code ? ` · ${name}` : ''}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className={`mt-4 pt-4 border-t flex flex-wrap gap-3 ${darkMode ? 'border-slate-700' : 'border-slate-200'}`}>
              <button
                onClick={() => Object.keys(repetidasSelected).length > 0 && setRepetidasConfirmSelected(true)}
                disabled={Object.keys(repetidasSelected).length === 0}
                className={`px-6 py-3 rounded-2xl font-black transition-colors ${Object.keys(repetidasSelected).length > 0 ? 'bg-orange-500 text-white' : darkMode ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
              >
                {Object.keys(repetidasSelected).length > 0 ? `CONFIRMAR (${Object.keys(repetidasSelected).length})` : 'NADA SELECCIONADO'}
              </button>
              <button
                onClick={() => Object.keys(repetidasPending).length > 0 && setRepetidasConfirmSave(true)}
                disabled={Object.keys(repetidasPending).length === 0}
                className={`px-6 py-3 rounded-2xl font-black transition-colors ${Object.keys(repetidasPending).length > 0 ? 'bg-green-600 text-white' : darkMode ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
              >
                {Object.keys(repetidasPending).length > 0 ? `GUARDAR (${Object.keys(repetidasPending).length})` : 'SIN CAMBIOS'}
              </button>
              <button
                onClick={() => setShowExportText(true)}
                disabled={repetidasGrouped.length === 0}
                className={`px-6 py-3 rounded-2xl font-black transition-colors ${repetidasGrouped.length > 0 ? 'bg-blue-600 text-white' : darkMode ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
              >
                EXPORTAR TEXTO
              </button>
              <button
                onClick={() => setShowRepetidasQR(true)}
                className="bg-purple-600 text-white px-6 py-3 rounded-2xl font-black"
              >
                COMPARTIR QR
              </button>
              <button
                onClick={() => repetidasGrouped.length > 0 && setRepetidasConfirmLimpiar(true)}
                disabled={repetidasGrouped.length === 0}
                className={`px-6 py-3 rounded-2xl font-black transition-colors ${repetidasGrouped.length > 0 ? 'bg-red-600 text-white' : darkMode ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
              >
                LIMPIAR REPETIDAS
              </button>
              <button
                onClick={() => {
                  if (Object.keys(repetidasPending).length > 0 || Object.keys(repetidasSelected).length > 0) {
                    setRepetidasConfirmExit(true);
                  } else {
                    setCurrentView('home');
                  }
                }}
                className={`px-6 py-3 rounded-2xl font-black ${darkMode ? `bg-[${PAL.borderDark}] text-white` : 'bg-slate-200 text-slate-800'}`}
              >
                ← VOLVER
              </button>
            </div>
            {repetidasConfirmSelected && (() => {
              const n = Object.keys(repetidasSelected).length;
              return (
                <div className="fixed inset-0 z-[70] bg-black/60 flex items-center justify-center p-4">
                  <div className={`rounded-3xl p-6 shadow-2xl w-full max-w-sm ${darkMode ? `bg-[${PAL.surfaceCardDark}] text-white` : 'bg-white'}`}>
                    <h3 className="text-xl font-black mb-3">¿Marcar como pegadas?</h3>
                    <p className={`mb-5 text-sm ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                      {n} figurita{n !== 1 ? 's' : ''} pasará{n !== 1 ? 'n' : ''} de repetida{n !== 1 ? 's' : ''} (2) a pegada{n !== 1 ? 's' : ''} (1).
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setRepetidasPending(prev => ({ ...prev, ...repetidasSelected }));
                          setRepetidasSelected({});
                          setRepetidasConfirmSelected(false);
                        }}
                        className="flex-1 bg-green-600 text-white px-4 py-3 rounded-2xl font-black"
                      >
                        CONFIRMAR
                      </button>
                      <button
                        onClick={() => setRepetidasConfirmSelected(false)}
                        className={`flex-1 px-4 py-3 rounded-2xl font-black ${darkMode ? `bg-[${PAL.borderDark}] text-white` : 'bg-slate-200 text-slate-800'}`}
                      >
                        CANCELAR
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}
            {repetidasConfirmSave && (() => {
              const n = Object.keys(repetidasPending).length;
              return (
                <div className="fixed inset-0 z-[70] bg-black/60 flex items-center justify-center p-4">
                  <div className={`rounded-3xl p-6 shadow-2xl w-full max-w-sm ${darkMode ? `bg-[${PAL.surfaceCardDark}] text-white` : 'bg-white'}`}>
                    <h3 className="text-xl font-black mb-3">¿Confirmar cambios?</h3>
                    <p className={`mb-5 text-sm ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                      Se marcarán {n} figurita{n !== 1 ? 's' : ''} como pegada{n !== 1 ? 's' : ''}.
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setCompleted(prev => {
                            const next = { ...prev };
                            for (const code of Object.keys(repetidasPending)) {
                              next[code] = true;
                            }
                            return next;
                          });
                          setRepetidasPending({});
                          setRepetidasConfirmSave(false);
                        }}
                        className="flex-1 bg-green-600 text-white px-4 py-3 rounded-2xl font-black"
                      >
                        CONFIRMAR
                      </button>
                      <button
                        onClick={() => setRepetidasConfirmSave(false)}
                        className={`flex-1 px-4 py-3 rounded-2xl font-black ${darkMode ? `bg-[${PAL.borderDark}] text-white` : 'bg-slate-200 text-slate-800'}`}
                      >
                        CANCELAR
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}
            {repetidasConfirmExit && (
              <div className="fixed inset-0 z-[70] bg-black/60 flex items-center justify-center p-4">
                <div className={`rounded-3xl p-6 shadow-2xl w-full max-w-sm ${darkMode ? `bg-[${PAL.surfaceCardDark}] text-white` : 'bg-white'}`}>
                  <h3 className="text-xl font-black mb-3">Cambios sin guardar</h3>
                  <p className={`mb-5 text-sm ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                    Tenés cambios sin guardar. ¿Salir de todas formas?
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setRepetidasPending({});
                        setRepetidasSelected({});
                        setRepetidasConfirmExit(false);
                        setCurrentView('home');
                      }}
                      className="flex-1 bg-red-600 text-white px-4 py-3 rounded-2xl font-black"
                    >
                      SALIR
                    </button>
                    <button
                      onClick={() => setRepetidasConfirmExit(false)}
                      className={`flex-1 px-4 py-3 rounded-2xl font-black ${darkMode ? `bg-[${PAL.borderDark}] text-white` : 'bg-slate-200 text-slate-800'}`}
                    >
                      CANCELAR
                    </button>
                  </div>
                </div>
              </div>
            )}
            {repetidasConfirmLimpiar && (() => {
              const totalRepetidas = Object.values(completed).filter(v => v === 'repeated').length;
              return (
                <div className="fixed inset-0 z-[70] bg-black/60 flex items-center justify-center p-4">
                  <div className={`rounded-3xl p-6 shadow-2xl w-full max-w-sm ${darkMode ? `bg-[${PAL.surfaceCardDark}] text-white` : 'bg-white'}`}>
                    <h3 className="text-xl font-black mb-3">¿Limpiar repetidas?</h3>
                    <p className={`mb-5 text-sm ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                      {totalRepetidas} figurita{totalRepetidas !== 1 ? 's' : ''} repetida{totalRepetidas !== 1 ? 's' : ''} volverá{totalRepetidas !== 1 ? 'n' : ''} a estado pegado (1). Esta acción no se puede deshacer.
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setCompleted(prev => {
                            const next = { ...prev };
                            for (const code of Object.keys(next)) {
                              if (next[code] === 'repeated') next[code] = true;
                            }
                            return next;
                          });
                          setRepetidasPending({});
                          setRepetidasSelected({});
                          setRepetidasConfirmLimpiar(false);
                        }}
                        className="flex-1 bg-red-600 text-white px-4 py-3 rounded-2xl font-black"
                      >
                        LIMPIAR
                      </button>
                      <button
                        onClick={() => setRepetidasConfirmLimpiar(false)}
                        className={`flex-1 px-4 py-3 rounded-2xl font-black ${darkMode ? `bg-[${PAL.borderDark}] text-white` : 'bg-slate-200 text-slate-800'}`}
                      >
                        CANCELAR
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}
            {showExportText && (() => {
              const lines = repetidasGrouped.map(({ team, info, codes }) => {
                const flag = info?.flag || '';
                const name = info?.name || team;
                const stickers = codes.map(code => {
                  const n = getPlayerNameForCode(code, team);
                  return n !== code ? `${code} (${n})` : code;
                }).join(', ');
                return `${flag} ${name}: ${stickers}`;
              });
              const text = `Figuritas repetidas de ${ALBUM_OWNER} - FIFA World Cup 2026\n\n${lines.join('\n')}`;
              return (
                <div className="fixed inset-0 z-[70] bg-black/60 flex items-center justify-center p-4">
                  <div className={`rounded-3xl p-6 shadow-2xl w-full max-w-lg ${darkMode ? `bg-[${PAL.surfaceCardDark}] text-white` : 'bg-white'}`}>
                    <h3 className="text-xl font-black mb-1">Exportar repetidas</h3>
                    <p className={`text-xs mb-4 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      Copiá el texto para pegarlo en WhatsApp o un correo
                    </p>
                    <textarea
                      readOnly
                      value={text}
                      rows={Math.min(lines.length + 3, 14)}
                      onClick={e => e.target.select()}
                      className={`w-full rounded-2xl p-4 text-sm font-mono resize-none border outline-none ${darkMode ? 'bg-slate-800 text-white border-slate-600' : 'bg-slate-50 text-slate-800 border-slate-200'}`}
                    />
                    <div className="flex gap-3 mt-4">
                      <button
                        onClick={() => navigator.clipboard.writeText(text)}
                        className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-2xl font-black"
                      >
                        COPIAR
                      </button>
                      <button
                        onClick={() => setShowExportText(false)}
                        className={`flex-1 px-4 py-3 rounded-2xl font-black ${darkMode ? `bg-[${PAL.borderDark}] text-white` : 'bg-slate-200 text-slate-800'}`}
                      >
                        CERRAR
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {currentView === 'faltan' && (
          <div className={`rounded-3xl p-6 sm:p-8 shadow-xl max-w-2xl mx-auto transition-colors duration-300 ${darkMode ? `bg-[${PAL.surfaceCardDark}] text-white` : 'bg-white'}`}>
            <h2 className="text-3xl font-black italic uppercase mb-6">Me Faltan</h2>
            {faltantesGrouped.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">🏆</div>
                <div className="font-black text-xl">¡Álbum completo!</div>
                <div className={`mt-2 text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Ya tenés todas las figuritas.
                </div>
              </div>
            ) : (
              <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-1 mb-4">
                {faltantesGrouped.map(({ team, info, codes }) => (
                  <div key={team} className={`rounded-2xl p-4 ${darkMode ? `bg-[${PAL.borderDark}]` : 'bg-slate-50'}`}>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-2xl leading-none">{info?.flag || '🏳️'}</span>
                      <div>
                        <div className="font-black uppercase text-sm">{info?.name || team}</div>
                        <div className={`text-[10px] uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-400'}`}>
                          {codes.length} falta{codes.length !== 1 ? 'n' : ''}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {codes.map(code => {
                        const name = getPlayerNameForCode(code, team);
                        return (
                          <span
                            key={code}
                            className="bg-slate-500 text-white text-xs font-black px-2.5 py-1 rounded-lg"
                          >
                            {code}{name !== code ? ` · ${name}` : ''}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className={`mt-4 pt-4 border-t flex flex-wrap gap-3 ${darkMode ? 'border-slate-700' : 'border-slate-200'}`}>
              <button
                onClick={() => setShowExportTextFaltan(true)}
                disabled={faltantesGrouped.length === 0}
                className={`px-6 py-3 rounded-2xl font-black transition-colors ${faltantesGrouped.length > 0 ? 'bg-blue-600 text-white' : darkMode ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
              >
                EXPORTAR TEXTO
              </button>
              <button
                onClick={() => setShowFaltanQR(true)}
                className="bg-purple-600 text-white px-6 py-3 rounded-2xl font-black"
              >
                COMPARTIR QR
              </button>
              <button
                onClick={() => setCurrentView('home')}
                className={`px-6 py-3 rounded-2xl font-black ${darkMode ? `bg-[${PAL.borderDark}] text-white` : 'bg-slate-200 text-slate-800'}`}
              >
                ← VOLVER
              </button>
            </div>
            {showExportTextFaltan && (() => {
              const lines = faltantesGrouped.map(({ team, info, codes }) => {
                const flag = info?.flag || '';
                const name = info?.name || team;
                const stickers = codes.map(code => {
                  const n = getPlayerNameForCode(code, team);
                  return n !== code ? `${code} (${n})` : code;
                }).join(', ');
                return `${flag} ${name}: ${stickers}`;
              });
              const text = `Figuritas que le faltan a ${ALBUM_OWNER} - FIFA World Cup 2026\n\n${lines.join('\n')}`;
              return (
                <div className="fixed inset-0 z-[70] bg-black/60 flex items-center justify-center p-4">
                  <div className={`rounded-3xl p-6 shadow-2xl w-full max-w-lg ${darkMode ? `bg-[${PAL.surfaceCardDark}] text-white` : 'bg-white'}`}>
                    <h3 className="text-xl font-black mb-1">Exportar faltantes</h3>
                    <p className={`text-xs mb-4 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      Copiá el texto para pegarlo en WhatsApp o un correo
                    </p>
                    <textarea
                      readOnly
                      value={text}
                      rows={Math.min(lines.length + 3, 14)}
                      onClick={e => e.target.select()}
                      className={`w-full rounded-2xl p-4 text-sm font-mono resize-none border outline-none ${darkMode ? 'bg-slate-800 text-white border-slate-600' : 'bg-slate-50 text-slate-800 border-slate-200'}`}
                    />
                    <div className="flex gap-3 mt-4">
                      <button
                        onClick={() => navigator.clipboard.writeText(text)}
                        className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-2xl font-black"
                      >
                        COPIAR
                      </button>
                      <button
                        onClick={() => setShowExportTextFaltan(false)}
                        className={`flex-1 px-4 py-3 rounded-2xl font-black ${darkMode ? `bg-[${PAL.borderDark}] text-white` : 'bg-slate-200 text-slate-800'}`}
                      >
                        CERRAR
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {currentView === 'stats-selections' && (
          <div className={`rounded-3xl p-6 sm:p-8 shadow-xl max-w-4xl mx-auto transition-colors duration-300 ${darkMode ? `bg-[${PAL.surfaceCardDark}] text-white` : 'bg-white'}`}>
            <h2 className="text-3xl font-black italic uppercase mb-6">Estadísticas Selecciones</h2>
            <div className="max-h-[60vh] overflow-y-auto space-y-3 pr-1">
              {selectionStats.map((item) => {
                const isComplete = item.completed === item.total;
                return (
                  <div key={item.key} className={`font-black text-lg sm:text-xl flex items-center gap-2 ${isComplete ? 'text-green-500' : ''}`}>
                    <span>{item.emoji} {item.name}: {item.completed} / {item.total}</span>
                    {isComplete && (
                      <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full font-black uppercase tracking-wide">
                        Completo
                      </span>
                    )}
                  </div>
                );
              })}
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
            {teams.filter(team => team !== 'FWCI2' && team !== 'FWCH2').map((team) => (
              <button
                key={team}
                onClick={() => {
                  setCurrentTeamIndex(teams.indexOf(team));
                  setCurrentView('album');
                }}
                className={`rounded-2xl p-4 shadow font-black italic active:scale-95 transition-colors duration-300 flex items-center gap-2 ${darkMode ? `bg-[${PAL.surfaceCardDark}] text-white` : 'bg-white'}`}
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
            style={{ background: PAL.groupsRadial }}
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
                style={{ backgroundColor: PAL.introBtnBg, color: PAL.introBtnText }}
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
                style={{ backgroundColor: PAL.championsBtnBg, color: PAL.championsBtnText }}
              >
                CAMPEONES
              </button>
            </div>
          </div>
        )}

        {currentView === 'groups' && (
          <div className={`lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t shadow-lg transition-colors duration-300 ${darkMode ? `bg-[${PAL.surfaceDark}] border-[${PAL.borderDark}]` : 'bg-white border-slate-200'}`}>
            <div className="flex">
              <button
                onClick={() => setCurrentView('home')}
                className={`flex-1 py-4 font-black italic text-sm border-r active:bg-slate-100 transition-colors ${darkMode ? `border-[${PAL.borderDark}] text-white` : 'border-slate-200'}`}
              >
                HOME
              </button>
              <div className={`flex-1 border-r ${darkMode ? `border-[${PAL.borderDark}]` : 'border-slate-200'}`} />
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
                className={`rounded-full px-6 py-3 shadow font-bold italic transition-colors duration-300 ${darkMode ? `bg-[${PAL.surfaceDark}] text-white border border-[${PAL.borderDarkAlt}]` : 'bg-white text-black'}`}
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
                className={`rounded-full px-6 py-3 shadow font-bold italic transition-colors duration-300 ${darkMode ? `bg-[${PAL.surfaceDark}] text-white border border-[${PAL.borderDarkAlt}]` : 'bg-white text-black'}`}
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

            <div className={`overflow-hidden rounded-[2rem] border-4 transition-colors duration-300 ${darkMode ? `border-[${PAL.borderDark}] bg-[${PAL.surfaceCardDark}]` : 'border-slate-200 bg-white'} grid lg:grid-cols-2`}>
              {currentTeam.startsWith('FWCH') ? (
                <>
                  <div className={`p-3 sm:p-8 border-b lg:border-b-0 lg:border-r transition-colors duration-300 ${darkMode ? `border-[${PAL.borderDark}] bg-[${PAL.surfaceCardDark}]` : `border-slate-300 bg-[${PAL.historyBg}]`}`}>
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
                              className={`border-2 rounded-xl sm:rounded-2xl p-2 sm:p-4 w-full flex items-center justify-center text-center aspect-[3/2] transition-colors duration-300 ${darkMode ? `border-slate-600 bg-[${PAL.borderDark}] text-slate-400` : 'border-slate-300 bg-slate-200 text-slate-600'}`}
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

                  <div className={`p-3 sm:p-8 transition-colors duration-300 ${darkMode ? `bg-[${PAL.surfacePanelDark}]` : `bg-[${PAL.historyPanelLight}]`}`}>
                    <div className="grid grid-cols-4 gap-2 sm:gap-4">
                      {historyPageItems[currentTeam].slice(Math.ceil(historyPageItems[currentTeam].length / 2)).map((item, index) => {
                        if (item.type === 'printed') {
                          return (
                            <div
                              key={`${currentTeam}-printed-right-${index}`}
                              className={`border-2 rounded-xl sm:rounded-2xl p-2 sm:p-4 w-full flex items-center justify-center text-center aspect-[3/2] transition-colors duration-300 ${darkMode ? `border-slate-600 bg-[${PAL.borderDark}] text-slate-400` : 'border-slate-300 bg-slate-200 text-slate-600'}`}
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
                  <div className={`p-3 sm:p-8 border-b lg:border-b-0 lg:border-r transition-colors duration-300 ${darkMode ? `border-[${PAL.borderDark}]` : 'border-slate-300'} ${getInnerPanelClass(currentTeam, darkMode)} hidden lg:block`}>
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
                            ? { backgroundColor: PAL.groupPanelBgDark, borderColor: PAL.groupPanelBorderDark }
                            : { backgroundColor: PAL.groupPanelBgLight, borderColor: PAL.groupPanelBorderLight }
                          }
                        >
                          <div
                            className="font-black uppercase text-[11px] mb-1.5 tracking-widest text-center"
                            style={{ color: darkMode ? PAL.groupPanelLabelDark : grpColor }}
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
              <div className={`p-3 sm:p-8 border-b lg:border-b-0 lg:border-r transition-colors duration-300 ${darkMode ? `border-[${PAL.borderDark}]` : 'border-slate-300'} ${getInnerPanelClass(currentTeam, darkMode)} ${currentTeam !== 'COCA' ? 'hidden lg:block' : ''}`}>
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
                  {stickers.slice(10, currentTeam === 'COCA' ? 13 : 12).map((sticker) => (
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
                          ? { backgroundColor: PAL.groupPanelBgDark, borderColor: PAL.groupPanelBorderDark }
                          : { backgroundColor: PAL.groupPanelBgLight, borderColor: PAL.groupPanelBorderLight }
                        }
                      >
                        <div
                          className="font-black uppercase text-[11px] mb-1.5 tracking-widest text-center"
                          style={{ color: darkMode ? PAL.groupPanelLabelDark : grpColor }}
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
        <div className={`lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t shadow-lg transition-colors duration-300 ${darkMode ? `bg-[${PAL.surfaceDark}] border-[${PAL.borderDark}]` : 'bg-white border-slate-200'}`}>
          <div className="flex">
            <button
              onClick={() => currentTeam === 'FWCI1' ? setCurrentView('groups') : prevTeam()}
              className={`flex-1 py-4 font-black italic text-sm border-r active:bg-slate-100 transition-colors ${darkMode ? `border-[${PAL.borderDark}] text-white` : 'border-slate-200'}`}
            >
              ← ANTERIOR
            </button>
            <button
              onClick={() => setCurrentView('teams')}
              className={`flex-1 py-4 font-black uppercase text-sm border-r active:bg-slate-100 transition-colors ${darkMode ? `border-[${PAL.borderDark}] text-white` : 'border-slate-200'}`}
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
          <div className={`rounded-3xl p-6 sm:p-8 shadow-2xl w-full max-w-md transition-colors duration-300 ${darkMode ? `bg-[${PAL.surfaceCardDark}] text-white` : 'bg-white'}`}>
            <h3 className="text-2xl font-black italic uppercase mb-6">Estadísticas</h3>
            <div className="space-y-3 font-black">
              <div>Figuritas completadas: {completedCount} / {TOTAL_STICKERS}</div>
              <div>
                <div className="flex justify-between mb-1">
                  <span>Progreso</span>
                  <span>{formatPercent(completionPercent)}%</span>
                </div>
                <div className={`w-full rounded-full h-3 ${darkMode ? 'bg-slate-700' : 'bg-slate-200'}`}>
                  <div
                    className="bg-green-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${completionPercent}%` }}
                  />
                </div>
              </div>
              <div>Me faltan: {remainingCount}</div>
              <div>Brillantes: {brilliantCompletedCount} / {brilliantCodes.length}</div>
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
            <div className={`mt-4 pt-4 border-t ${darkMode ? 'border-slate-700' : 'border-slate-200'} flex flex-wrap gap-3`}>
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
                onClick={handleMarkProgress}
                className="bg-purple-600 text-white px-6 py-3 rounded-2xl font-black"
              >
                Marcar Progreso
              </button>
              <button
                onClick={() => { setShowStats(false); setShowProgressHistory(true); }}
                className="bg-orange-500 text-white px-6 py-3 rounded-2xl font-black"
              >
                Ver Progreso
              </button>
              {progressMessage && (
                <span className="w-full text-green-600 font-black">{progressMessage}</span>
              )}
              <button
                onClick={() => setShowStats(false)}
                className={`px-6 py-3 rounded-2xl font-black ${darkMode ? 'bg-slate-600 text-white' : 'bg-slate-300 text-slate-800'}`}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
      {showProgressHistory && (
        <ProgressHistoryModal
          history={progressHistory}
          darkMode={darkMode}
          onClose={() => setShowProgressHistory(false)}
        />
      )}
      {showQR && <QRModal onClose={() => setShowQR(false)} />}
      {showRepetidasQR && <QRModal url={window.location.origin + window.location.pathname + '?view=repetidas'} onClose={() => setShowRepetidasQR(false)} />}
      {showFaltanQR && <QRModal url={window.location.origin + window.location.pathname + '?view=faltan'} onClose={() => setShowFaltanQR(false)} />}
      {celebration && (
        <CelebrationModal celebration={celebration} onClose={closeCelebration} />
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

  const isStarSticker = playerNames[currentTeam]?.star === sticker.id;

  // empty → slate-300 (más visible), completed → green-400 (verde sólido), repeated → slate-400
  const decorColor = sticker.repeated ? PAL.stickerDecorRepeated : sticker.completed ? PAL.stickerDecorCompleted : PAL.stickerDecorEmpty;

  const svgStyle = { position: 'absolute', top: '6%', left: '20%', width: '60%', opacity: 0.5, pointerEvents: 'none', zIndex: 0 };

  const repeatedBg = darkMode ? 'bg-slate-300 border-slate-400' : 'bg-slate-500 border-slate-500';
  const emptyBg = darkMode ? `bg-[${PAL.borderDark}] border-slate-600` : 'bg-white border-slate-300';
  const completedBg = darkMode ? 'bg-green-900 border-green-500' : 'bg-green-100 border-green-500';

  const repeatedCodeClass = darkMode ? 'text-slate-700 font-extrabold' : 'text-slate-100 font-extrabold';
  const repeatedLabelClass = darkMode ? 'text-slate-800 font-extrabold' : 'text-slate-100';

  const paniniStyle = sticker.code === '00' && !sticker.repeated ? {
    background: PAL.paniniFoilGradient,
    borderColor: PAL.paniniFoilBorder
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
      {isStarSticker && (
        <div
          className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 text-sm sm:text-xl leading-none drop-shadow"
          style={{ color: '#FFD700', zIndex: 2 }}
          aria-hidden="true"
        >
          ⭐
        </div>
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
  FWC9: 'ITALIA 1934', FWC10: 'BRASIL 1950', FWC11: 'RF ALEMANIA 1954',
  FWC12: 'BRASIL 1962', FWC13: 'RF ALEMANIA 1974', FWC14: 'ARGENTINA 1986',
  FWC15: 'BRASIL 1994', FWC16: 'BRASIL 2002', FWC17: 'ITALIA 2006',
  FWC18: 'ALEMANIA 2014', FWC19: 'ARGENTINA 2022',
};

function getTeamForCode(code) {
  if (code === '00') return 'FWCI1';
  const fwcMatch = code.match(/^FWC(\d+)$/);
  if (fwcMatch) {
    const n = parseInt(fwcMatch[1]);
    if (n <= 8) return 'FWCI1';
    if (n <= 13) return 'FWCH1';
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
    return playerNames[team]?.players?.[id] || `Jugador ${id}`;
  }
  return code;
}

function ProgressHistoryModal({ history, darkMode, onClose }) {
  const rows = [...history].sort((a, b) => (a.timestamp ?? 0) - (b.timestamp ?? 0));
  return (
    <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
      <div className={`rounded-3xl p-6 sm:p-8 shadow-2xl w-full max-w-2xl transition-colors duration-300 ${darkMode ? `bg-[${PAL.surfaceCardDark}] text-white` : 'bg-white'}`}>
        <h3 className="text-2xl font-black italic uppercase mb-6">Ver Progreso</h3>
        {rows.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-3">📊</div>
            <div className="font-black text-xl">Todavía no hay registros</div>
            <div className={`mt-2 text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Usá "Marcar Progreso" para guardar una foto de tu avance.
            </div>
          </div>
        ) : (
          <div className="max-h-[60vh] overflow-auto rounded-2xl border border-slate-300/30">
            <table className="w-full text-sm">
              <thead className={`sticky top-0 ${darkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
                <tr className="text-left font-black uppercase text-xs">
                  <th className="px-3 py-2">Fecha y Hora</th>
                  <th className="px-3 py-2 text-right">% Completado</th>
                  <th className="px-3 py-2 text-right">% Restante</th>
                  <th className="px-3 py-2 text-right">Completadas</th>
                  <th className="px-3 py-2 text-right">Restantes</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((entry) => (
                  <tr key={entry.id ?? entry.dateLabel} className={`border-t ${darkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                    <td className="px-3 py-2 font-black whitespace-nowrap">{entry.dateLabel}</td>
                    <td className="px-3 py-2 text-right">{formatPercent(entry.percentCompleted)}%</td>
                    <td className="px-3 py-2 text-right">{formatPercent(entry.percentRemaining)}%</td>
                    <td className="px-3 py-2 text-right">{entry.completedCount}</td>
                    <td className="px-3 py-2 text-right">{entry.remainingCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="mt-6 flex flex-wrap gap-3">
          <button onClick={onClose}
            className={`px-6 py-3 rounded-2xl font-black ${darkMode ? 'bg-slate-600 text-white' : 'bg-slate-300 text-slate-800'}`}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}

function QRModal({ onClose, url }) {
  const qrRef = useRef(null);
  const qrUrl = url || (window.location.origin + window.location.pathname + '?view=repetidas');

  useEffect(() => {
    if (qrRef.current && window.QRCode) {
      new window.QRCode(qrRef.current, { text: qrUrl, width: 200, height: 200 });
    }
  }, []);

  return (
    <div className="fixed inset-0 z-[70] bg-black/70 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 shadow-2xl flex flex-col items-center gap-4 max-w-xs w-full">
        <h3 className="text-lg font-black italic uppercase">Figuritas Repetidas</h3>
        <div ref={qrRef} />
        <p className="text-xs text-slate-400 text-center break-all">{qrUrl}</p>
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
      <div className={`min-h-screen bg-[${PAL.bgMain}] flex items-center justify-center`}>
        <div className="text-white font-black text-xl">Cargando...</div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-[${PAL.bgMain}]`}>
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

function RepeatidasUsuarioExternoView() {
  const [stickerData, setStickerData] = useState(null);

  useEffect(() => {
    if (progressDocRef) {
      const unsub = onSnapshot(progressDocRef, (snap) => {
        setStickerData(snap.exists() ? (snap.data()?.stickers || {}) : {});
      }, () => {
        const local = localStorage.getItem(LOCAL_STORAGE_KEY);
        setStickerData(local ? JSON.parse(local) : {});
      });
      return unsub;
    }
    const local = localStorage.getItem(LOCAL_STORAGE_KEY);
    setStickerData(local ? JSON.parse(local) : {});
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
      <div className={`min-h-screen bg-[${PAL.bgMain}] flex items-center justify-center`}>
        <div className="text-white font-black text-xl">Cargando...</div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-[${PAL.bgMain}]`}>
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-black italic uppercase text-white">FIGURITAS REPETIDAS</h1>
          <p className="text-sm text-slate-300 uppercase tracking-widest mt-1">{albumConfig.title}</p>
        </div>
        {grouped.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center text-slate-800">
            <div className="text-4xl mb-3">🙌</div>
            <div className="font-black text-xl">¡No hay repetidas!</div>
            <div className="text-slate-500 mt-2 text-sm">
              No hay figuritas repetidas disponibles.
            </div>
          </div>
        ) : grouped.map(({ team, info, codes }) => (
          <div key={team} className="bg-white rounded-2xl p-4 shadow mb-3">
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
      </div>
    </div>
  );
}

function FaltanView() {
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
    for (const team of teams) {
      const missing = getTeamCodes(team).filter((code) => {
        const v = stickerData[code];
        return v !== true && v !== 'repeated';
      });
      if (missing.length) byTeam[team] = missing;
    }
    return teams
      .filter(t => byTeam[t])
      .map(t => ({ team: t, info: teamData[t], codes: byTeam[t] }));
  }, [stickerData]);

  if (!stickerData) {
    return (
      <div className={`min-h-screen bg-[${PAL.bgMain}] flex items-center justify-center`}>
        <div className="text-white font-black text-xl">Cargando...</div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-[${PAL.bgMain}]`}>
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <h1 className="text-lg font-black italic uppercase text-slate-800">
            Figuritas que le faltan a {ALBUM_OWNER}
          </h1>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest">FIFA World Cup 2026</p>
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-5 space-y-3">
        {grouped.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center text-slate-800">
            <div className="text-4xl mb-3">🏆</div>
            <div className="font-black text-xl">¡Álbum completo!</div>
            <div className="text-slate-500 mt-2 text-sm">
              Ya tiene todas las figuritas.
            </div>
          </div>
        ) : grouped.map(({ team, info, codes }) => (
          <div key={team} className="bg-white rounded-2xl p-4 shadow">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl leading-none">{info?.flag || '🏳️'}</span>
              <div>
                <div className="font-black uppercase text-sm text-slate-800">{info?.name || team}</div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider">
                  {codes.length} falta{codes.length !== 1 ? 'n' : ''}
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
  const isAchievement = celebration.type === 'achievement';
  const team = celebration.team;
  const teamInfo = team ? teamData[team] : null;
  const themeKey = team ? getThemeKey(team) : null;
  const theme = themeKey ? teamThemes[themeKey] : null;

  const gradientClass = isAlbum || isAchievement
    ? 'from-yellow-400 via-pink-500 to-purple-600'
    : theme?.gradient || 'from-emerald-500 to-green-600';

  const confettiColors = isAlbum || isAchievement
    ? PAL.confettiAlbum
    : team === 'COCA'
    ? PAL.confettiCoca
    : getTeamConfettiColors(team);

  const isDark = isAlbum || isAchievement || theme?.dark;

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
            {isAchievement ? celebration.icono : isAlbum ? '🏆' : teamInfo?.flag || '🏅'}
          </div>
          <div className={`text-4xl font-black italic uppercase mb-2 drop-shadow ${isDark ? 'text-white' : 'text-slate-800'}`}>
            ¡Felicitaciones!
          </div>
          <div className={`text-xl font-black mb-8 ${isDark ? 'text-white/90' : 'text-slate-700'}`}>
            {isAchievement
              ? celebration.mensaje
              : isAlbum
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
