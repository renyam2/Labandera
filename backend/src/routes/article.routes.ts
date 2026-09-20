import { Router, Request, Response } from 'express'
import multer from 'multer'
import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import * as ArticleController from '../controllers/article.controller'
import { requireRole } from '../middlewares/auth'
import { ROLES } from '../constants/roles'
import { validate } from '../middlewares/validate'
import { validateImageUpload, MAX_UPLOAD_SIZE, mimeToExtension } from '../middlewares/uploadValidation'
import { articleIdParamSchema, createArticleSchema, updateArticleSchema } from '../schemas/article.schemas'
import { prisma } from '../prisma'

const router = Router()
// Límite de tamaño: si se excede, multer lanza MulterFileParseError y el
// manejador global de errores responde 413.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_SIZE },
})

// Lectura pública
router.get('/', ArticleController.getArticles)
router.get('/:id', validate(articleIdParamSchema, 'params'), ArticleController.getArticleById)

// Escritura protegida (Administrador o Editor)
router.post(
  '/',
  requireRole([ROLES.ADMIN, ROLES.EDITOR]),
  validate(createArticleSchema),
  ArticleController.createArticle,
)
router.put(
  '/:id',
  requireRole([ROLES.ADMIN, ROLES.EDITOR]),
  validate(articleIdParamSchema, 'params'),
  validate(updateArticleSchema),
  ArticleController.updateArticle,
)
router.delete('/:id', requireRole([ROLES.ADMIN]), validate(articleIdParamSchema, 'params'), ArticleController.deleteArticle)

// Subida de imagen a un artículo
router.post(
  '/:id/images',
  requireRole([ROLES.ADMIN, ROLES.EDITOR]),
  validate(articleIdParamSchema, 'params'),
  upload.single('image'),
  validateImageUpload,
  async (req: Request, res: Response) => {
    // validateImageUpload garantiza que req.file existe y que su MIME es válido.
    const file = req.file!
    const filename = `${crypto.randomUUID()}${mimeToExtension(file.mimetype)}`
    const uploadDir = path.join(process.cwd(), 'uploads')

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }

    fs.writeFileSync(path.join(uploadDir, filename), file.buffer)

    // P2025 (artículo inexistente) lo resuelve el manejador global de errores.
    const articleImage = await prisma.articleImage.create({
      data: {
        url: `/uploads/${filename}`,
        articleId: String(req.params.id),
        order: 0,
      },
    })

    res.status(201).json(articleImage)
  },
)

export default router
