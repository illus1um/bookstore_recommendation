import { useQuery } from '@tanstack/react-query'
import recommendationsApi from '../api/recommendations'

export const recommendationKeys = {
  all: ['recommendations'],
  personal: () => [...recommendationKeys.all, 'personal'],
  similar: (bookId) => [...recommendationKeys.all, 'similar', bookId],
  trending: () => [...recommendationKeys.all, 'trending'],
  byGenre: (genre) => [...recommendationKeys.all, 'genre', genre],
}

export const usePersonalRecommendations = (enabled) =>
  useQuery({
    queryKey: recommendationKeys.personal(),
    queryFn: async () => {
      const response = await recommendationsApi.getForYou()
      return response.data
    },
    enabled,
  })

export const useSimilarBooks = (bookId) =>
  useQuery({
    queryKey: recommendationKeys.similar(bookId),
    queryFn: async () => {
      const response = await recommendationsApi.getSimilar(bookId)
      return response.data
    },
    enabled: Boolean(bookId),
  })

export const useTrendingBooks = () =>
  useQuery({
    queryKey: recommendationKeys.trending(),
    queryFn: async () => {
      const response = await recommendationsApi.getTrending()
      return response.data
    },
  })

export const useGenreRecommendations = (genre) =>
  useQuery({
    queryKey: recommendationKeys.byGenre(genre),
    queryFn: async () => {
      const response = await recommendationsApi.getByGenre(genre)
      return response.data
    },
    enabled: Boolean(genre),
  })

