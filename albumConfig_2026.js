// ─────────────────────────────────────────────────────────────────────────────
// albumConfig_2026.js
// ─────────────────────────────────────────────────────────────────────────────
// Configuración externa centralizada del Álbum Virtual Panini FIFA World Cup 2026.
//
// Este archivo replica el patrón del álbum 2022 (`albumConfig_2022.js`): TODO lo
// que antes estaba hardcodeado en `panini_virtual_album_2026_app.jsx` (identidad,
// conteos, catálogo de equipos, grupos, secciones especiales, navegación entre
// proyectos y paleta de colores) vive ahora acá, como única fuente de verdad.
//
// IMPORTANTE: este archivo es una refactorización pura. Ningún valor cambió
// respecto del JSX original: mismos conteos (981), mismo `id`
// (`paniniWorldCup2026`, clave de Firestore/localStorage), mismos colores y misma
// estructura. Solo cambió *dónde viven* los datos.
// ─────────────────────────────────────────────────────────────────────────────

export const albumConfig = {
  // ── Identidad y almacenamiento ─────────────────────────────────────────────
  // `id` es la clave usada en Firestore (albumProgress/albumSettings) y como
  // prefijo en localStorage. NO debe cambiar: rompería la persistencia existente.
  id: 'paniniWorldCup2026',
  owner: 'Facundo',
  title: 'ÁLBUM VIRTUAL 2026',
  subtitle: 'FIFA WORLD CUP',
  exportFileName: 'panini2026_backup.json',
  localStorageKey: 'paniniWorldCup2026_stickers',
  localStorageDarkKey: 'paniniWorldCup2026_darkMode',

  // ── Conteos oficiales ──────────────────────────────────────────────────────
  // Total de la colección oficial Panini = 981.
  //   1 (PANINI) + 8 (FWC Intro) + 12 (FWC Historia) + 48×20 (selecciones) = 981
  // Coca-Cola (CC1–CC14) existe en el álbum pero NO cuenta en el total oficial.
  totalStickers: 981,
  teamStickerCount: 20,
  counts: {
    team: 20,   // STICKERS_TEAM
    fwci: 9,    // STICKERS_FWCI  (PANINI + FWC1..FWC8, repartidos en FWCI1/FWCI2)
    fwch: 12,   // STICKERS_FWCH  (FWC9..FWC20, repartidos en FWCH1/FWCH2)
    coca: 14,   // STICKERS_COCA  (CC1..CC14, fuera del conteo oficial)
  },

  // ── Orden de navegación de secciones/equipos ───────────────────────────────
  // Incluye las secciones especiales en su posición real de recorrido:
  // FWCI1 al inicio; FWCH1, FWCH2 y COCA al final. (FWCI2 no está en este array:
  // en el 2026 la intro se renderiza desde FWCI1 en una sola página partida en
  // dos paneles, igual que el JSX original.)
  teams: [
    'FWCI1',
    'MEX','RSA','KOR','CZE','CAN','BIH','QAT','SUI','BRA','MAR','HAI','SCO',
    'USA','PAR','AUS','TUR','GER','CUW','CIV','ECU','NED','JPN','SWE','TUN',
    'BEL','EGY','IRN','NZL','ESP','CPV','KSA','URU','FRA','SEN','IRQ','NOR',
    'ARG','ALG','AUT','JOR','POR','COD','UZB','COL','ENG','CRO','GHA','PAN',
    'FWCH1',
    'FWCH2',
    'COCA',
  ],

  // ── Metadatos de cada sección/equipo ───────────────────────────────────────
  // Las secciones especiales (FWCI1, FWCI2, FWCH1, FWCH2, COCA) conviven con las
  // 48 selecciones en este mismo objeto, igual que en el JSX original.
  teamData: {
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
    USA: { name: 'Estados Unidos', federation: 'U.S. Soccer Federation', flag: '🇺🇸' },
  },

  // ── Pertenencia a grupo de cada selección (mini-tabla de cada página) ───────
  teamGroups: {
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
  },

  // ── Los 12 grupos A–L con su color y selecciones ───────────────────────────
  groups: {
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
  },

  // ── Iconos del índice para las secciones especiales ────────────────────────
  indexTeamIcons: {
    FWCI1: '⚽',
    FWCI2: '⚽',
    FWCH1: '🏆',
    FWCH2: '🏆',
    COCA: '⚽',
  },

  // ── Secciones especiales: estructura real del álbum 2026 ────────────────────
  // OJO: a diferencia del 2022 (intro/historia como sección única), el 2026 parte
  // la intro y la historia en DOS páginas cada una:
  //   • Intro     → FWCI1 / FWCI2  (códigos 00, FWC1..FWC8)
  //   • Historia  → FWCH1 / FWCH2  (códigos FWC9..FWC20)
  // Se modela fielmente esa estructura para no alterar el render.
  specialSections: {
    // Intro — página 1 (la única que renderiza stickers; ver `teams`).
    // `items` = definición exacta de los 9 stickers de la intro (fwciDefs).
    FWCI1: {
      type: 'intro',
      stickerCount: 9,
      items: [
        { code: '00', label: 'PANINI', type: 'panini', displayCode: '00', displayLabel: 'PANINI' },
        { code: 'FWC1', label: 'Logo Copa 1', type: 'fwc' },
        { code: 'FWC2', label: 'Logo Copa 2', type: 'fwc' },
        { code: 'FWC3', label: 'Mascotas', type: 'fwc' },
        { code: 'FWC4', label: 'Póster', type: 'fwc' },
        { code: 'FWC5', label: 'Balón Oficial', type: 'fwc' },
        { code: 'FWC6', label: 'Póster Canadá', type: 'fwc' },
        { code: 'FWC7', label: 'Póster México', type: 'fwc' },
        { code: 'FWC8', label: 'Póster USA', type: 'fwc' },
      ],
    },
    // Intro — página 2 (presente en el catálogo/índice, sin render propio de stickers).
    FWCI2: {
      type: 'intro',
      stickerCount: 9,
    },
    // Historia — página 1. `pageItems` = grilla completa (stickers + impresos);
    // `selectable` = solo los stickers seleccionables de esta página.
    FWCH1: {
      type: 'history',
      stickerCount: 12,
      pageItems: [
        { type: 'printed', label: 'URUGUAY 1930' },
        { type: 'sticker', code: 'FWC9', label: 'ITALIA 1934' },
        { type: 'printed', label: 'ITALIA 1938' },
        { type: 'sticker', code: 'FWC10', label: 'URUGUAY 1950' },
        { type: 'sticker', code: 'FWC11', label: 'RF ALEMANIA 1954' },
        { type: 'sticker', code: 'FWC12', label: 'BRASIL 1958' },
        { type: 'sticker', code: 'FWC13', label: 'BRASIL 1962' },
        { type: 'printed', label: 'INGLATERRA 1966' },
        { type: 'printed', label: 'BRASIL 1970' },
        { type: 'sticker', code: 'FWC14', label: 'RF ALEMANIA 1974' },
      ],
      selectable: [
        { code: 'FWC9', label: 'ITALIA 1934' },
        { code: 'FWC10', label: 'URUGUAY 1950' },
        { code: 'FWC11', label: 'RF ALEMANIA 1954' },
        { code: 'FWC12', label: 'BRASIL 1958' },
        { code: 'FWC13', label: 'BRASIL 1962' },
        { code: 'FWC14', label: 'RF ALEMANIA 1974' },
      ],
    },
    // Historia — página 2.
    FWCH2: {
      type: 'history',
      stickerCount: 12,
      pageItems: [
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
        { type: 'sticker', code: 'FWC20', label: 'ARGENTINA 2022' },
      ],
      selectable: [
        { code: 'FWC15', label: 'ARGENTINA 1986' },
        { code: 'FWC16', label: 'BRASIL 1994' },
        { code: 'FWC17', label: 'BRASIL 2002' },
        { code: 'FWC18', label: 'ITALIA 2006' },
        { code: 'FWC19', label: 'ALEMANIA 2014' },
        { code: 'FWC20', label: 'ARGENTINA 2022' },
      ],
    },
    // Coca-Cola — colección promocional (no cuenta en el total oficial).
    COCA: {
      type: 'promo',
      stickerCount: 14,
    },
  },

  // ── Navegación "Otros Proyectos" ───────────────────────────────────────────
  // El álbum actual se excluye comparando `proyecto.id` con `albumConfig.id`.
  // Ver "Sección 8" en DOCUMENTACION_TECNICA.md para el procedimiento completo.
  proyectos: [
    {
      id: 'paniniWorldCup2026',
      label: 'Mundial 2026',
      url: 'https://facuca86.github.io/albumvirtual/',
      style: 'multicolor',
    },
    {
      id: 'paniniWorldCup2022',
      label: 'Mundial 2022 · Qatar',
      url: 'https://facuca86.github.io/albumvirtual-2022/',
      style: 'qatar',
    },
    {
      id: 'paniniCWC2025',
      label: 'Club World Cup 2025',
      url: 'https://facuca86.github.io/albumvirtual-cwc25/',
      style: 'cwc',
    },
    {
      id: 'paniniRussia2018',
      label: 'Mundial 2018 · Rusia',
      url: 'https://facuca86.github.io/albumvirtual-2018/',
      style: 'russia',
    },
    {
      id: 'paniniBrazil2014',
      label: 'Mundial 2014 · Brasil',
      url: 'https://facuca86.github.io/albumvirtual-2014/',
      style: 'brazil2014',
    },
    {
      id: 'paniniSouthAfrica2010',
      label: 'Mundial 2010 · Sudáfrica',
      url: 'https://facuca86.github.io/albumvirtual-2010/',
      style: 'southafrica2010',
    },
    {
      id: 'paniniGermany2006',
      label: 'Mundial 2006 · Alemania',
      url: 'https://facuca86.github.io/albumvirtual-2006/',
      style: 'germany2006',
    },
  ],

  // ── Paleta de colores centralizada ─────────────────────────────────────────
  // Todos los colores antes inline en el JSX, con nombres semánticos. Los valores
  // son IDÉNTICOS a los originales: el resultado visual no cambia, solo se
  // centraliza la fuente. Las clases Tailwind de valor arbitrario (`bg-[#...]`)
  // se reconstruyen en el JSX con estos valores, produciendo exactamente la misma
  // cadena de clase que antes.
  palette: {
    // Fondos de la app
    bgMain: '#880E4F',          // fondo principal (modo claro)
    bgDark: '#0f0f1a',          // fondo principal (modo oscuro)

    // Superficies en modo oscuro
    surfaceDark: '#1a1a2e',     // header, panel intro, navs móviles, dropdown buscador
    surfaceCardDark: '#1e1e30', // tarjetas y panel interno (oscuro)
    surfacePanelDark: '#252535',// panel derecho de Historia (oscuro)
    borderDark: '#2a2a4a',      // bordes, barra de progreso y paneles (oscuro)
    borderDarkAlt: '#3a3a5a',   // borde de botones de navegación del álbum
    inputBorderDark: '#4a4a6a', // borde del input de búsqueda (oscuro)

    // Superficies en modo claro
    panelLight: '#f7f5f2',         // panel interno (claro)
    historyPanelLight: '#faf8f5',  // panel derecho de Historia (claro)

    // Acentos de secciones especiales
    historyBg: '#0d2167',       // fondo de las páginas de Historia (FWCH)
    cocaBg: '#e41f1f',          // fondo de la sección Coca-Cola
    introBtnBg: '#FFD700',      // botón INTRO (vista grupos)
    introBtnText: '#E30613',
    championsBtnBg: '#0A4E97',  // botón CAMPEONES (vista grupos)
    championsBtnText: '#FFD700',
    groupsRadial: 'radial-gradient(ellipse at center, #C92A7A, #A11C5B, #FF5A00, #B18BEA, #5D93E6, #8FC8FF, #E9F52A, #006B4F)',

    // Mini-tabla de grupo dentro de la página de cada selección
    groupPanelBgDark: '#2a2a4a',
    groupPanelBorderDark: '#475569',
    groupPanelBgLight: 'rgba(255,255,255,0.6)',
    groupPanelBorderLight: '#cbd5e1',
    groupPanelLabelDark: '#e2e8f0',

    // Silueta decorativa de las figuritas de jugador
    stickerDecorEmpty: '#cbd5e1',
    stickerDecorCompleted: '#4ade80',
    stickerDecorRepeated: '#94a3b8',

    // Figurita PANINI (efecto foil metalizado)
    paniniFoilGradient: 'linear-gradient(135deg, #c0c0c0, #f8f8f8, #a8a8a8, #e8e8e8, #c0c0c0)',
    paniniFoilBorder: '#a0a0a0',

    // Estilos visuales de los botones de "Otros Proyectos"
    projectStyles: {
      multicolor: 'linear-gradient(135deg, #e53e3e, #dd6b20, #d69e2e, #38a169, #3182ce, #805ad5)',
      qatarBg: '#6B0F1A',
      qatarBorder: '#B8860B',
      cwcBg: '#000000',
      cwcBorder: '#B8860B',
      russiaBg: '#0E4CAC',
      brazil2014Bg: '#5FBFD8',
      brazil2014Text: '#5FA63A',
      southafrica2010Bg: '#D6491F',
      southafrica2010Text: '#F8E4B3',
      southafrica2010Border: '#B92F14',
      germany2006Bg: '#0A839C',
      germany2006Border: '#066F88',
    },

    // Colores de confeti de las celebraciones
    confettiAlbum: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FF8E53', '#FFEAA7', '#ffffff'],
    confettiCoca: ['#e41f1f', '#ff4444', '#ff6666', '#cc0000', '#ffffff', '#ffcccc'],
    confettiDefault: ['#4ade80', '#22c55e', '#60a5fa', '#ffffff'],
  },
};

export default albumConfig;
