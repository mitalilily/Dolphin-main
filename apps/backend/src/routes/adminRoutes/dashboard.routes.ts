import { Router } from 'express'
import { getAdminDashboardStatsController } from '../../controllers/admin/dashboard.controller'
import { isAdminMiddleware } from '../../middlewares/isAdmin'
import { requireAuth } from '../../middlewares/requireAuth'

const router = Router()

router.get('/stats', requireAuth, isAdminMiddleware, getAdminDashboardStatsController)

export default router
