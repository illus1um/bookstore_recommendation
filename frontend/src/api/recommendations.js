import axiosInstance from './axios'

const RECOMMENDATIONS_BASE = '/api/v1/recommendations'

export const recommendationsApi = {
  getForYou: (params = {}) =>
    axiosInstance.get(`${RECOMMENDATIONS_BASE}/for-you`, { params }),
  getSimilar: (bookId, params = {}) =>
    axiosInstance.get(`${RECOMMENDATIONS_BASE}/similar/${bookId}`, { params }),
  getTrending: (params = {}) =>
    axiosInstance.get(`${RECOMMENDATIONS_BASE}/trending`, { params }),
  getByGenre: (genre, params = {}) =>
    axiosInstance.get(`${RECOMMENDATIONS_BASE}/by-genre/${genre}`, { params }),
}

export default recommendationsApi

