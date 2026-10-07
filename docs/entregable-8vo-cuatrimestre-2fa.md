# Primer entregable — 8.º Cuatrimestre

## Sistema de autenticación en dos pasos (2FA) con QR y smart watch

**Proyecto:** Labandera — sitio de noticias con API REST
**Entregable:** Implementación de funciones del cuatrimestre: autenticación de dos pasos
**Estado:** versión en desarrollo (no definitivo; puede diferir del estado actual del repositorio)

---

## 1. Resumen

El ingreso a Labandera se divide en **dos pasos**:

```mermaid
flowchart LR
    classDef paso fill:#eef2ff,stroke:#4f46e5,stroke-width:2px,color:#1e1b4b
    classDef disp fill:#f0fdf4,stroke:#16a34a,stroke-width:2px,color:#14532d
    classDef qr fill:#fefce8,stroke:#ca8a04,stroke-width:2px,color:#713f12

    U(("👤 Usuario")):::paso
    P1["🔑 Paso 1<br/>email + contraseña"]:::paso
    QR["📱 La web genera<br/>un código QR"]:::qr
    P2["⌚ Paso 2<br/>código de 6 dígitos<br/>del smart watch"]:::paso
    OK(["✅ Acceso concedido"]):::disp

    U --> P1 --> QR --> P2 --> OK
```

Con este diseño, poseer la contraseña ya no es suficiente: el atacante además
necesitaría el **dispositivo físico** del usuario (el smart watch) para
completar el ingreso.

---

## 2. Componentes del sistema

| Componente | Rol en el sistema |
|---|---|
| **Backend (API REST)** | Valida credenciales, genera el secreto TOTP y el QR, verifica el código del segundo paso y emite el token de sesión (JWT). |
| **Frontend (SPA)** | Pantalla de login (dos pasos) y página de seguridad donde se muestra el QR y se confirma el enlace. |
| **Smart watch** | Escanea el QR, guarda el secreto TOTP localmente y genera el código de 6 dígitos cada 30 s. |
| **Base de datos** | Almacena el secreto TOTP del usuario, los códigos de respaldo (hasheados) y la auditoría de intentos. |

```mermaid
flowchart TB
    classDef core fill:#eef2ff,stroke:#4f46e5,stroke-width:2px,color:#1e1b4b
    classDef dev fill:#f0fdf4,stroke:#16a34a,stroke-width:2px,color:#14532d
    classDef data fill:#fefce8,stroke:#ca8a04,stroke-width:2px,color:#713f12

    subgraph Usuarios
        U(("👤 Usuario")):::dev
        S(("⌚ Smart watch")):::dev
    end

    W["🌐 Frontend (SPA)<br/>login + página de seguridad"]:::core
    B["⚙️ Backend (API REST)<br/>validación + JWT"]:::core
    DB[("🗄️ Base de datos<br/>secreto, respaldos, auditoría")]:::data

    U <--> W
    S <--> W
    W <--> B
    B <--> DB
```

---

## 3. Método de enlace del smart watch a la cuenta

El smart watch **no se empareja por Bluetooth ni requiere instalación manual**:
se enlaza a la cuenta del usuario **escaneando el código QR** que la web
genera cuando el usuario activa el segundo factor.

El QR contiene una URI estándar `otpauth://` con el **secreto TOTP** del
usuario. Al escanearla, el reloj guarda ese secreto y a partir de ese momento
es "la app autenticadora" de esa cuenta.

### 3.1 Diagrama del proceso de enlace

```mermaid
sequenceDiagram
    actor U as 👤 Usuario
    participant W as 🌐 Web
    participant B as ⚙️ Backend
    participant DB as 🗄️ BD
    participant S as ⌚ Smart watch

    rect rgb(238, 242, 255)
        Note over U,W: Preparación del QR
        U->>W: Inicia sesión (email + contraseña)
        U->>W: En /security pulsa "Activar 2FA"
        W->>B: POST /api/auth/totp/setup
        B->>DB: Genera y guarda secreto TOTP (Base32)
        B-->>W: URI otpauth:// + secreto
        W-->>U: 📱 Muestra el código QR en pantalla
    end

    rect rgb(254, 252, 228)
        Note over U,S: Enlace del reloj
        U->>S: Apunta la cámara del reloj al QR
        S->>S: Escanea otpauth:// y guarda el secreto
        S-->>U: ⌚ Muestra el primer código de 6 dígitos
    end

    rect rgb(240, 253, 244)
        Note over U,W: Confirmación
        U->>W: Teclea el código del reloj
        W->>B: POST /api/auth/totp/verify-setup { code }
        B->>B: Valida el código (RFC 6238)
        B->>DB: totpEnabled = true + 10 respaldos (hasheados)
        B-->>W: 2FA activado + códigos de respaldo (una sola vez)
        W-->>U: ✅ "Tu smart watch quedó enlazado a tu cuenta"
    end
```

