import axiosInstance from './axios'

const INTERACTIONS_BASE = '/api/v1/interactions'

export const interactionsApi = {
  createInteraction: (data) => axiosInstance.post(`${INTERACTIONS_BASE}/`, data),
  getUserInteractions: (userId) =>
    axiosInstance.get(`${INTERACTIONS_BASE}/user/${userId}`),
  getAdminInteractions: (params = {}) =>
    axiosInstance.get(`${INTERACTIONS_BASE}/admin/list`, { params }),
  toggleLike: (bookId) => axiosInstance.post(`${INTERACTIONS_BASE}/toggle-like/${bookId}`),
  getUserLikes: () => axiosInstance.get(`${INTERACTIONS_BASE}/likes`),
}

export default interactionsApi

