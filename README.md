# Album Virtual Panini - FIFA World Cup 2026

Aplicación web para gestionar tu colección de figuritas del Mundial FIFA 2026. Controla cuáles tienes, cuáles te faltan y cuáles están repetidas, todo desde el navegador sin necesidad de instalar nada.

---

## Demo

La app corre directamente abriendo `index.html` en cualquier navegador moderno. No requiere bundler ni servidor de desarrollo.

---

## Características

### Colección completa de 981 figuritas

El álbum cubre la colección oficial Panini FIFA World Cup 2026:

| Sección | Figuritas |
|---|---|
| Intro Panini (FWCI1, FWCI2) | 9 |
| Historia del Mundial (FWCH1, FWCH2) | 12 |
| 48 selecciones × 20 figuritas | 960 |
| **Total oficial** | **981** |

> Las figuritas de Coca-Cola (CC1–CC14) están disponibles en la app pero no se cuentan en el total oficial.

### Estados de figurita

Cada figurita puede estar en uno de tres estados. Para cambiar el estado haz clic sobre la figurita:

```
Sin pegar → Pegada → Repetida → Sin pegar → ...
```

- **Sin pegar** — Fondo blanco, todavía la necesitas.
- **Pegada** — Borde verde, ya está en tu álbum.
- **Repetida** — Tono gris, la tienes de más para intercambiar.

### Figuritas brillantes

Las figuritas de escudo de cada selección (posición 1 de cada equipo) y las figuritas de introducción del mundial son consideradas **figuritas brillantes** (68 en total). Las estadísticas te muestran cuántas llevas de este tipo especial.

### Estadísticas

El panel de estadísticas muestra de un vistazo:

- Total de figuritas pegadas vs. total del álbum.
- Porcentaje de completitud.
- Cuántas figuritas te faltan para completar el álbum.
- Cantidad de figuritas brillantes conseguidas.
- Cantidad de figuritas repetidas disponibles para intercambio.

También hay una vista detallada por equipo (`Ver selecciones`) que desglosa el progreso de cada sección del álbum.

### Figuritas repetidas y compartir por QR

La app genera automáticamente una URL pública con todas tus figuritas repetidas (`?view=repetidas`). Desde el botón **Compartir repetidas** puedes:

- Ver el listado completo de tus repetidas agrupado por equipo.
- Generar un **código QR** para que otros coleccionistas escaneen y vean qué figuritas puedes intercambiar.

### Exportar e importar progreso

Tu colección se puede respaldar en un archivo JSON y restaurar en cualquier momento:

- **Exportar**: descarga `panini2026_backup.json` con el estado actual.
- **Importar**: carga un archivo de respaldo para restaurar tu progreso.

Esto te permite mover tu colección entre dispositivos o compartirla.

---

## Tecnologías

| Tecnología | Uso |
|---|---|
| React 18 | UI declarativa |
| Tailwind CSS 3 | Estilos responsive |
| Babel Standalone | Transpilación JSX en el navegador |
| Firebase Firestore | Persistencia en la nube |
| localStorage | Fallback offline |
| qrcodejs | Generación de códigos QR |

**Sin bundler**: todo se carga desde CDN. Abre `index.html` y listo.

---

## Estructura del proyecto

```
albumvirtual/
├── index.html                          # Punto de entrada (carga CDNs y transpila JSX)
├── panini_virtual_album_2026_app.jsx   # Componente principal de React
├── playerNames.js                      # Base de datos con nombres de jugadores
├── teamThemes.js                       # Colores y degradados por selección
└── firebase.js                         # Configuración de Firebase Firestore
```

---

## Persistencia de datos

La app usa una estrategia híbrida:

1. Al cargar, intenta leer el progreso desde **Firebase Firestore**.
2. Si Firestore no está disponible, usa **localStorage** como fallback.
3. Al marcar/desmarcar figuritas, guarda en ambos sitios simultáneamente.

Esto garantiza que el progreso no se pierde aunque no haya conexión.

---

## Selecciones incluidas

Las 48 selecciones del FIFA World Cup 2026, organizadas por confederación:

**CONMEBOL:** Argentina, Bolivia, Brasil, Chile, Colombia, Ecuador, Paraguay, Perú, Uruguay, Venezuela  
**UEFA:** Alemania, Bélgica, Croacia, Dinamarca, España, Francia, Inglaterra, Países Bajos, Polonia, Portugal, Serbia, Suiza, entre otras  
**CONCACAF:** Canadá, Costa Rica, Estados Unidos, Jamaica, México, Panamá  
**CAF:** Camerún, Egipto, Marruecos, Nigeria, Senegal, entre otras  
**AFC:** Arabia Saudita, Australia, Japón, Corea del Sur, entre otras  
**OFC:** Nueva Zelanda  

Cada selección tiene 20 figuritas: escudo, foto de equipo y 18 jugadores.

---

## Uso

1. Abre `index.html` en tu navegador.
2. Selecciona una selección desde el índice o navega con los botones anterior/siguiente.
3. Haz clic en cada figurita para marcarla como **pegada** o **repetida**.
4. Consulta tus estadísticas con el botón **Estadísticas**.
5. Comparte tus repetidas escaneando el código QR generado.
6. Exporta tu progreso periódicamente como respaldo.

---

## Convención de códigos de figuritas

| Código | Descripción |
|---|---|
| `PANINI` | Figurita logo Panini |
| `FWC1`–`FWC8` | Intro del mundial (logos, balón, pósters) |
| `FWC9`–`FWC20` | Historia (campeones mundiales) |
| `ARG1`–`ARG20` | Selección Argentina |
| `MEX1`–`MEX20` | Selección México |
| `CC1`–`CC14` | Promoción Coca-Cola (no oficial) |

El patrón general es `[CÓDIGO_EQUIPO][NÚMERO]`, donde el código del equipo es el código ISO de 2-3 letras de cada país.
