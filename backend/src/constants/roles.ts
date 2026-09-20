/**
 * Constantes de roles del sistema.
 * Mantener sincronizado con el seed (prisma/seed.ts).
 */
export const ROLES = {
  ADMIN: 'Administrador',
  EDITOR: 'Editor',
  USER: 'Usuario',
} as const

export type RoleName = (typeof ROLES)[keyof typeof ROLES]

/** Todos los roles disponibles */
export const ALL_ROLES: RoleName[] = [ROLES.ADMIN, ROLES.EDITOR, ROLES.USER]
