import { Router } from 'express'
import * as CategoryController from '../controllers/category.controller'
import { requireRole } from '../middlewares/auth'

const router = Router()

router.get('/', CategoryController.getCategories)
router.post('/', requireRole(['ADMIN']), CategoryController.createCategory)
router.put('/:id', requireRole(['ADMIN']), CategoryController.updateCategory)
router.delete('/:id', requireRole(['ADMIN']), CategoryController.deleteCategory)

export default router
