import api from './axios'

export const getAdminDashboardStats = async () => {
  const { data } = await api.get('/admin/dashboard/stats')
  return data
}
