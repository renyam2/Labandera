import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'
import 'dotenv/config'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Iniciando seed de roles, permisos y usuarios de prueba...')

  // ─── 1. Crear permisos ───────────────────────────────────────────────────────
  const permisos = [
    { name: 'crear_articulo', description: 'Permite crear nuevos artículos' },
    { name: 'editar_articulo', description: 'Permite editar artículos existentes' },
    { name: 'eliminar_articulo', description: 'Permite eliminar artículos' },
    { name: 'publicar_articulo', description: 'Permite publicar artículos' },
    { name: 'gestionar_usuarios', description: 'Permite gestionar usuarios y roles' },
    { name: 'gestionar_categorias', description: 'Permite gestionar categorías' },
    { name: 'ver_articulo', description: 'Permite ver artículos' },
  ]

  const permisosCreados: Record<string, { id: string }> = {}
  for (const p of permisos) {
    const creado = await prisma.permission.upsert({
      where: { name: p.name },
      update: {},
      create: p,
    })
    permisosCreados[p.name] = { id: creado.id }
    console.log(`  ✅ Permiso creado: ${p.name}`)
  }

  // ─── 2. Crear roles ──────────────────────────────────────────────────────────
  const roles = [
    { name: 'Administrador', description: 'Acceso completo al sistema' },
    { name: 'Editor', description: 'Puede crear, editar y publicar artículos' },
    { name: 'Usuario', description: 'Puede ver artículos' },
  ]

  const rolesCreados: Record<string, { id: string }> = {}
  for (const r of roles) {
    const creado = await prisma.role.upsert({
      where: { name: r.name },
      update: {},
      create: r,
    })
    rolesCreados[r.name] = { id: creado.id }
    console.log(`  ✅ Rol creado: ${r.name}`)
  }

  // ─── 3. Asignar permisos a roles ─────────────────────────────────────────────
  const asignaciones = [
    // Administrador: todos los permisos
    { role: 'Administrador', permisos: Object.keys(permisosCreados) },
    // Editor: crear, editar, publicar, ver
    { role: 'Editor', permisos: ['crear_articulo', 'editar_articulo', 'publicar_articulo', 'ver_articulo'] },
    // Usuario: solo ver
    { role: 'Usuario', permisos: ['ver_articulo'] },
  ]

  for (const a of asignaciones) {
    const role = rolesCreados[a.role]
    for (const permName of a.permisos) {
      const perm = permisosCreados[permName]
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: perm.id,
          },
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId: perm.id,
        },
      })
    }
    console.log(`  ✅ Permisos asignados a ${a.role}: ${a.permisos.join(', ')}`)
  }

  // ─── 4. Crear usuarios de prueba ─────────────────────────────────────────────
  const password = 'password123'
  const hashedPassword = await bcrypt.hash(password, 10)

  const usuariosPrueba = [
    { name: 'Admin Test', email: 'admin@labandera.mx', role: 'Administrador' },
    { name: 'Editor Test', email: 'editor@labandera.mx', role: 'Editor' },
    { name: 'Usuario Test', email: 'usuario@labandera.mx', role: 'Usuario' },
  ]

  for (const u of usuariosPrueba) {
    // Buscar o crear el usuario
    let user = await prisma.user.findUnique({ where: { email: u.email } })
    if (!user) {
      user = await prisma.user.create({
        data: {
          name: u.name,
          email: u.email,
          password: hashedPassword,
        },
      })
      console.log(`  ✅ Usuario creado: ${u.email}`)
    } else {
      console.log(`  ⏭️  Usuario ya existe: ${u.email}`)
    }

    // Asignar rol al usuario
    const role = rolesCreados[u.role]
    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: user.id,
          roleId: role.id,
        },
      },
      update: {},
      create: {
        userId: user.id,
        roleId: role.id,
      },
    })
    console.log(`  ✅ Rol asignado a ${u.email}: ${u.role}`)
  }

  console.log('\n✅ Seed completado exitosamente.')
  console.log('\n📋 Credenciales de prueba:')
  console.log('  Admin:    admin@labandera.mx / password123')
  console.log('  Editor:   editor@labandera.mx / password123')
  console.log('  Usuario:  usuario@labandera.mx / password123')
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
