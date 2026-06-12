# Documentación técnica del repositorio

## 1) Resumen del proyecto
Este repositorio implementa un **álbum virtual Panini FIFA World Cup 2026** en una sola página web basada en React, con carga en navegador sin bundler, y persistencia de progreso en Firestore cuando hay configuración disponible; en caso contrario, usa `localStorage`.

### Colección oficial
- **Total de stickers de la colección: 981**
- Desglose:
  | Sección | Stickers |
  |---|---|
  | Intro (PANINI + FWC1–FWC8) | 9 |
  | FWC Historia (FWC9–FWC20) | 12 |
  | 48 selecciones × 20 stickers | 960 |
  | **Total** | **981** |
- La sección Intro tiene **9 stickers en total**: el sticker PANINI (1) más los stickers FWC1 a FWC8 (8), distribuidos en dos páginas (FWCI1 y FWCI2).
- **Los stickers de Coca-Cola (CC1–CC14) NO forman parte de la colección oficial Panini.** Están físicamente presentes en el álbum como colección promocional, son seleccionables en la app, pero se excluyen del conteo de progreso (`completedCount`, `completionPercent`, `remainingCount`).

Arquitectónicamente, el proyecto está orientado a:
- UI en React (archivo principal JSX).
- Datos estáticos en archivos JS separados (temas y nombres de jugadores).
- Bootstrap de runtime en `index.html` usando `Babel Standalone` + `esm.sh`.
- Persistencia híbrida (Firestore + fallback local).

---

## 2) Estructura y propósito de archivos

### `index.html`
- Punto de entrada de la app.
- Carga Tailwind por CDN, Babel Standalone por CDN y **qrcodejs@1.0.0 por CDN** (script regular, expone `window.QRCode`).
- Hace `fetch` de los archivos fuente (`firebase.js`, `playerNames.js`, `teamThemes.js`, `panini_virtual_album_2026_app.jsx`).
- Reescribe imports para apuntar a módulos remotos (`react`, `react-dom`, `firebase`) y a blobs locales generados dinámicamente.
- Transpila JSX en runtime y monta la app en `#root`.
- **CDNs de Firebase**: se usa la CDN oficial de Google (`gstatic.com`) en lugar de `esm.sh` para garantizar que `firebase-app.js` y `firebase-firestore.js` compartan la misma instancia interna de `@firebase/app` (singleton del registro de componentes). Usar `esm.sh` para ambos módulos generaba dos registros separados y el error `Service firestore is not available`.

**Implicación técnica:** estrategia útil para prototipo/demo rápido, pero menos eficiente y menos robusta que un pipeline de build (Vite/Webpack) para producción.

### `panini_virtual_album_2026_app.jsx`
- Componente principal (`PaniniAlbum2026`).
- Contiene:
  - Catálogo de equipos/secciones.
  - Metadatos de equipos (`teamData`).
  - Lógica de estilos por selección (`teamThemes`).
  - Cálculo de stickers por sección/equipo.
  - Carga/guardado de progreso con `getDoc`/`setDoc` + fallback local.
  - Exportación del progreso como archivo JSON descargable.
  - Importación de progreso desde un archivo JSON con validación y persistencia inmediata.
  - Estados de navegación y visualización.
  - **Vista pública de repetidas** (`RepeatidasView`) accesible vía `?view=repetidas`.
  - **Generador de QR** (`QRModal`) para compartir el link de repetidas.
- Incluye reglas especiales para secciones como `FWCI*`, `FWCH*` y `COCA`.

### `firebase.js`
- Define `firebaseConfig` (actualmente como placeholder sin credenciales).
- Evalúa si existe configuración mínima (`apiKey`, `projectId`).
- Exporta `db` como instancia de Firestore o `null`.
- Registra warning cuando no hay configuración y se operará con almacenamiento local.

### `teamThemes.js`
- Mapa de gradientes Tailwind por código de selección/equipo.
- Incluye clave especial `FWCINTRO` para secciones intro.
- Se usa para construir clases de UI dinámicas en el componente principal.

### `playerNames.js`
- Fuente de datos de nombres por equipo y número de sticker.
- Es un archivo de datos grande, crítico para el render de nombres de jugadores.

