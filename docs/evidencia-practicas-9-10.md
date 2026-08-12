# Evidencia de Prácticas 9 y 10: Autenticación, Autorización y Seguridad

## Parte 1. Diseño de la base de datos

El sistema utiliza un modelo de roles y permisos flexible basado en relaciones muchos-a-muchos. Las tablas `User`, `Role` y `Permission` se conectan mediante las tablas intermedias `UserRole` y `RolePermission`, permitiendo asignar múltiples roles a un usuario y múltiples permisos a un rol.

```prisma
model User {
  id        String    @id @default(uuid())
  roles     UserRole[]
  // ...
}

model UserRole {
  userId String
  roleId String
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  role   Role   @relation(fields: [roleId], references: [id], onDelete: Cascade)
  
  @@unique([userId, roleId])
}
```

La asignación de permisos se define en el script de seed (`seed.ts`), donde se inicializan los roles y se vinculan con los permisos específicos correspondientes a cada nivel de acceso.

```typescript
const roles = [
  { name: 'Administrador', description: 'Acceso completo al sistema' },
  { name: 'Editor', description: 'Puede crear, editar y publicar artículos' },
  { name: 'Usuario', description: 'Puede ver artículos' },
]

const asignaciones = [
  { role: 'Administrador', permisos: Object.keys(permisosCreados) },
  { role: 'Editor', permisos: ['crear_articulo', 'editar_articulo', 'publicar_articulo', 'ver_articulo'] },
  { role: 'Usuario', permisos: ['ver_articulo'] },
]
```

## Parte 2. Implementación del inicio de sesión

El registro (`register`) crea al usuario en la base de datos y asigna automáticamente el rol por defecto "Usuario" si este existe. Las contraseñas se cifran utilizando `bcrypt` con 10 rondas de hashing antes de almacenarlas.

```typescript
const hashed = await bcrypt.hash(password, 10)
const user = await prisma.user.create({
  data: { name, email, password: hashed }
})

const defaultRole = await prisma.role.findUnique({ where: { name: 'Usuario' } })
if (defaultRole) {
  await prisma.userRole.create({
    data: { userId: user.id, roleId: defaultRole.id }
  })
}
```

El login (`login`) verifica las credenciales y devuelve mensajes genéricos ("Credenciales inválidas") tanto si el usuario no existe como si la contraseña es incorrecta. Esto previene ataques de enumeración de usuarios. Si la validación es exitosa, se genera un JWT que contiene el ID del usuario y sus roles.

```typescript
if (!user) return res.status(401).json({ message: 'Credenciales inválidas' })
const valid = await bcrypt.compare(password, user.password)
if (!valid) return res.status(401).json({ message: 'Credenciales inválidas' })

const rolesArray = user.roles.map(ur => ur.role.name)
const token = jwt.sign(
  { id: user.id, roles: rolesArray },
  process.env.JWT_SECRET!,
  { expiresIn: '7d' }
)
```

## Parte 3. Control de acceso

En el backend (`article.routes.ts`), el middleware `requireRole` se utiliza para restringir las operaciones de escritura. La lectura es pública, la creación y edición requieren los roles de "Administrador" o "Editor", y la eliminación está reservada exclusivamente para "Administrador".

```typescript
router.get('/', ArticleController.getArticles)
router.post('/', requireRole(['Administrador', 'Editor']), ArticleController.createArticle)
router.put('/:id', requireRole(['Administrador', 'Editor']), ArticleController.updateArticle)
router.delete('/:id', requireRole(['Administrador']), ArticleController.deleteArticle)
```

En el frontend (`App.tsx`), el componente `UploadGuard` protege la ruta de subida de notas. Verifica si el usuario está logueado y si tiene el rol de "Administrador" o "Editor" almacenado en `localStorage`. Si no cumple los requisitos, redirige al usuario a la página de inicio o login.

```typescript
function UploadGuard() {
  const raw = localStorage.getItem('user');
  if (raw) {
    const user = JSON.parse(raw);
    const roles = user.roles || [];
    if (!roles.includes("Administrador") && !roles.includes("Editor")) {
      navigate("/");
      return null;
    }
  } else {
    navigate("/login");
      return null;
    }
  return <UploadScreenLazy ... />;
}
```

## Parte 4. Seguridad

El middleware `requireRole` en `auth.ts` valida la firma del JWT y verifica que el usuario posea al menos uno de los roles permitidos. Si el token es inválido, responde con 401; si el usuario no tiene permisos, responde con 403.

```typescript
export const requireRole = (roles: string[]): RequestHandler => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(' ')[1]
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string; roles: string[] }
      req.user = decoded
      if (!decoded.roles.some(r => roles.includes(r))) {
        res.status(403).json({ message: 'No tienes permiso' })
        return
      }
      next()
    } catch {
      res.status(401).json({ message: 'Token inválido' })
    }
  }
}
```

El manejo de errores en los controladores (`auth.controller.ts`) captura excepciones y las registra en el servidor mediante `console.error`, pero devuelve mensajes genéricos al cliente (código 500) para evitar exponer detalles internos o stack traces que podrían ser utilizados en ataques de información.

```typescript
} catch (err) {
  console.error('Error registro:', err)
  res.status(500).json({ message: 'Error al registrar usuario' })
}
```
