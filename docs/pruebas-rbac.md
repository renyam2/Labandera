# Pruebas manuales — RBAC (Parte 1 a 4)

Este documento describe los casos de prueba manuales para verificar el sistema de control de acceso basado en roles (RBAC) implementado en el backend.

## Prerrequisitos

- Servidor backend corriendo en `http://localhost:3000`
- Cliente HTTP (curl, Postman, Insomnia, etc.)
- Base de datos PostgreSQL configurada

## Roles del sistema

| Rol | Descripción |
|---|---|
| `ADMIN` | Acceso total: lectura y escritura en artículos y categorías |
| `EDITOR` | Lectura y escritura en artículos; **no** puede gestionar categorías |
| `READER` | Solo lectura en artículos y categorías |

---

## 1. Autenticación

### 1.1 Registro de usuario ADMIN

```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "Admin Test",
  "email": "admin@test.com",
  "password": "password123"
}
```

**Esperado:** `201 Created` con `token` y objeto `user` donde `role: "ADMIN"`.

### 1.2 Registro de usuario EDITOR

```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "Editor Test",
  "email": "editor@test.com",
  "password": "password123"
}
```

**Esperado:** `201 Created` con `role: "EDITOR"`.

### 1.3 Registro de usuario READER

```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "Reader Test",
  "email": "reader@test.com",
  "password": "password123"
}
```

**Esperado:** `201 Created` con `role: "READER"`.

### 1.4 Login con credenciales correctas

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@test.com",
  "password": "password123"
}
```

**Esperado:** `200 OK` con `token` y datos del usuario.

### 1.5 Login con contraseña incorrecta

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@test.com",
  "password": "wrongpassword"
}
```

**Esperado:** `401 Unauthorized` con `{ "message": "Contraseña incorrecta" }`.

### 1.6 Login con email no registrado

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "noexiste@test.com",
  "password": "password123"
}
```

**Esperado:** `404 Not Found` con `{ "message": "Usuario no encontrado" }`.

### 1.7 Registro con email duplicado

```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "Admin Duplicado",
  "email": "admin@test.com",
  "password": "password123"
}
```

**Esperado:** `400 Bad Request` con `{ "message": "Email ya registrado" }`.

---

## 2. Artículos — Lectura pública (READER puede leer)

### 2.1 Listar artículos (sin token)

```http
GET /api/articles
```

**Esperado:** `200 OK` con array de artículos (puede estar vacío).

### 2.2 Listar artículos (con token READER)

```http
GET /api/articles
Authorization: Bearer <TOKEN_READER>
```

**Esperado:** `200 OK` con array de artículos.

### 2.3 Obtener artículo por ID (sin token)

```http
GET /api/articles/<ID>
```

**Esperado:** `200 OK` con el artículo o `404` si no existe.

---

## 3. Artículos — Escritura (ADMIN y EDITOR pueden escribir)

### 3.1 Crear artículo como ADMIN

```http
POST /api/articles
Authorization: Bearer <TOKEN_ADMIN>
Content-Type: application/json

{
  "title": "Artículo de prueba",
  "slug": "articulo-prueba",
  "summary": "Resumen del artículo",
  "content": "Contenido completo del artículo",
  "image": "https://ejemplo.com/img.jpg",
  "published": true,
  "categoryId": "<ID_CATEGORIA>",
  "authorId": "<ID_ADMIN>"
}
```

**Esperado:** `201 Created` con el artículo creado.

### 3.2 Crear artículo como EDITOR

```http
POST /api/articles
Authorization: Bearer <TOKEN_EDITOR>
Content-Type: application/json

{
  "title": "Artículo de editor",
  "slug": "articulo-editor",
  "summary": "Resumen del artículo de editor",
  "content": "Contenido completo",
  "published": false,
  "categoryId": "<ID_CATEGORIA>",
  "authorId": "<ID_EDITOR>"
}
```

**Esperado:** `201 Created` con el artículo creado.

### 3.3 Crear artículo como READER (denegado)

```http
POST /api/articles
Authorization: Bearer <TOKEN_READER>
Content-Type: application/json

{
  "title": "Intento de reader",
  "slug": "intentos-reader",
  "content": "No debería funcionar",
  "categoryId": "<ID_CATEGORIA>",
  "authorId": "<ID_READER>"
}
```

**Esperado:** `403 Forbidden` con `{ "message": "No tienes permiso" }`.

### 3.4 Crear artículo sin token (denegado)

```http
POST /api/articles
Content-Type: application/json

{
  "title": "Sin token",
  "slug": "sin-token",
  "content": "No debería funcionar",
  "categoryId": "<ID_CATEGORIA>",
  "authorId": "<ID_READER>"
}
```

**Esperado:** `401 Unauthorized` con `{ "message": "Token requerido" }`.

### 3.5 Crear artículo con token inválido (denegado)

```http
POST /api/articles
Authorization: Bearer token-falso-e-invalido
Content-Type: application/json

{
  "title": "Token falso",
  "slug": "token-falso",
  "content": "No debería funcionar",
  "categoryId": "<ID_CATEGORIA>",
  "authorId": "<ID_READER>"
}
```

**Esperado:** `401 Unauthorized` con `{ "message": "Token inválido" }`.

### 3.6 Actualizar artículo como ADMIN

```http
PUT /api/articles/<ID>
Authorization: Bearer <TOKEN_ADMIN>
Content-Type: application/json

