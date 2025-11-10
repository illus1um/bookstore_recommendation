import axiosInstance from './axios'

const AUTH_BASE = '/api/v1/auth'

export const authApi = {
  register: (data) => axiosInstance.post(`${AUTH_BASE}/register`, data),
  login: (data) =>
    axiosInstance.post(
      `${AUTH_BASE}/login`,
      new URLSearchParams({
        username: data.email,
        password: data.password,
      }),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      },
    ),
  logout: () => axiosInstance.post(`${AUTH_BASE}/logout`),
  me: () => axiosInstance.get(`${AUTH_BASE}/me`),
}

export default authApi

