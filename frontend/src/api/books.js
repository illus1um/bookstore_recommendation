import axiosInstance from './axios'

const BOOKS_BASE = '/api/v1/books'

const sanitizeParams = (params = {}) =>
  Object.entries(params).reduce((acc, [key, value]) => {
    if (value === undefined || value === null) return acc
    if (typeof value === 'string' && value.trim() === '') return acc
    if (Array.isArray(value) && value.length === 0) return acc
    acc[key] = value
    return acc
  }, {})

export const booksApi = {
  getBooks: (params = {}) =>
    axiosInstance.get(`${BOOKS_BASE}/`, { params: sanitizeParams(params) }),
  getBook: (bookId) => axiosInstance.get(`${BOOKS_BASE}/${bookId}`),
  search: (query) =>
    axiosInstance.get(`${BOOKS_BASE}/search`, { params: sanitizeParams(query) }),
  createBook: (data) => axiosInstance.post(`${BOOKS_BASE}/`, data),
  updateBook: (bookId, data) => axiosInstance.put(`${BOOKS_BASE}/${bookId}`, data),
  deleteBook: (bookId) => axiosInstance.delete(`${BOOKS_BASE}/${bookId}`),
}

export default booksApi

