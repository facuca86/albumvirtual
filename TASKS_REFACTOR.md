# Plan de mejora técnica (priorizado)

## 1) Corregir porcentaje global de avance (falla funcional)
**Prioridad:** Alta

### Problema
El porcentaje de avance usa un denominador fijo (`982`). Si cambia el arreglo de equipos o las reglas de conteo, el porcentaje será incorrecto.

### Tarea
- Reemplazar el valor fijo por un cálculo dinámico del total de stickers según reglas actuales:
  - `FWCI*` => 8 stickers
  - `COCA` => 14 stickers
  - resto => 20 stickers
- Extraer el cálculo a una función pura reutilizable.

### Criterios de aceptación
- El porcentaje se calcula contra el total dinámico.
- Al agregar/quitar equipos o modificar reglas, no se requieren cambios manuales al denominador.

---

## 2) Corregir textos con error ortográfico (tipográfico)
**Prioridad:** Media

### Problema
Se usa "Poster" en labels en español donde debería ser "Póster".

### Tarea
- Actualizar todos los labels de UI para usar "Póster".
- Revisar consistencia de acentuación en todos los textos visibles.

### Criterios de aceptación
- No existen ocurrencias de "Poster" en textos de UI.
- Se mantiene consistencia ortográfica en español.

---

## 3) Aclarar fuente de verdad de datos de equipos (discrepancia de documentación/comentarios)
**Prioridad:** Media

### Problema
Hay dos objetos (`teamData` y `completeTeamData`) con duplicados y sobrescritura posterior (`Object.assign`), sin comentario que explique intención o precedencia.

### Tarea
- Documentar explícitamente la estrategia de datos y precedencia, o unificar ambos objetos en una sola estructura.
- Agregar comentario técnico breve al bloque si se conserva la sobrescritura.

### Criterios de aceptación
- Queda claro cuál estructura es fuente de verdad.
- Un nuevo colaborador puede entender el flujo de datos sin inferencias implícitas.

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
