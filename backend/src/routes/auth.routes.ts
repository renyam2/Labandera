import { Router } from 'express'
import { register, login, verifyTwoFactor } from '../controllers/auth.controller'
import { authLimiter, totpVerifyLimiter } from '../middlewares/rateLimit'
import { validate } from '../middlewares/validate'
import { registerSchema, loginSchema } from '../schemas/auth.schemas'
import { totpCodeSchema } from '../features/twofactor/totp.schemas'
import { verificarToken } from '../middlewares/auth'

const router = Router()

// Rate-limiting anti fuerza bruta en las rutas de autenticación
router.use(authLimiter)

router.post('/register', validate(registerSchema), register)
router.post('/login', validate(loginSchema), login)
// Segundo paso del login: requiere el token pendiente (verificarToken)
// y un rate-limit estricto anti fuerza bruta.
router.post(
  '/login/verify-2fa',
  totpVerifyLimiter,
  verificarToken,
  validate(totpCodeSchema),
  verifyTwoFactor,
)

export default router
