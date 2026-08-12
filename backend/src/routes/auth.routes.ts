import { Router } from 'express'
import { register, login, logout } from '../controllers/auth.controller'
import { verificarToken } from '../middlewares/auth'

const router = Router()

router.post('/register', register)
router.post('/login', login)
router.post('/logout', verificarToken, logout)

export default router
