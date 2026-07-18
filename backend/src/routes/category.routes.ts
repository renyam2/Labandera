import { Router } from 'express'
import * as CategoryController from '../controllers/category.controller'
import { requireRole } from '../middlewares/auth'

const router = Router()

router.get('/', CategoryController.getCategories)
router.post('/', requireRole(['Administrador']), CategoryController.createCategory)
router.put('/:id', requireRole(['Administrador']), CategoryController.updateCategory)
router.delete('/:id', requireRole(['Administrador']), CategoryController.deleteCategory)

export default router