### 3.2 Pasos del usuario (enlazado)

```mermaid
flowchart LR
    classDef paso fill:#eef2ff,stroke:#4f46e5,stroke-width:1.5px,color:#1e1b4b
    classDef fin fill:#f0fdf4,stroke:#16a34a,stroke-width:2px,color:#14532d

    A["1. Inicia sesión<br/>en la web"]:::paso
    B["2. /security →<br/>Activar 2FA"]:::paso
    C["3. La web muestra<br/>el QR"]:::paso
    D["4. El reloj escanea<br/>el QR"]:::paso
    E["5. El reloj muestra<br/>código de 6 dígitos"]:::paso
    F["6. Teclea el código<br/>en la web"]:::paso
    G["7. Backend valida<br/>y activa el 2FA"]:::paso
    H(["8. ⌚ Reloj enlazado<br/>a la cuenta"]):::fin

    A --> B --> C --> D --> E --> F --> G --> H
```

> **Nota de diseño (estado actual):** el enlace se realiza escaneando el QR
> desde el navegador web. En una versión posterior se contempla que el propio
> smart watch haga la autenticación de la cuenta (login completo en el reloj)
> para que el usuario no necesite teclear nada.

---

## 4. Flujo de inicio de sesión en dos pasos

### 4.1 Diagrama de flujo

```mermaid
flowchart TD
    classDef ok fill:#f0fdf4,stroke:#16a34a,stroke-width:2px,color:#14532d
    classDef fail fill:#fef2f2,stroke:#dc2626,stroke-width:2px,color:#7f1d1d
    classDef paso fill:#eef2ff,stroke:#4f46e5,stroke-width:1.5px,color:#1e1b4b
    classDef qr fill:#fefce8,stroke:#ca8a04,stroke-width:1.5px,color:#713f12

    subgraph P1["🔑 Paso 1 — Credenciales"]
        A["Usuario ingresa<br/>email y contraseña"]:::paso
        B{"¿Credenciales<br/>válidas?"}
        X1["❌ Error: credenciales<br/>incorrectas"]:::fail
    end

    subgraph P2["⌚ Paso 2 — Smart watch"]
        C{"¿2FA<br/>activado?"}
        QR["Pantalla indica que se<br/>requiere el segundo paso"]:::qr
        S["⌚ El reloj muestra un código<br/>de 6 dígitos (cada 30 s)"]:::qr
        U["Usuario teclea el código"]:::paso
        V{"¿Código<br/>válido?"}
        BC["Código de respaldo:<br/>se consume (un solo uso)"]:::paso
        X2["❌ Error: código incorrecto<br/>o vencido → reintentar"]:::fail
    end

    T(["✅ Token de sesión emitido<br/>→ acceso concedido"]):::ok

    A --> B
    B -- No --> X1
    B -- Sí --> C
    C -- No --> T
    C -- Sí --> QR --> S --> U --> V
    V -- "Código TOTP válido" --> T
    V -- "Código de respaldo" --> BC --> T
    V -- No --> X2
```

### 4.2 Secuencia completa del login

```mermaid
sequenceDiagram
    actor U as 👤 Usuario
    participant W as 🌐 Web
    participant B as ⚙️ Backend
    participant DB as 🗄️ BD
    participant S as ⌚ Smart watch

    rect rgb(238, 242, 255)
        Note over U,B: Paso 1 — credenciales
        U->>W: email + contraseña
        W->>B: POST /api/auth/login
        B->>DB: valida contraseña (bcrypt)
        alt 2FA desactivado
            B-->>W: JWT de sesión (7 días)
        else 2FA activado
            B-->>W: { requires2fa: true, pendingToken }
            Note over W: token pendiente solo en memoria<br/>(nunca en localStorage)
        end
    end

    rect rgb(254, 252, 228)
        Note over U,B: Paso 2 — smart watch
        S-->>U: código de 6 dígitos (cada 30 s)
        U->>W: teclea el código
        W->>B: POST /api/auth/login/verify-2fa (Bearer pendingToken)
        B->>DB: registra intento (auditoría)
        alt código TOTP válido
            B-->>W: JWT de sesión (7 días)
        else código de respaldo válido
            B->>DB: marca el código como usado
            B-->>W: JWT de sesión (7 días)
        else incorrecto o pendiente vencido
            B-->>W: 400/401 → reintentar desde el paso 1
        end
    end

    W-->>U: ✅ Acceso concedido
```

---

## 5. Modelo de datos (segundo factor)

