import { useMemo } from 'react'
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import booksApi from '../api/books'
import { formatPrice } from '../utils/helpers'

export const booksKeys = {
  all: ['books'],
  lists: (filters) => [...booksKeys.all, 'list', filters],
  details: (id) => [...booksKeys.all, 'detail', id],
  search: (query) => [...booksKeys.all, 'search', query],
}

export const useBookList = (filters) =>
  useQuery({
    queryKey: booksKeys.lists(filters),
    queryFn: async () => {
      const response = await booksApi.getBooks(filters)
      return response.data
    },
    keepPreviousData: true,
  })

export const useBook = (bookId) =>
  useQuery({
    queryKey: booksKeys.details(bookId),
    queryFn: async () => {
      const response = await booksApi.getBook(bookId)
      return response.data
    },
    enabled: Boolean(bookId),
  })

export const useBookSearch = (query) =>
  useQuery({
    queryKey: booksKeys.search(query),
    queryFn: async () => {
      const response = await booksApi.search(query)
      return response.data
    },
    enabled: Boolean(query?.q),
  })

export const useInfiniteBooks = (filters) =>
  useInfiniteQuery({
    queryKey: [...booksKeys.all, 'infinite', filters],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await booksApi.getBooks({
        ...filters,
        page: pageParam,
      })
      return response.data
    },
    getNextPageParam: (lastPage) => {
      if (!lastPage?.nextPage) return undefined
      return lastPage.nextPage
    },
  })

export const useBookMutations = () => {
  const queryClient = useQueryClient()

  const createMutation = useMutation({
    mutationFn: (payload) => booksApi.createBook(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: booksKeys.all })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ bookId, data }) => booksApi.updateBook(bookId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: booksKeys.details(variables.bookId) })
      queryClient.invalidateQueries({ queryKey: booksKeys.all })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (bookId) => booksApi.deleteBook(bookId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: booksKeys.all })
    },
  })

  return {
    createBook: createMutation.mutateAsync,
    updateBook: updateMutation.mutateAsync,
    deleteBook: deleteMutation.mutateAsync,
    statuses: {
      create: createMutation.status,
      update: updateMutation.status,
      delete: deleteMutation.status,
    },
  }
}

export const useFormattedBook = (book) =>
  useMemo(() => {
    if (!book) return null
    return {
      ...book,
      priceFormatted: formatPrice(book.price),
    }
  }, [book])

