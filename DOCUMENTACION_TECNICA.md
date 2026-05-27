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
- Carga Tailwind por CDN y Babel Standalone por CDN.
- Hace `fetch` de los archivos fuente (`firebase.js`, `playerNames.js`, `teamThemes.js`, `panini_virtual_album_2026_app.jsx`).
- Reescribe imports para apuntar a módulos remotos (`react`, `react-dom`, `firebase`) y a blobs locales generados dinámicamente.
- Transpila JSX en runtime y monta la app en `#root`.

**Implicación técnica:** estrategia útil para prototipo/demo rápido, pero menos eficiente y menos robusta que un pipeline de build (Vite/Webpack) para producción.

### `panini_virtual_album_2026_app.jsx`
- Componente principal (`PaniniAlbum2026`).
- Contiene:
  - Catálogo de equipos/secciones.
  - Metadatos de equipos (`teamData` y `completeTeamData`).
  - Lógica de estilos por selección (`teamThemes`).
  - Cálculo de stickers por sección/equipo.
  - Carga/guardado de progreso con `getDoc`/`setDoc` + fallback local.
  - Exportación del progreso como archivo JSON descargable.
  - Importación de progreso desde un archivo JSON con validación y persistencia inmediata.
  - Estados de navegación y visualización.
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
