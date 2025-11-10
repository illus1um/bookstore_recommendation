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
  getNew: (params = {}) =>
    axiosInstance.get(`${RECOMMENDATIONS_BASE}/new`, { params }),
  getFeed: ({ strategy, params = {} }) => {
    switch (strategy) {
      case 'personal':
        return recommendationsApi.getForYou(params)
      case 'trending':
        return recommendationsApi.getTrending(params)
      case 'new':
      case 'newest':
        return recommendationsApi.getNew(params)
      case 'similar': {
        const { bookId, ...rest } = params
        if (!bookId) {
          throw new Error('Для стратегии similar требуется параметр bookId')
        }
        return recommendationsApi.getSimilar(bookId, rest)
      }
      case 'genre': {
        const { genre, ...rest } = params
        if (!genre) {
          throw new Error('Для стратегии genre требуется параметр genre')
        }
        return recommendationsApi.getByGenre(genre, rest)
      }
      default:
        throw new Error(`Неизвестная стратегия рекомендаций: ${strategy}`)
    }
  },
}

export default recommendationsApi