### `TASKS_REFACTOR.md`
- Documento de deuda técnica / plan priorizado.
- Lista mejoras pendientes en cálculo de avance, ortografía visible, claridad de fuentes de verdad de datos y cobertura de pruebas.

---

## 3) Cambios solicitados e implementados

### 3.1 Solicitud recibida en esta iteración
Se solicitó explícitamente:
- Agregar **solo documentación técnica** en el repositorio.
- **No tocar código fuente**.

### 3.2 Implementación realizada en esta iteración
- Se creó este documento (`DOCUMENTACION_TECNICA.md`) con:
  - Descripción de arquitectura y flujo.
  - Inventario técnico de archivos.
  - Estado de solicitudes/tareas pendientes.
  - Recomendaciones técnicas generales.
- No se modificó lógica de negocio, UI ni configuración de runtime.

### 3.4 Exportar / Importar progreso (iteración actual)

**Motivación:** permitir al usuario hacer una copia de seguridad de su progreso y restaurarlo en otro dispositivo o ante pérdida de datos.

#### Cambios realizados — solo en `panini_virtual_album_2026_app.jsx`

| Tipo | Ubicación | Detalle |
|---|---|---|
| Estado nuevo | línea 121 | `const [importMessage, setImportMessage] = useState('')` — controla el mensaje de confirmación transitorio |
| Handler nuevo | `handleExport` | Serializa `completed` con `JSON.stringify`, crea un `Blob` de tipo `application/json`, genera una URL temporal con `URL.createObjectURL`, dispara la descarga como `panini2026_backup.json` y libera la URL con `URL.revokeObjectURL` |
| Handler nuevo | `handleImport` | Lee el archivo `.json` seleccionado con `FileReader`; al cargar, parsea el JSON y valida que sea un objeto no nulo y no array; llama `setCompleted(parsed)`, persiste en `localStorage` y en Firestore si `progressDocRef` está disponible; muestra `✅ Progreso importado` durante 2 segundos; resetea el input para permitir reimportar el mismo archivo |
| JSX — modal Stats | bloque `{showStats && ...}` | Se añadió una primera fila de botones (verde **EXPORTAR**, azul **IMPORTAR**) antes de los botones existentes; **IMPORTAR** es un `<label>` que envuelve un `<input type="file" accept=".json" className="hidden">` para abrir el selector de archivos nativo; debajo aparece el `importMessage` condicional |

#### Comportamiento en tiempo de ejecución

1. **Exportar**: el usuario abre el modal de Estadísticas y pulsa **EXPORTAR** → el navegador descarga `panini2026_backup.json` con el estado actual de `completed`.
2. **Importar**: el usuario pulsa **IMPORTAR** → se abre el selector de archivos del sistema → al seleccionar un `.json` válido, el progreso se restaura de inmediato en memoria, `localStorage` y Firestore (si está configurado) → aparece brevemente el mensaje de confirmación.

#### Lo que no se modificó

- No se tocó lógica de negocio (`toggleSticker`, ciclo de stickers, conteos).
- No se modificó el layout del álbum de escritorio ni móvil.
- No se alteraron `playerNames.js`, `teamThemes.js`, `firebase.js` ni `index.html`.
- No se agregaron dependencias externas.

---

### 3.5 Vista de figuritas repetidas y generador de QR

**Motivación:** permitir al usuario compartir fácilmente sus figuritas repetidas con otros coleccionistas, mediante una URL pública de solo lectura y un código QR para distribuir esa URL desde el celular.

#### Flujo de usuario

1. El usuario abre el modal de **Estadísticas** desde la pantalla principal.
2. Hace click en el nuevo botón **"Generar QR"** (violeta).
3. Se abre un overlay con el QR que apunta a `[URL del álbum]?view=repetidas`.
4. Otro coleccionista escanea el QR y ve la lista de repetidas, agrupada por equipo, en su dispositivo — sin necesidad de cuenta ni login.

#### Ruta `?view=repetidas`

La detección de ruta es intencional y mínima: al cargar el módulo se evalúa `window.location.search` una sola vez y se almacena en la constante de módulo `VIEW_PARAM`. Si su valor es `'repetidas'`, `PaniniAlbum2026` retorna `<RepeatidasView />` antes de montar cualquier estado propio.

