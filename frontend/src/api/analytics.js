import axiosInstance from './axios'

const ANALYTICS_BASE = '/api/v1/analytics'

export const analyticsApi = {
  getUserBehavior: () => axiosInstance.get(`${ANALYTICS_BASE}/user-behavior`),
}

export default analyticsApi