```mermaid
erDiagram
    classDef user fill:#eef2ff,stroke:#4f46e5,color:#1e1b4b
    classDef sec fill:#f0fdf4,stroke:#16a34a,color:#14532d
    classDef aud fill:#fefce8,stroke:#ca8a04,color:#713f12

    User {
        string id PK
        string email
        string password
        string totpSecret "secreto Base32, null si 2FA desactivado"
        boolean totpEnabled
        datetime totpEnabledAt
    }
    TotpBackupCode {
        string id PK
        string codeHash "bcrypt, 8 dígitos, un solo uso"
        datetime usedAt
        string userId FK
    }
    AuthAttempt {
        string id PK
        string type "totp | backup_code"
        boolean success
        datetime createdAt
        string userId FK
    }

    User ||--o{ TotpBackupCode : "10 códigos de respaldo"
    User ||--o{ AuthAttempt : "auditoría de intentos"

    class User user
    class TotpBackupCode sec
    class AuthAttempt aud
```

| Entidad | Propósito |
|---|---|
| `User.totpSecret` | Secreto con el que el smart watch y el backend calculan el mismo código TOTP. |
| `TotpBackupCode` | 10 códigos de respaldo (8 dígitos) para recuperar el acceso si se pierde el reloj. Se almacenan **hasheados** y son **de un solo uso**. |
| `AuthAttempt` | Registro de auditoría de cada intento del segundo paso (éxito o fallo). |

---

## 6. Cómo funciona el código TOTP (concepto)

El código de 6 dígitos **no se envía por ningún canal**: se calcula de forma
independente en el smart watch y en el backend a partir de:

- el **secreto** compartido (el que el reloj obtuvo del QR), y
- el **tiempo actual**, redondeado a ventanas de 30 segundos.

Mismo secreto + mismo instante → mismo código. El backend acepta códigos de
la ventana actual y las dos adyacentes (±30 s) para tolerar pequeñas
desincronizaciones entre el reloj y el servidor.

```mermaid
flowchart LR
    classDef in fill:#eef2ff,stroke:#4f46e5,stroke-width:1.5px,color:#1e1b4b
    classDef proc fill:#fefce8,stroke:#ca8a04,stroke-width:2px,color:#713f12
    classDef out fill:#f0fdf4,stroke:#16a34a,stroke-width:2px,color:#14532d

    K[["🔒 Secreto TOTP<br/>(obtenido del QR)"]]:::in
    T[["🕐 Tiempo actual<br/>(ventanas de 30 s)"]]:::in
    H(["⚙️ Función HMAC<br/>secreto + tiempo"]):::proc
    C(["🔢 Código de 6 dígitos"]):::out
    W1["⌚ El smart watch lo muestra"]:::out
    B1["⚙️ El backend lo recalcula<br/>y lo compara"]:::out

    K --> H
    T --> H
    H --> C
    C --> W1
    C --> B1
```

---

## 7. Decisiones de seguridad del entregable

| Decisión | Por qué |
|---|---|
| 🔹 **Token pendiente efímero** | Tras el paso 1, el token de ~5 min vive **solo en memoria** del frontend; nunca en `localStorage` ni cookies. |
| 🔹 **Códigos de respaldo seguros** | Almacenados hasheados (bcrypt) y de **un solo uso**. |
| 🔹 **Rate limiting** | El endpoint del segundo paso tiene un límite estricto de intentos por IP contra fuerza bruta. |
| 🔹 **Auditoría** | Cada intento del segundo paso queda registrado (`AuthAttempt`). |
| 🔹 **Desactivación protegida** | Apagar el 2FA requiere volver a ingresar la contraseña, no basta con el token. |

---

## 8. Estado actual y pendientes (no definitivo)

El sistema **funciona** pero no es la versión final del cuatrimestre.

```mermaid
flowchart LR
    classDef done fill:#f0fdf4,stroke:#16a34a,stroke-width:2px,color:#14532d
    classDef todo fill:#fef2f2,stroke:#dc2626,stroke-width:1.5px,color:#7f1d1d

    A["✅ Login de dos pasos<br/>con QR + smart watch"]:::done
    B["✅ Enlace del reloj<br/>escaneando el QR"]:::done
    C["✅ Códigos de respaldo<br/>y auditoría"]:::done
    D["⏳ Login completo<br/>desde el smart watch"]:::todo
    E["⏳ Desvincular el reloj<br/>desde la web"]:::todo
    F["⏳ Varios dispositivos<br/>por cuenta"]:::todo
    G["⏳ Notificar consumo de<br/>respaldos"]:::todo
    H["⏳ Pruebas de carga y<br/>endurecimiento"]:::todo

    A --> D
    B --> E
    C --> G
    D --> F --> H
    E --> H
```

---

## 9. Referencias

- RFC 6238 — *TOTP: Time-based One-Time Password Algorithm*.
- RFC 4226 — *HOTP: HMAC-Based One-Time Password Algorithm*.
- Especificación `otpauth://` — formato estándar de las URI que contienen el
  secreto TOTP dentro del QR.
- Documentación interna del repositorio: `docs/2fa.md`, `docs/mer-2fa.mmd`,
  `docs/mer-auth.mmd`, `wear-app/README.md`.
