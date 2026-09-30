import { Router } from 'express'
import { verificarToken } from '../../middlewares/auth'
import { validate } from '../../middlewares/validate'
import { totpCodeSchema, disableTotpSchema } from './totp.schemas'
import {
  setupTotp,
  verifyTotpSetup,
  disableTotp,
  regenerateBackupCodes,
} from './totp.controller'

const router = Router()

// Todas las rutas requieren sesión iniciada.
router.use(verificarToken)

router.post('/setup', setupTotp)
router.post('/verify-setup', validate(totpCodeSchema), verifyTotpSetup)
router.delete('/', validate(disableTotpSchema), disableTotp)
router.post('/backup-codes', regenerateBackupCodes)

export default router
