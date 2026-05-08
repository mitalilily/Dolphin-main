// src/routes/admin.support.routes.ts
import { Router } from 'express'
import {
  getAllTickets,
  getTicketDetails,
  getTicketsByUserId,
  updateTicketStatus,
} from '../../controllers/admin/support.controller'
import { isAdminMiddleware } from '../../middlewares/isAdmin'
import { requireAuth } from '../../middlewares/requireAuth'

const router = Router()

// List all tickets with filters
router.get('/support-tickets', requireAuth, isAdminMiddleware, getAllTickets)

// Get a specific ticket
router.get('/support-tickets/:id', requireAuth, isAdminMiddleware, getTicketDetails)

// Update ticket (status, due date)
router.patch('/support-tickets/:id', requireAuth, isAdminMiddleware, updateTicketStatus)

router.get('/support-tickets/user/:userId', requireAuth, isAdminMiddleware, getTicketsByUserId)

export default router
