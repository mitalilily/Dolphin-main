import api from './axios'

export async function fetchDeveloperErrorLogs(page = 1, limit = 20, filters = {}) {
  try {
    const response = await api.get('/admin/developer/error-logs', {
      params: {
        page,
        limit,
        ...filters,
      },
    })

    return response.data
  } catch (error) {
    console.error('Error fetching developer logs:', error.response?.data || error.message)
    throw error
  }
}

export async function updateDeveloperIssue(issueKey, payload) {
  try {
    const response = await api.patch(
      `/admin/developer/issues/${encodeURIComponent(issueKey)}`,
      payload,
    )
    return response.data
  } catch (error) {
    console.error('Error updating developer issue:', error.response?.data || error.message)
    throw error
  }
}

export async function retryDeveloperManifest({ orderId, issueKey }) {
  try {
    const response = await api.post('/admin/developer/retry-manifest', { orderId, issueKey })
    return response.data
  } catch (error) {
    console.error('Error retrying developer manifest:', error.response?.data || error.message)
    throw error
  }
}