```
https://facuca86.github.io/albumvirtual/?view=repetidas
```

Esta vista es **pública y de solo lectura**: cualquier persona con el link (o el QR) puede verla sin autenticación.

#### Cambios en `panini_virtual_album_2026_app.jsx`

| Elemento | Detalle |
|---|---|
| `ALBUM_OWNER` | Constante de módulo con el nombre del dueño del álbum (`"Facundo"`), mostrado en el header de `RepeatidasView` |
| `VIEW_PARAM` | Constante de módulo que lee `window.location.search` una vez al cargar; controla el branching de ruta |
| Early return en `PaniniAlbum2026` | Si `VIEW_PARAM === 'repetidas'`, retorna `<RepeatidasView />` y no monta ningún hook del álbum principal |
| Estado `showQR` | `useState(false)` en `PaniniAlbum2026`; controla la visibilidad del overlay QR |
| Botón "Generar QR" | Agregado al bloque de botones del modal de estadísticas, color `bg-purple-600` |
| `{showQR && <QRModal …/>}` | Render condicional del overlay QR, fuera del bloque `showStats` |
| `FWC_LABELS` | Mapa estático `código → etiqueta legible` para los stickers especiales (intro, historia). Evita duplicar la lógica de labels que ya existe en el `useMemo` principal |
| `getTeamForCode(code)` | Helper puro: dado un código de sticker, devuelve el código de equipo al que pertenece. Cubre PANINI, FWC1–FWC20, CC1–CC14 y todos los equipos normales |
| `getPlayerNameForCode(code, team)` | Helper puro: dado código y equipo, devuelve el nombre del jugador, una etiqueta especial (Escudo, Foto equipo, nombre del mundial) o el código mismo si no hay nombre disponible |
| `QRModal` | Componente funcional. Usa `useRef` + `useEffect` para instanciar `new window.QRCode(ref, { text, width, height })` post-mount. Muestra la URL en texto y un botón Cerrar. `z-[70]` para aparecer encima del modal de estadísticas (`z-[60]`) |
| `RepeatidasView` | Componente funcional. Carga el documento Firestore `albumProgress/paniniWorldCup2026` (o localStorage como fallback), filtra entradas con `value === 'repeated'`, agrupa por equipo respetando el orden del array `teams`, y renderiza una card por equipo con chips de figurita. Si no hay repetidas muestra un estado vacío |

#### Cambios en `index.html`

| Elemento | Detalle |
|---|---|
| Script `qrcodejs@1.0.0` | `<script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js">` agregado como script regular **antes** del `<script type="module">`. Al ser un script sincrónico, se ejecuta antes que el módulo diferido, garantizando que `window.QRCode` esté disponible cuando `QRModal` lo use |

#### Consideraciones técnicas

- **Sin nueva lógica de negocio**: `RepeatidasView` no escribe Firestore ni `localStorage`; es estrictamente lectura.
- **Sin nueva dependencia en el grafo de módulos**: `qrcodejs` se carga como script global y se accede vía `window.QRCode`; no rompe el sistema de blob URLs de `index.html`.
- **Seguridad de hooks de React**: `VIEW_PARAM` es una constante de módulo que nunca cambia entre renders; el early return antes de los hooks de `PaniniAlbum2026` es seguro porque la cantidad de hooks llamados es siempre consistente por instancia.
- **Orden de equipos en la vista**: `grouped` respeta el array `teams` como fuente de orden, lo que mantiene coherencia visual con el álbum.

#### Lo que no se modificó

- Lógica de `toggleSticker`, conteos, ni persistencia del álbum principal.
- Layout de escritorio y móvil del álbum.
- `playerNames.js`, `teamThemes.js`, `firebase.js`.

---

### 3.6 Silueta decorativa en figuritas de jugador

**Motivación:** mejorar la percepción visual de las figuritas de jugador vacías o completadas, añadiendo una silueta tipo carnet/ID que refuerza el estado de colección sin interferir con la legibilidad del texto.

#### Cambios realizados — solo en el componente `Sticker` de `panini_virtual_album_2026_app.jsx`

