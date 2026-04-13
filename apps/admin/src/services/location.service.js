import api from './axios'

const API_BASE = '/serviceability' // adjust based on your setup

export const locationService = {
  fetchLocations: async (params) => {
    const res = await api.get(`${API_BASE}/locations`, { params })
    return res.data
  },

  getLocationById: async (id) => {
    const res = await api.get(`${API_BASE}/locations/${id}`)
    return res.data
  },

  createLocation: async (data) => {
    const res = await api.post(`${API_BASE}/locations`, data)
    return res.data
  },

  updateLocation: async (id, data) => {
    const res = await api.put(`${API_BASE}/locations/${id}`, data)
    return res.data
  },

  deleteLocation: async (id) => {
    await api.delete(`${API_BASE}/locations/${id}`)
  },
}
