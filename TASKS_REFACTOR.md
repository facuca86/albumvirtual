# Plan de mejora técnica (priorizado)

## 1) ✅ Corregir porcentaje global de avance — RESUELTO

- Se definió `TOTAL_STICKERS = 981` (1 Panini + 8 FWC Intro + 48×20 selecciones + 12 FWC Historia).
- Los stickers de Coca-Cola (CC1–CC14) son seleccionables pero **no cuentan** en el total oficial.
- `completedCount` excluye códigos `CC*`; `completionPercent` y `remainingCount` usan `TOTAL_STICKERS`.

---

## 2) ✅ Corregir textos con error ortográfico (tipográfico) — RESUELTO

### Problema
Se usaba "Poster" en labels en español donde debería ser "Póster".

### Solución implementada
- Todos los labels de UI fueron actualizados a "Póster" (con acento).
- Incluye: "Póster", "Póster Canadá", "Póster México", "Póster USA".
- No quedan ocurrencias de "Poster" sin acento en el código.

---

## 3) ✅ Aclarar fuente de verdad de datos de equipos — RESUELTO

### Problema
Había dos objetos (`teamData` y `completeTeamData`) con duplicados y sobrescritura posterior mediante `Object.assign`.

### Solución implementada
- Se consolidó todo en un único objeto `teamData`.
- Se eliminaron `completeTeamData` y el bloque `Object.assign`.
- La fuente de verdad única es `teamData`; no hay más ambigüedad de precedencia.

---

## 4) Mejorar cobertura de pruebas en generación de stickers
**Prioridad:** Alta

### Problema
La lógica condicional de generación de stickers es compleja y propensa a regresiones, sin pruebas automáticas visibles.

### Tarea
- Extraer la lógica de construcción de stickers (`buildStickers`) a función pura testeable.
- Agregar pruebas unitarias parametrizadas para:
  - Conteos por tipo de equipo (`FWCI`, `COCA`, normal).
  - Labels especiales en `FWCI2` y `FWCH`.
  - Tipo/horizontal para `id=1` y `id=13` en equipos normales.
  - Conteo de completados en `FWCI` por códigos `FWC1..FWC8`.

### Criterios de aceptación
- Las pruebas fallan ante regresiones en reglas de generación.
- Cobertura mínima de la función extraída: 90%+ de ramas.