| Elemento | Detalle |
|---|---|
| `isPlayerSticker` | Booleano local: `sticker.type === 'player'` + exclusión explícita de códigos `FWC*`, `CC*` y `PANINI`. Necesario porque esos tipos especiales usan el valor por defecto `'player'` para `type` y habrían mostrado la silueta incorrectamente. |
| `silhouetteColor` | Color hexadecimal del SVG según estado: `#e2e8f0` (slate-200, vacía) / `#bbf7d0` (green-200, pegada) / `#94a3b8` (slate-400, repetida). |
| SVG inline | `viewBox="0 0 100 120"` con un `<circle cx="50" cy="35" r="22">` (cabeza) y un `<path>` de curvas cúbicas (hombros/busto). Posición absoluta centrada en el tercio superior de la tarjeta (`top: 6%`, `left: 20%`, `width: 60%`). Opacidad `0.45`. `pointerEvents: none`. `aria-hidden="true"`. |
| `relative` en `<button>` | Se agregó la clase `relative` al botón para que el SVG posicionado absolutamente quede contenido dentro de la tarjeta. |

#### Comportamiento

- La silueta aparece **solo** en figuritas de tipo `player` de selecciones nacionales (ej. `ARG2`, `MEX5`).
- No aparece en: escudos (`type === 'shield'`), fotos de equipo (`type === 'team'`), ni en figuritas especiales FWC, FWCH, COCA.
- El color de la silueta acompaña el estado de la figurita: gris claro (sin pegar), verde claro (pegada), gris medio (repetida).
- El SVG es un elemento decorativo de fondo; no afecta clicks ni legibilidad del código/nombre.

#### Lo que no se modificó

- Ninguna lógica de negocio (`toggleSticker`, conteos, persistencia).
- Tamaños, proporciones (`aspect-[2/3]`, `aspect-[3/2]`) ni bordes de las tarjetas.
- Layout de escritorio y móvil.
- Archivos `playerNames.js`, `teamThemes.js`, `firebase.js`, `index.html`.

---

### 3.3 Estado de las mejoras registradas en `TASKS_REFACTOR.md`
1. ✅ **Total de stickers oficiales** — Se definió `TOTAL_STICKERS = 981`. La constante se usa en `completionPercent`, `remainingCount` y en la UI. Los stickers de Coca-Cola (CC1–CC14) se excluyen del conteo aunque sean seleccionables.
2. ✅ **Correcciones tipográficas “Poster” → “Póster”** — Resuelto. Todos los labels usan “Póster” con acento: “Póster”, “Póster Canadá”, “Póster México”, “Póster USA”. No quedan ocurrencias sin acento.
3. ✅ **Unificación de fuente de verdad de equipos** — Resuelto. Se eliminó `completeTeamData` y el bloque `Object.assign`. Existe un único objeto `teamData` como fuente de verdad.
4. Extracción de lógica de generación de stickers y cobertura de pruebas automatizadas — pendiente.

---

## 4) Cuestiones técnicas generales

### 4.1 Patrón de ejecución actual (sin build step)
La app transpila JSX y resuelve imports en el navegador. Beneficios:
- Setup mínimo.
- Fácil de abrir y correr.

Costos:
- Mayor tiempo de arranque.
- Dependencia de múltiples CDNs en runtime.
- Menor trazabilidad de errores y optimización comparado con toolchain moderno.

### 4.2 Persistencia híbrida
La app prioriza Firestore y luego fallback a `localStorage`.
- Ventaja: resiliencia si no hay backend configurado.
- Riesgo: divergencia entre estado local y remoto si se agregan flujos multiusuario más adelante.

### 4.5 Fix de Firebase: singleton de `@firebase/app`
Al usar `esm.sh` para cargar `firebase/app` y `firebase/firestore` como módulos separados desde blob URLs, el navegador terminaba creando **dos instancias distintas** de `@firebase/app`: una para el registro del `initializeApp` y otra para el registro interno de Firestore. Esto producía el error `Service firestore is not available` porque el servicio Firestore se registraba en un contexto y se buscaba en el otro.

