# Práctica 5 — WatchControl (comunicación bidireccional smartwatch ↔ móvil)

Proyecto autónomo con dos apps Android que se comunican por el **Wearable Data Layer** (`MessageClient` de `com.google.android.gms:play-services-wearable:20.0.1`). No modifica backend, frontend ni la `wear-app` del proyecto Labandera.

## Estructura

```
practica5-watchcontrol/
├── settings.gradle.kts          # Incluye :phone-app y :watch-app
├── build.gradle.kts
├── gradle.properties
├── phone-app/                   # Nodo teléfono (Android nativo)
│   ├── build.gradle.kts
│   └── src/main/
│       ├── AndroidManifest.xml
│       ├── java/mx/labandera/watchcontrol/phone/MainActivity.kt
│       └── res/                 # strings, temas, layout
└── watch-app/                   # Nodo Wear OS
    ├── build.gradle.kts
    └── src/main/
        ├── AndroidManifest.xml  # uses-feature watch + standalone
        ├── java/mx/labandera/watchcontrol/watch/MainActivity.kt
        └── res/                 # strings, temas, layout
```

## Cómo ejecutar

1. Abrir `practica5-watchcontrol/` en Android Studio.
2. Instalar `phone-app` en un dispositivo/emulador Android (API 30+).
3. Instalar `watch-app` en el emulador de Wear OS vinculado (Wear OS 3+).
4. Con ambos nodos conectados, usar los botones de la app del teléfono.

## Flujo de comunicación

```
Teléfono (phone-app)                    Reloj (watch-app)
─────────────────────                   ──────────────────
Botón "Iniciar"
  └─ Wearable.getMessageClient(this).sendMessage(nodeIdReloj, "/training", "START")
        ───────────────────────────────►  addListener(commandListener)
                                            ├─ valida comando vs. estado (IDLE/RUNNING/PAUSED)
                                            └─ sendMessage(sourceNodeId, "/training/ack", "OK: sesión iniciada")
  ◄───────────────────────────────────
  └─ addListener(ackListener, Uri("/training/ack"), FILTER_LITERAL)
      └─ muestra confirmación en pantalla
```

Rutas: `/training` (comando, teléfono → reloj) y `/training/ack` (confirmación, reloj → teléfono).

## Pruebas (Actividad 4)

| Caso | Comportamiento esperado |
|---|---|
| Comando válido (`START`/`PAUSE`/`STOP`) | El reloj cambia de estado y responde `OK: sesión iniciada / en pausa / terminada`; el teléfono muestra la confirmación. |
| Comando inválido (botón "Enviar comando inválido" → `JUMP`) | El reloj responde `RECHAZADO: comando desconocido 'JUMP'`. |
| Comando inválido por estado (p. ej. `PAUSE` sin sesión) | El reloj responde `RECHAZADO: no hay sesión en curso`. |
| Reloj desconectado | `getConnectedNodes()` vacío: el teléfono muestra "Sin reloj conectado" y no envía nada. |

## Conclusión

La comunicación bidireccional se logra con `MessageClient` en ambos extremos: el teléfono envía el comando por ruta y el reloj lo valida contra su estado local antes de responder. El reloj actúa como nodo que verifica el contexto (no acepta `PAUSE` si no hay sesión en curso), y el teléfono depende de la confirmación recibida para dar la operación por completada. Al fallar el enlace (reloj desconectado) o el comando, ambos lados muestran un error explícito, cumpliendo el requisito de manejo de errores.
