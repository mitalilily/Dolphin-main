import { Response } from 'express'
import { getAdminDashboardStats } from '../../models/services/adminDashboard.service'

export const getAdminDashboardStatsController = async (_req: any, res: Response) => {
  try {
    const stats = await getAdminDashboardStats()
    return res.status(200).json(stats)
  } catch (error: any) {
    console.error('[AdminDashboard] Failed to fetch stats:', error?.message || error)
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch admin dashboard stats',
    })
  }
}