**Solución aplicada:** se reemplazaron las URLs de `esm.sh` por la CDN oficial de Firebase (`www.gstatic.com/firebasejs/10.12.2/`). Los archivos `firebase-app.js` y `firebase-firestore.js` publicados por Google están construidos de forma que `firebase-firestore.js` importa `firebase-app.js` usando la **misma URL absoluta de gstatic**, lo que garantiza deduplicación por la caché de módulos del navegador y un singleton compartido.

Adicionalmente se consolidaron todos los imports de Firestore en `firebase.js` (que re-exporta `doc`, `getDoc`, `setDoc`) para que la app no importe `firebase/firestore` en dos puntos distintos del grafo de módulos.

### 4.6 Patrón de routing ligero sin router
La app no usa React Router ni ninguna librería de routing. Las rutas alternativas se implementan con una constante de módulo que lee `window.location.search` al cargar:

```javascript
const VIEW_PARAM = new URLSearchParams(window.location.search).get('view');
```

El componente raíz evalúa esta constante en su primera línea y hace early return al componente correspondiente. Al ser una constante que nunca cambia entre renders, no viola las reglas de hooks de React.

Este patrón es adecuado para casos de uso simples (una o dos rutas estáticas). Si la app creciera en rutas o necesitara navegación con historial, sería conveniente incorporar React Router o similar.

### 4.3 Modelado de datos de equipos
La fuente de verdad única de equipos es el objeto `teamData` en `panini_virtual_album_2026_app.jsx`.
- La anterior duplicidad entre `teamData` y `completeTeamData` fue eliminada; ya no existe `Object.assign` para mezclar estructuras.
- Cada entrada de `teamData` contiene `name`, `federation` y `flag`; las secciones especiales (`FWCI1`, `FWCI2`, `FWCH1`, `FWCH2`, `COCA`) también están presentes en ese mismo objeto.

### 4.4 Calidad y mantenibilidad
Dado el tamaño de reglas condicionales y datasets:
- Conviene extraer funciones puras para reglas de negocio (conteos, tipos de sticker, progreso).
- Conviene agregar tests unitarios parametrizados para prevenir regresiones.
- Conviene mantener separación estricta entre:
  - Lógica de presentación,
  - Lógica de dominio,
  - Datos estáticos.

---

## 5) Recomendaciones de evolución técnica (sin ejecutar cambios)

1. **Introducir pipeline de build** (por ejemplo, Vite) para:
   - transpilar offline,
   - optimizar bundles,
   - mejorar DX y debugging.

2. **Refactor de dominio**:
   - mover reglas de stickers y progreso a módulos puros,
   - mantener componente React más declarativo.

3. **Pruebas automáticas**:
   - unit tests sobre reglas de conteo y completitud,
   - smoke tests de render básico.

4. **Documentación viva**:
   - mantener este documento junto al plan de refactor,
   - registrar cambios técnicos por iteración con fecha y alcance.

---

## 6) Alcance y garantías de esta entrega
- Esta entrega fue **100% documental**.
- No se alteraron reglas funcionales ni datos del álbum.
- El objetivo fue dejar trazabilidad técnica clara para futuros cambios de implementación.

---

## 7) Migración a configuración externa (`albumConfig_2026.js`)

### 7.1 Motivación
El álbum 2026 fue el primero del proyecto y tenía **todos los datos hardcodeados** dentro de `panini_virtual_album_2026_app.jsx` (identidad, conteos, catálogo de equipos, grupos, secciones especiales, navegación entre proyectos y colores inline). El álbum 2022 ya estaba refactorizado con un archivo de configuración externo (`albumConfig_2022.js`) que parametriza todo. Esta iteración migra el 2026 a **ese mismo patrón**: un único archivo de configuración como fuente de verdad, fácil de mantener y documentado.

**Es una refactorización pura.** Ningún comportamiento ni aspecto visual cambió: mismos conteos (981), mismo `id` (`paniniWorldCup2026`), mismos colores, misma persistencia, mismas vistas. Solo cambió *dónde viven* los datos.

### 7.2 Archivo creado: `albumConfig_2026.js`
Se extrajo a este archivo nuevo **todo** lo que estaba hardcodeado en el JSX. Exporta un objeto `albumConfig` con estos bloques:

