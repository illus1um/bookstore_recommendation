import axiosInstance from './axios'

const ADMIN_BASE = '/api/v1/users/admin'

export const adminApi = {
  listUsers: (params = {}) => axiosInstance.get(`${ADMIN_BASE}/list`, { params }),
  updateUser: (userId, data) => axiosInstance.put(`${ADMIN_BASE}/${userId}`, data),
  deleteUser: (userId) => axiosInstance.delete(`${ADMIN_BASE}/${userId}`),
}

export default adminApi

