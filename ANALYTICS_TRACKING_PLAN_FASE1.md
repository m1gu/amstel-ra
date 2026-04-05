# Fase 1 - Tracking Plan y Definicion de KPIs

## 1) Objetivo de la fase
Definir de forma cerrada que metricas se van a medir, como se van a calcular, con que eventos se alimentan y como se van a visualizar en el dashboard.

Esta fase no implementa aun instrumentacion completa ni graficos finales. Esta fase deja aprobada la especificacion funcional y tecnica.

---

## 2) Alcance
Canales incluidos:
1. Sitio web publico `/vasodelahistoria`.
2. App `/webar`.
3. Dashboard admin `/admin` con filtros por fecha y graficos.

Fuera de alcance de Fase 1:
1. Cambios de infraestructura.
2. ETL avanzado.
3. Modelo predictivo.

---

## 3) Estado actual (baseline)
1. El dashboard actual usa datos mock (hardcoded).
2. Existen tablas `sessions` y `events` en base de datos.
3. Existen endpoints para tracking base (`/api/sessions/start` y `/api/events`) pero hoy no hay instrumentacion activa en frontend ni en webar.
4. No hay endpoints de agregacion para dashboard ni filtros de fecha implementados.

---

## 4) KPIs propuestos

### 4.1 KPIs sitio web (`/vasodelahistoria`)
1. Sesiones totales.
2. Usuarios unicos estimados (por `session_uuid`).
3. Duracion promedio de sesion.
4. Tasa de rebote.
5. Paginas mas visitadas.
6. Reproducciones de videos (totales).
7. Reproducciones por video.
8. Tasa de finalizacion de video (% completos / iniciados).
9. CTR de CTAs.
10. Busquedas de locales (store search).
11. Distribucion por dispositivo.
12. Distribucion por sistema operativo.
13. Distribucion por browser.
14. Distribucion geografica (pais, ciudad).

### 4.2 KPIs WebAR (`/webar`)
1. Sesiones WebAR.
2. Inicios AR (`ar_start`).
3. Total de escaneos (`target_detected`).
4. Escaneos por estadio.
5. Tasa de perdida de target (`target_lost` / `target_detected`).
6. Reproducciones de video en AR (totales).
7. Reproducciones por video AR.
8. Tiempo de actividad AR por sesion.
9. CTA clicks dentro de AR.
10. Errores por dispositivo/browser.

### 4.3 KPIs recomendados adicionales
1. `time_to_first_action`: tiempo desde session start hasta primera interaccion.
2. `scan_to_play_rate`: porcentaje de escaneos que llegan a reproduccion.
3. `return_rate`: sesiones recurrentes en ventana de 7 y 30 dias.
4. `drop_off_step`: en que paso se cae el usuario (scan -> detect -> play -> complete).
5. `top_failed_devices`: combinaciones device/os/browser con mas errores.

---

## 5) Catalogo de eventos (tracking plan)

### 5.1 Eventos Web
1. `session_start`: al cargar experiencia.
2. `page_view`: cada ruta principal.
3. `age_gate_pass`: usuario valido.
4. `age_gate_fail`: usuario no valido.
5. `tournament_video_play`: click en video de galeria.
6. `video_started`: cuando el video realmente inicia.
7. `video_completed`: cuando termina reproduccion.
8. `cta_click`: click en botones de accion.
9. `store_search`: busqueda de locales por ciudad.
10. `error`: errores funcionales capturados.

### 5.2 Eventos WebAR
1. `session_start` (source=`webar`).
2. `ar_start`: inicializacion AR ok.
3. `target_detected`: target encontrado.
4. `target_lost`: target perdido.
5. `animation_started`.
6. `animation_completed`.
7. `video_started`.
8. `video_completed`.
9. `cta_click`.
10. `error`.

### 5.3 Metadata minima por evento
Campos comunes:
1. `session_uuid`
2. `source` (`web` | `webar`)
3. `path`
4. `event_type`
5. `timestamp_client`
6. `metadata` JSON

Metadata recomendada en `metadata`:
1. `page_name`
2. `stadium_id` / `stadium_slug`
3. `target_index`
4. `video_id`
5. `video_title`
6. `tournament_year`
7. `phase`
8. `cta_id` / `cta_label`
9. `duration_ms`
10. `error_code` / `error_message`

---

## 6) Dimensiones y filtros del dashboard

Filtros globales obligatorios:
1. Rango de fechas (`date_from`, `date_to`).
2. Canal (`web`, `webar`, ambos).
3. Estadio.
4. Video.
5. Pais.
6. Ciudad.
7. Dispositivo.
8. Sistema operativo.
9. Browser.

Presets rapidos de fecha:
1. Hoy.
2. Ayer.
3. Ultimos 7 dias.
4. Ultimos 30 dias.
5. Mes actual.
6. Personalizado.

---

## 7) Graficos recomendados (utiles para analisis)

Bloque ejecutivo (arriba):
1. KPIs principales (8 tarjetas maximo).

Bloque tendencia:
1. Linea de sesiones por dia.
2. Linea de eventos clave por dia (video_started, cta_click, target_detected).

Bloque contenido:
1. Barras horizontales: top paginas.
2. Barras: top videos por reproduccion.
3. Barras: top videos por finalizacion.

Bloque WebAR:
1. Barras apiladas: escaneos por estadio por dia.
2. Funnel: `target_detected -> video_started -> video_completed`.

Bloque audiencia:
1. Donut: dispositivos.
2. Donut: browser.
3. Tabla: pais/ciudad con sesiones y engagement.

Bloque calidad:
1. Tabla de errores por device/os/browser.

---

## 8) Lineamientos UX/UI (corporativo, clean)
1. Header limpio con filtros globales siempre visibles.
2. Tarjetas KPI con icono, valor y variacion vs periodo anterior.
3. Maximo 2 colores de acento (marca) + neutrales.
4. Priorizar legibilidad: tipografia sobria, espaciado consistente.
5. Skeleton loading y empty states claros.
6. Responsive: desktop first, soporte tablet.

---

## 9) Reglas de calidad de datos
1. Todos los eventos deben tener `session_uuid`.
2. Eventos sin `source` se descartan o se normalizan.
3. Validar catalogo de `event_type`.
4. Deduplicar eventos identicos dentro de ventana corta (ej. 2s) para evitar doble click/duplicados.
5. Enmascarar o excluir PII no necesaria.
6. Definir timezone oficial de reporte (America/Guayaquil).

---

## 10) Entregables de Fase 1
1. Documento aprobado de KPIs y eventos (este plan).
2. Diccionario de datos (campos + definiciones).
3. Mock de dashboard (wireframe funcional) con bloques y filtros.
4. Checklist de aceptacion para pasar a Fase 2.

---

## 11) Criterios de aprobacion para cerrar Fase 1
1. KPI tiene formula clara y fuente de datos definida.
2. Cada grafico tiene objetivo de negocio.
3. Cada evento tiene trigger y metadata definida.
4. Filtros y presets de fecha aprobados.
5. Stakeholders aprueban version final del dashboard objetivo.

---

## 12) Siguiente paso (Fase 2)
Instrumentar eventos en:
1. Frontend `/vasodelahistoria`.
2. `/webar`.
3. Backend para recepcion consistente y validacion de eventos.
