import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import authRoutes from './routes/auth.routes'
import articleRoutes from './routes/article.routes'
import categoryRoutes from './routes/category.routes'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
  res.json({ message: 'Labandera API funcionando 🚀' })
})

app.use('/api/auth', authRoutes)
app.use('/api/articles', articleRoutes)
app.use('/api/categories', categoryRoutes)

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`Servidor corriendo en http://0.0.0.0:${PORT}`)
})