| Bloque | Contenido | De dónde salió en el JSX |
|---|---|---|
| **Identidad / almacenamiento** | `id`, `owner`, `title`, `subtitle`, `exportFileName`, `localStorageKey`, `localStorageDarkKey` | `ALBUM_ID`, `ALBUM_OWNER`, `LOCAL_STORAGE_KEY`, `LOCAL_STORAGE_DARK_KEY`, título/subtítulo del header, nombre del backup |
| **Conteos** | `totalStickers` (981), `teamStickerCount` (20), `counts` (`team`, `fwci`, `fwch`, `coca`) | `TOTAL_STICKERS`, `STICKERS_TEAM`, `STICKERS_FWCI`, `STICKERS_FWCH`, `STICKERS_COCA` |
| **`teams`** | Orden de navegación completo (52 entradas: `FWCI1`, 48 selecciones, `FWCH1`, `FWCH2`, `COCA`) | `teams` |
| **`teamData`** | Nombres, federaciones y banderas (53 entradas: 48 selecciones + `FWCI1`, `FWCI2`, `FWCH1`, `FWCH2`, `COCA`) | `teamData` |
| **`teamGroups`** | Pertenencia a grupo y miembros mostrados en la mini-tabla de cada selección (48) | `teamGroups` |
| **`groups`** | Los 12 grupos A–L con su color y selecciones | `groups` |
| **`indexTeamIcons`** | Iconos del índice para secciones especiales | `indexTeamIcons` |
| **`specialSections`** | Estructura real de Intro e Historia (ver 7.4) | `fwciDefs`, `historyPageItems`, `historySelectable` |
| **`proyectos`** | Lista "Otros Proyectos" (ver Sección 8) | `PROYECTOS` |
| **`palette`** | Todos los colores antes inline en el JSX (ver 7.5) | colores `#...` repartidos por el JSX |

### 7.3 Cambios en `panini_virtual_album_2026_app.jsx`
- Se agregó el import: `import { albumConfig } from './albumConfig_2026';`
- Las constantes de módulo (`ALBUM_ID`, `LOCAL_STORAGE_KEY`, `LOCAL_STORAGE_DARK_KEY`, `PROYECTOS`, `ALBUM_OWNER`, `STICKERS_*`, `TOTAL_STICKERS`, `teams`, `teamData`, `teamGroups`, `groups`, `indexTeamIcons`) **conservan su mismo nombre local**, pero ahora se **asignan desde `albumConfig`** en lugar de declararse con literales. Así, todo el cuerpo del componente (lógica de `toggleSticker`, conteos, exportar/importar, QR, persistencia) quedó **intacto**: solo cambió la fuente de los datos.
- Se agregó el alias de módulo `const PAL = albumConfig.palette;` y se reemplazaron los colores inline por referencias a `PAL.*`. Las clases Tailwind de valor arbitrario (`bg-[#...]`) se reconstruyen con template literals (`` `bg-[${PAL.bgMain}]` ``), produciendo **exactamente la misma cadena de clase** que antes (el Play CDN de Tailwind las detecta igual vía su `MutationObserver`).
- El contenido de las secciones especiales (`fwciDefs`, `historyPageItems`, `historySelectable`) ahora se lee de `albumConfig.specialSections`.
- `handleExport` usa `albumConfig.exportFileName`; el header usa `albumConfig.title` / `albumConfig.subtitle`.

### 7.4 Modelado de secciones especiales (Intro e Historia partidas en dos páginas)
**Atención:** a diferencia del 2022 (Intro e Historia como sección única), el 2026 las tiene **partidas en dos páginas cada una**. Esto se modeló fielmente para no alterar el render:

- **Intro** → `FWCI1` / `FWCI2` (códigos `00`, `FWC1..FWC8`). En el recorrido (`teams`) solo aparece `FWCI1`, que renderiza la intro en una sola página con dos paneles, igual que el JSX original. `FWCI2` existe en `teamData` (para el índice) pero no se recorre por separado. `specialSections.FWCI1.items` contiene la definición exacta de los 9 stickers de la intro.
- **Historia** → `FWCH1` / `FWCH2` (códigos `FWC9..FWC20`). Cada página tiene su `pageItems` (grilla completa: stickers + casillas impresas) y su `selectable` (solo los stickers seleccionables).

La prioridad fue **no cambiar el render**, no que el config sea idéntico al del 2022.

