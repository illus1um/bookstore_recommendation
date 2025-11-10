export const API_ENDPOINTS = {
  AUTH: '/api/v1/auth',
  USERS: '/api/v1/users',
  BOOKS: '/api/v1/books',
  INTERACTIONS: '/api/v1/interactions',
  RECOMMENDATIONS: '/api/v1/recommendations',
}

export const GENRES = [
  'Фантастика',
  'Детектив',
  'Роман',
  'Триллер',
  'Фэнтези',
  'Научная литература',
  'Биография',
  'История',
  'Поэзия',
  'Драма',
]

export const SORT_OPTIONS = [
  { value: 'price_asc', label: 'Цена: по возрастанию' },
  { value: 'price_desc', label: 'Цена: по убыванию' },
  { value: 'rating_desc', label: 'Рейтинг: по убыванию' },
  { value: 'rating_asc', label: 'Рейтинг: по возрастанию' },
  { value: 'newest', label: 'Новинки' },
]

export const INTERACTION_TYPES = {
  VIEW: 'view',
  LIKE: 'like',
  CART: 'cart',
  PURCHASE: 'purchase',
  REVIEW: 'review',
}

