import { Router } from 'express'
import * as CategoryController from '../controllers/category.controller'
import { requireRole } from '../middlewares/auth'
import { ROLES } from '../constants/roles'
import { validate } from '../middlewares/validate'
import { categoryIdParamSchema, createCategorySchema, updateCategorySchema } from '../schemas/category.schemas'

const router = Router()

router.get('/', CategoryController.getCategories)
router.post('/', requireRole([ROLES.ADMIN]), validate(createCategorySchema), CategoryController.createCategory)
router.put(
  '/:id',
  requireRole([ROLES.ADMIN]),
  validate(categoryIdParamSchema, 'params'),
  validate(updateCategorySchema),
  CategoryController.updateCategory,
)
router.delete('/:id', requireRole([ROLES.ADMIN]), validate(categoryIdParamSchema, 'params'), CategoryController.deleteCategory)

export default router
