# Práctica 6 — FitSync (sincronización de actividad física smartwatch ↔ móvil)

Proyecto autónomo con dos apps Android que intercambian **registros de actividad física simulados** por el **Wearable Data Layer** (`MessageClient` de `com.google.android.gms:play-services-wearable:20.0.1`). El smartwatch genera y envía la medición; el teléfono la recibe, la valida, detecta duplicados y la guarda en un historial local.

## Estructura

```
practica6-fitsync/
├── settings.gradle.kts          # Incluye :phone-app y :watch-app
├── build.gradle.kts
├── gradle.properties
├── phone-app/                   # Nodo teléfono (Android nativo)
│   ├── build.gradle.kts
│   └── src/main/
│       ├── AndroidManifest.xml
│       ├── java/mx/labandera/fitsync/phone/
│       │   ├── MainActivity.kt          # recibe, valida, guarda
│       │   ├── HistoryActivity.kt       # pantalla de historial
│       │   └── model/
│       │       ├── ActivityRecord.kt    # modelo + validación
│       │       └── ActivityRepository.kt # persistencia (SharedPreferences + Gson)
│       └── res/
└── watch-app/                   # Nodo Wear OS
    ├── build.gradle.kts
    └── src/main/
        ├── AndroidManifest.xml
        ├── java/mx/labandera/fitsync/watch/
        │   ├── MainActivity.kt          # genera y envía el registro
        │   └── model/ActivityRecord.kt  # mismo modelo (copia espejo)
        └── res/
```

## Modelo de datos (Actividad 1)

`ActivityRecord` (JSON): `id` (UUID), `timestamp` (epoch ms), `heartRate` (bpm), `steps`, `durationSeconds`.

Reglas de validación (`ActivityRecord.validate`):

| Campo | Regla |
|---|---|
| `id` | no vacío |
| `timestamp` | fecha válida (no en el futuro más allá de 5 min, no antes de 01/01/2000) |
| `heartRate` | 30–220 bpm |
| `steps` | ≥ 0 |
| `durationSeconds` | ≥ 0 |

## Flujo de comunicación

```
Reloj (watch-app)                        Teléfono (phone-app)
─────────────────                        ──────────────────
Botón "Registrar actividad"
  └─ ActivityRecord.generateSimulated()  (id = UUID aleatorio)
  └─ Gson.toJson(record)
  └─ messageClient.sendMessage(peerId, "/activity", json)
        ───────────────────────────────►  addListener(listener, Uri("/activity"), FILTER_LITERAL)
                                            ├─ deserializa JSON
                                            ├─ valida (ActivityRecord.validate)
                                            ├─ detecta duplicado (repository.contains(id))
                                            ├─ guarda (ActivityRepository.save)
                                            └─ muestra resultado en pantalla
```

Ruta única: `/activity` (reloj → teléfono).

## Comportamiento de conectividad (Actividad 4)

- `NodeClient.getConnectedNodes()` devuelve los nodos vinculados; el reloj solo envía si existe un nodo `isNearby` (el teléfono emparejado y encendido).
- `MessageClient` de la capa de datos **encola los mensajes localmente** cuando el nodo destino no está disponible y los entrega al restablecerse el enlace; por eso el envío no requiere reintentos manuales, pero sí se verifica la conectividad antes de enviar para dar retroalimentación inmediata al usuario.
- El historial se persiste en `SharedPreferences` (clave `fitsync_records`) con Gson, de modo que sobrevive reinicios de la app.

## Pruebas (Actividad 5)

| # | Caso | Comportamiento esperado |
|---|---|---|
| 1 | Registro válido (botón "Registrar actividad") | El teléfono muestra `REGISTRADO: id… (HR … bpm, … pasos)` y lo suma al historial. |
| 2 | Duplicado (botón "Reenviar último") | Mismo `id`: el teléfono muestra `DUPLICADO: id… ya existe` y **no** lo guarda dos veces. |
| 3 | Registro inválido (botón "Enviar inválido", pasos = -50) | El teléfono muestra `INVÁLIDO: pasos negativos` y descarta el registro. |
| 4 | Reloj desconectado | `getConnectedNodes()` sin nodo cercano: el reloj muestra "Teléfono no conectado" y no envía. |
| 5 | Historial | "Ver historial" lista los registros válidos guardados (descendente por fecha). |

## Cómo ejecutar

1. Abrir `practica6-fitsync/` en Android Studio.
2. Instalar `phone-app` en un dispositivo/emulador Android (API 30+).
3. Instalar `watch-app` en el emulador de Wear OS vinculado (Wear OS 3+).
4. Con ambos nodos conectados, usar los botones del reloj.

## Conclusión

La integridad de los datos se garantiza en el extremo receptor: el teléfono deserializa, valida contra reglas de plausibilidad (frecuencia cardíaca 30–220 bpm, pasos y duración no negativos, fecha coherente) y rechaza duplicados por `id` antes de persistir. La sincronización es unidireccional (push): el reloj genera la medición y la envía por `/activity`; la capa de datos encola el mensaje si el enlace se interrumpe y lo entrega al reconectarse, por lo que no se pierde el registro mientras el teléfono permanece vinculado. El historial local (SharedPreferences + Gson) permite auditar qué registros se aceptaron y cuáles se descartaron.
