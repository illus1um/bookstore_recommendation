import dayjs from 'dayjs'

export const formatPrice = (value) =>
  new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
  }).format(value || 0)

export const formatDate = (value) =>
  dayjs(value).isValid() ? dayjs(value).format('DD.MM.YYYY') : ''

export const getInitials = (name = '') =>
  name
    .split(' ')
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase()

export const debounce = (fn, delay = 300) => {
  let timeout
  return (...args) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => {
      fn(...args)
    }, delay)
  }
}