{
  "title": "Artículo actualizado",
  "slug": "articulo-prueba",
  "summary": "Resumen actualizado",
  "content": "Contenido actualizado",
  "published": true,
  "categoryId": "<ID_CATEGORIA>"
}
```

**Esperado:** `200 OK` con el artículo actualizado.

### 3.7 Actualizar artículo como EDITOR

```http
PUT /api/articles/<ID>
Authorization: Bearer <TOKEN_EDITOR>
Content-Type: application/json

{
  "title": "Artículo editado",
  "slug": "articulo-prueba",
  "content": "Contenido editado"
}
```

**Esperado:** `200 OK` con el artículo actualizado.

### 3.8 Actualizar artículo como READER (denegado)

```http
PUT /api/articles/<ID>
Authorization: Bearer <TOKEN_READER>
Content-Type: application/json

{
  "title": "Intento de actualización reader"
}
```

**Esperado:** `403 Forbidden`.

### 3.9 Eliminar artículo como ADMIN

```http
DELETE /api/articles/<ID>
Authorization: Bearer <TOKEN_ADMIN>
```

**Esperado:** `200 OK` con `{ "message": "Artículo eliminado" }`.

### 3.10 Eliminar artículo como EDITOR

```http
DELETE /api/articles/<ID>
Authorization: Bearer <TOKEN_EDITOR>
```

**Esperado:** `200 OK` con `{ "message": "Artículo eliminado" }`.

### 3.11 Eliminar artículo como READER (denegado)

```http
DELETE /api/articles/<ID>
Authorization: Bearer <TOKEN_READER>
```

**Esperado:** `403 Forbidden`.

---

## 4. Categorías — Lectura pública

### 4.1 Listar categorías (sin token)

```http
GET /api/categories
```

**Esperado:** `200 OK` con array de categorías.

### 4.2 Listar categorías (con token READER)

```http
GET /api/categories
Authorization: Bearer <TOKEN_READER>
```

**Esperado:** `200 OK` con array de categorías.

---

## 5. Categorías — Escritura (solo ADMIN)

### 5.1 Crear categoría como ADMIN

```http
POST /api/categories
Authorization: Bearer <TOKEN_ADMIN>
Content-Type: application/json

{
  "name": "Tecnología"
}
```

**Esperado:** `201 Created` con la categoría creada.

### 5.2 Crear categoría como EDITOR (denegado)

```http
POST /api/categories
Authorization: Bearer <TOKEN_EDITOR>
Content-Type: application/json

{
  "name": "Deportes"
}
```

**Esperado:** `403 Forbidden` con `{ "message": "No tienes permiso" }`.

### 5.3 Crear categoría como READER (denegado)

```http
POST /api/categories
Authorization: Bearer <TOKEN_READER>
Content-Type: application/json

{
  "name": "Cultura"
}
```

**Esperado:** `403 Forbidden`.

### 5.4 Crear categoría sin token (denegado)

```http
POST /api/categories
Content-Type: application/json

{
  "name": "Sin token"
}
```

**Esperado:** `401 Unauthorized` con `{ "message": "Token requerido" }`.

### 5.5 Actualizar categoría como ADMIN

```http
PUT /api/categories/<ID>
Authorization: Bearer <TOKEN_ADMIN>
Content-Type: application/json

{
  "name": "Tecnología Actualizada"
}
```

**Esperado:** `200 OK` con la categoría actualizada.

### 5.6 Actualizar categoría como EDITOR (denegado)

```http
PUT /api/categories/<ID>
Authorization: Bearer <TOKEN_EDITOR>
Content-Type: application/json

{
  "name": "Nombre cambiado"
}
```

**Esperado:** `403 Forbidden`.

### 5.7 Eliminar categoría como ADMIN

```http
DELETE /api/categories/<ID>
Authorization: Bearer <TOKEN_ADMIN>
```

**Esperado:** `200 OK` con `{ "message": "Categoría eliminada" }`.

### 5.8 Eliminar categoría como EDITOR (denegado)

```http
DELETE /api/categories/<ID>
Authorization: Bearer <TOKEN_EDITOR>
```

**Esperado:** `403 Forbidden`.

---

## Resumen de permisos

| Recurso | READER | EDITOR | ADMIN |
|---|---|---|---|
| `GET /api/articles` | ✅ | ✅ | ✅ |
| `GET /api/articles/:id` | ✅ | ✅ | ✅ |
| `POST /api/articles` | ❌ | ✅ | ✅ |
| `PUT /api/articles/:id` | ❌ | ✅ | ✅ |
| `DELETE /api/articles/:id` | ❌ | ✅ | ✅ |
| `GET /api/categories` | ✅ | ✅ | ✅ |
| `POST /api/categories` | ❌ | ❌ | ✅ |
| `PUT /api/categories/:id` | ❌ | ❌ | ✅ |
| `DELETE /api/categories/:id` | ❌ | ❌ | ✅ |

---

## Notas

- Los tokens JWT expiran a las **7 días** (`expiresIn: '7d'`).
- El campo `slug` debe ser único a nivel de base de datos; si se repite, Prisma lanzará un error de restricción única.
- Los campos `authorId` y `categoryId` deben referenciar registros existentes en las tablas `User` y `Category` respectivamente.