### 7.5 Centralización de la paleta (`palette`)
Todos los colores que estaban inline en el JSX se mapearon con nombres semánticos. **Los valores son idénticos a los originales** — es solo centralización, el resultado visual no cambia. Algunos ejemplos:

| Nombre semántico | Valor | Uso |
|---|---|---|
| `bgMain` | `#880E4F` | Fondo principal (modo claro) |
| `bgDark` | `#0f0f1a` | Fondo principal (modo oscuro) |
| `surfaceDark` | `#1a1a2e` | Header, panel intro, navs móviles |
| `surfaceCardDark` | `#1e1e30` | Tarjetas / panel interno (oscuro) |
| `borderDark` | `#2a2a4a` | Bordes, barra de progreso, paneles |
| `historyBg` | `#0d2167` | Fondo de páginas de Historia (FWCH) |
| `cocaBg` | `#e41f1f` | Fondo de la sección Coca-Cola |
| `groupsRadial` | `radial-gradient(…)` | Fondo de la vista Grupos |
| `paniniFoilGradient` | `linear-gradient(…)` | Efecto metalizado del sticker PANINI |
| `confettiAlbum` / `confettiCoca` / `confettiDefault` | arrays | Colores de confeti de celebraciones |
| `projectStyles` | objeto | Estilos de los botones de "Otros Proyectos" |

**Colores que se dejaron como están (intencionalmente):**
- La tabla `TAILWIND_HEX` (líneas ~67–73): es un **decodificador interno** Tailwind→hex usado para derivar los colores de confeti por equipo, no parte de la "estética inline".
- Clases Tailwind con nombre (`text-pink-800`, `text-pink-400`, `bg-slate-200`, etc.): ya son tokens centralizados de Tailwind; convertirlas a hex las alteraría.
- Blanco/negro genéricos (`#ffffff`, `#1a1a1a`) del texto de las letras de grupo y un par de fallbacks defensivos (`#475569`, nunca alcanzados porque todos los grupos tienen color).

### 7.6 Cambios en `index.html`
Se agregó `albumConfig_2026.js` al pipeline de carga/transpilación, igual que los demás módulos locales:
- Se hace `fetch('./albumConfig_2026.js')` y se genera su blob URL.
- Se agregó la regla de reescritura del import: `from './albumConfig_2026'` → blob URL.
- **No se cambió** la estrategia de carga de Firebase desde `gstatic.com` (la que evita el error `Service firestore is not available`).

### 7.7 Nota: cuarto proyecto agregado a "Otros Proyectos"
Como parte de esta migración, `proyectos` quedó con las **cuatro** entradas vigentes del estándar del proyecto: **Mundial 2026, Qatar 2022, CWC 2025 y Rusia 2018**. El JSX anterior solo listaba tres (faltaba 2018). Se agregó la entrada `paniniRussia2018` (`style: 'russia'`) y su tratamiento visual correspondiente en el bloque de estilos del componente (`backgroundColor: '#0E4CAC'`, texto blanco, sin borde especial), según el estándar descripto en la Sección 8.

### 7.8 Cómo verificar que nada se rompió
1. **Persistencia:** `albumConfig.id` sigue siendo `paniniWorldCup2026` → las claves de Firestore (`albumProgress/paniniWorldCup2026`, `albumSettings/paniniWorldCup2026`) y de localStorage (`paniniWorldCup2026_stickers`, `paniniWorldCup2026_darkMode`) no cambian. El progreso existente se carga igual.
2. **Conteos:** `totalStickers` = 981; Coca-Cola (CC1–CC14) sigue excluida de `completedCount`/`completionPercent`/`remainingCount`.
3. **Render:** abrir `index.html`, recorrer las 48 selecciones, los 12 grupos y las secciones especiales (FWCI1, FWCH1, FWCH2, COCA). Verificar que el índice muestra FWCI1/FWCH1/FWCH2/COCA y que FWCI2 no se recorre por separado (igual que antes).
4. **Funciones:** brillantes (68), estadísticas, buscador, exportar/importar JSON y QR de repetidas funcionan igual.
5. **Estética:** ningún color cambió de valor — el resultado visual es idéntico.
6. **Consola:** la app carga sin errores (incluido el de Firestore, gracias a la carga desde `gstatic.com`).
7. **Transpilación:** `albumConfig_2026.js` pasa `node --check`; el JSX transpila sin errores con `@babel/preset-react`.

