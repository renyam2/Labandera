import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'
import path from 'path'
import authRoutes from './routes/auth.routes'
import articleRoutes from './routes/article.routes'
import categoryRoutes from './routes/category.routes'
import { errorHandler, notFoundHandler } from './middlewares/errorHandler'
import { apiLimiter } from './middlewares/rateLimit'
import { validateEnv } from './schemas/env'

dotenv.config()

// Fail-fast: si alguna variable de entorno es inválida, el proceso termina aquí.
const env = validateEnv()

const app = express()
const PORT = env.PORT

app.use(helmet())
app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
  res.json({ message: 'Labandera API funcionando 🚀' })
})

app.use('/uploads', express.static(path.join(__dirname, '../uploads')))
app.use('/api', apiLimiter)
app.use('/api/auth', authRoutes)
app.use('/api/articles', articleRoutes)
app.use('/api/categories', categoryRoutes)

// 404 para rutas inexistentes
app.use(notFoundHandler)

// Manejador global de errores (debe ir al final)
app.use(errorHandler)

// Solo arranca el servidor al ejecutarse directamente (permite importar
// `app` en los tests sin levantar el listener).
if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor corriendo en http://0.0.0.0:${PORT} (${env.NODE_ENV})`)
  })
}

export default app
