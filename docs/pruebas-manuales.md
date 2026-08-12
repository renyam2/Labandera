# Pruebas Manuales — Autenticación y Autorización

Backend: `http://localhost:3000/api` · Credenciales de `seed.ts` (password: `password123`)

## 1. Registro
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name": "Nuevo Periodista", "email": "nuevo@labandera.mx", "password": "password123"}'
```
Esperado: `201` con `token` y `user.roles: ["Usuario"]`.

## 2. Login correcto
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@labandera.mx", "password": "password123"}'
```
Esperado: `200` con `token`.

## 3. Login con contraseña incorrecta
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@labandera.mx", "password": "incorrecta"}'
```
Esperado: `401` `{"message": "Credenciales inválidas"}`.

## 4. POST /articles sin token
```bash
curl -X POST http://localhost:3000/api/articles \
  -H "Content-Type: application/json" \
  -d '{"title": "Test", "content": "Test"}'
```
Esperado: `401` `{"message": "Token requerido"}`.

## 5. POST /articles con rol Usuario (denegado)
```bash
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "usuario@labandera.mx", "password": "password123"}' | jq -r '.token')

curl -X POST http://localhost:3000/api/articles \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "Test", "content": "Test"}'
```
Esperado: `403` `{"message": "No tienes permiso"}`.

## 6. POST /articles con rol Editor (permitido)
```bash
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "editor@labandera.mx", "password": "password123"}' | jq -r '.token')

curl -X POST http://localhost:3000/api/articles \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "Nota de prueba", "slug": "nota-prueba", "summary": "resumen", "content": "cuerpo", "categoryId": "<ID_CATEGORIA>", "authorId": "<ID_EDITOR>"}'
```
Esperado: `201` con el artículo creado.

## 7. DELETE /articles/:id con rol Editor (denegado)
```bash
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "editor@labandera.mx", "password": "password123"}' | jq -r '.token')

curl -X DELETE http://localhost:3000/api/articles/<ID> \
  -H "Authorization: Bearer $TOKEN"
```
Esperado: `403` `{"message": "No tienes permiso"}`.

## 8. DELETE /articles/:id con rol Administrador (permitido)
```bash
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@labandera.mx", "password": "password123"}' | jq -r '.token')

curl -X DELETE http://localhost:3000/api/articles/<ID> \
  -H "Authorization: Bearer $TOKEN"
```

## 9. Logout
```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Authorization: Bearer $TOKEN"
```
Esperado: `200` `{"message": "Sesión cerrada. Elimina el token en el cliente."}`.
