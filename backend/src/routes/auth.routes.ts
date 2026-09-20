import { Router } from 'express'
import { register, login } from '../controllers/auth.controller'
import { authLimiter } from '../middlewares/rateLimit'
import { validate } from '../middlewares/validate'
import { registerSchema, loginSchema } from '../schemas/auth.schemas'

const router = Router()

// Rate-limiting anti fuerza bruta en las rutas de autenticación
router.use(authLimiter)

router.post('/register', validate(registerSchema), register)
router.post('/login', validate(loginSchema), login)

export default router
