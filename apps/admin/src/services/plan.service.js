// src/services/plansService.ts
import api from './axios' // your pre-configured axios instance

const API_URL = '/plans' // adjust if your backend is on another host

export const PlansService = {
  getPlans: async () => {
    const res = await api.get(API_URL)
    return res.data
  },

  createPlan: async (data) => {
    const res = await api.post(API_URL, data)
    return res.data
  },

  updatePlan: async (id, data) => {
    const res = await api.put(`${API_URL}/${id}`, data)
    return res.data
  },

  deletePlan: async (id) => {
    const res = await api.delete(`${API_URL}/${id}`)
    return res.data
  },
  assignPlanToUser: async (userId, planId) => {
    const res = await api.post(`${API_URL}/assign-to-user`, { userId, planId })
    return res.data
  },
}
