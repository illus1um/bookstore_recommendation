import axiosInstance from './axios'

const USERS_BASE = '/api/v1/users'

export const usersApi = {
  getUser: (userId) => axiosInstance.get(`${USERS_BASE}/${userId}`),
  updateUser: (userId, data) => axiosInstance.put(`${USERS_BASE}/${userId}`, data),
  getHistory: (userId) => axiosInstance.get(`${USERS_BASE}/${userId}/history`),
  updatePreferences: (userId, data) =>
    axiosInstance.put(`${USERS_BASE}/${userId}/preferences`, data),
}

export default usersApi