---

## Sección 8: Cómo agregar un nuevo álbum a la vista "Otros Proyectos"

Cada álbum tiene un menú de navegación entre proyectos que lista los demás álbumes disponibles. Cada vez que se crea un nuevo álbum, este procedimiento debe aplicarse en todos los repositorios existentes.

**Estructura del array `PROYECTOS`**

El array vive en el JSX principal (`panini_virtual_album_*_app.jsx`):

```js
const PROYECTOS = [
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
];
```

**Reglas de visibilidad y estilos**

- El álbum actual se detecta comparando `proyecto.id` con `albumConfig.id` — el proyecto actual no se muestra en la lista (no tendría sentido navegar al álbum que ya estás viendo).
- Los botones navegan en la misma pestaña: `onClick={() => { window.location.href = proyecto.url; }}`

Cada estilo tiene su tratamiento visual definido en el JSX:

| style | Estilos aplicados |
|---|---|
| `multicolor` | `background: linear-gradient(135deg, #e53e3e, #dd6b20, #d69e2e, #38a169, #3182ce, #805ad5)`, texto blanco |
| `qatar` | `backgroundColor: '#6B0F1A'`, `border: '2px solid #B8860B'`, texto blanco |
| `cwc` | `backgroundColor: '#000000'`, `border: '2px solid #B8860B'`, texto dorado (`text-yellow-400`) |
| `russia` | `backgroundColor: '#0E4CAC'`, texto blanco, sin borde especial |

Al agregar un nuevo álbum, definir un nuevo valor de `style` con su tratamiento visual representativo del torneo y agregarlo al bloque de estilos del componente.

**Pasos para agregar un nuevo álbum**

1. Agregar una nueva entrada al array `PROYECTOS` en el JSX de cada repositorio existente.
2. Definir el estilo visual del nuevo álbum y agregarlo al bloque condicional de estilos del componente.
3. El nuevo repositorio ya trae el array `PROYECTOS` actualizado desde su creación (fue clonado con la versión más reciente).
4. Crear un pull request en cada repositorio con título `feat: agregar [nombre álbum] a otros proyectos`.

**Prompt para Claude Code**

Usar este prompt exacto en Claude Code cada vez que se agrega un nuevo álbum al menú "Otros Proyectos":

```
En la vista otros-proyectos del archivo _app.jsx de cada repositorio existente, agregar una nueva entrada al array PROYECTOS:
{
  id: '[id del nuevo álbum]',
  label: '[nombre visible del álbum]',
  url: '[url de GitHub Pages]',
  style: '[nombre del estilo]',
}
Definir también el estilo visual del nuevo álbum en el bloque de estilos del componente. Cada álbum tiene su propio estilo visual representativo:
    Mundial 2026: background: linear-gradient(135deg, #e53e3e, #dd6b20, #d69e2e, #38a169, #3182ce, #805ad5), texto blanco
    Qatar 2022: backgroundColor: '#6B0F1A', border: '2px solid #B8860B', texto blanco
    CWC 2025: backgroundColor: '#000000', border: '2px solid #B8860B', texto dorado (text-yellow-400)
    Rusia 2018: backgroundColor: '#0E4CAC', texto blanco — sin borde especial
Los botones navegan en la misma pestaña: onClick={() => { window.location.href = proyecto.url; }}. El álbum actual se excluye automáticamente comparando proyecto.id con albumConfig.id. Aplicar este cambio en todos los repositorios existentes y crear un pull request en cada uno con título feat: agregar [nombre álbum] a otros proyectos.
```

> **Nota de implementación (2026):** en este repositorio, tras la migración a `albumConfig_2026.js` (ver Sección 7), el array `PROYECTOS` se alimenta de `albumConfig.proyectos` y el bloque de estilos del componente ya incluye la rama `russia`. Agregar un nuevo álbum acá implica editar `albumConfig_2026.js` (array `proyectos`) y, si el torneo trae un estilo nuevo, sumar su rama en el bloque condicional de estilos del componente.
