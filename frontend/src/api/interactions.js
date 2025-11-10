import axiosInstance from './axios'

const INTERACTIONS_BASE = '/api/v1/interactions'

export const interactionsApi = {
  createInteraction: (data) => axiosInstance.post(`${INTERACTIONS_BASE}/`, data),
  getUserInteractions: (userId) =>
    axiosInstance.get(`${INTERACTIONS_BASE}/user/${userId}`),
}

export default interactionsApi

