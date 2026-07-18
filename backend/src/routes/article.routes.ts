import { Router } from 'express'
import * as ArticleController from '../controllers/article.controller'
import { requireRole } from '../middlewares/auth'

const router = Router()

// Lectura pública
router.get('/', ArticleController.getArticles)
router.get('/:id', ArticleController.getArticleById)

// Escritura protegida (Administrador o Editor)
router.post('/', requireRole(['Administrador', 'Editor']), ArticleController.createArticle)
router.put('/:id', requireRole(['Administrador', 'Editor']), ArticleController.updateArticle)
router.delete('/:id', requireRole(['Administrador']), ArticleController.deleteArticle)

export default router
