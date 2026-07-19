import { Router, Request, Response } from 'express'
import multer from 'multer'
import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import * as ArticleController from '../controllers/article.controller'
import { requireRole } from '../middlewares/auth'
import { prisma } from '../prisma'

const router = Router()
const upload = multer({ storage: multer.memoryStorage() })

// Lectura pública
router.get('/', ArticleController.getArticles)
router.get('/:id', ArticleController.getArticleById)

// Escritura protegida (Administrador o Editor)
router.post('/', requireRole(['Administrador', 'Editor']), ArticleController.createArticle)
router.put('/:id', requireRole(['Administrador', 'Editor']), ArticleController.updateArticle)
router.delete('/:id', requireRole(['Administrador']), ArticleController.deleteArticle)

// Subida de imagen a un artículo
router.post(
  '/:id/images',
  requireRole(['Administrador', 'Editor']),
  upload.single('image'),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No se proporcionó archivo' })
      }

      const ext = path.extname(req.file.originalname)
      const filename = `${crypto.randomUUID()}${ext}`
      const uploadDir = path.join(process.cwd(), 'uploads')

      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true })
      }

      fs.writeFileSync(path.join(uploadDir, filename), req.file.buffer)

      const articleImage = await prisma.articleImage.create({
        data: {
          url: `/uploads/${filename}`,
          articleId: req.params.id,
          order: 0,
        },
      })

      res.status(201).json(articleImage)
    } catch (err) {
      console.error('Error al subir imagen:', err)
      res.status(500).json({ message: 'Error al subir la imagen' })
    }
  },
)

export default router
