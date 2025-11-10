import { useQuery } from '@tanstack/react-query'
import recommendationsApi from '../api/recommendations'

export const recommendationKeys = {
  all: ['recommendations'],
  personal: () => [...recommendationKeys.all, 'personal'],
  similar: (bookId) => [...recommendationKeys.all, 'similar', bookId],
  trending: () => [...recommendationKeys.all, 'trending'],
  byGenre: (genre) => [...recommendationKeys.all, 'genre', genre],
  newest: (params) => [...recommendationKeys.all, 'new', params],
  feed: (strategy, params) => [
    ...recommendationKeys.all,
    'feed',
    strategy,
    params,
  ],
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

export const useNewBooks = (params) =>
  useQuery({
    queryKey: recommendationKeys.newest(params),
    queryFn: async () => {
      const response = await recommendationsApi.getNew(params)
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

export const useRecommendationFeed = ({
  strategy,
  params = {},
  enabled = true,
  select,
  staleTime,
}) =>
  useQuery({
    queryKey: recommendationKeys.feed(strategy, params),
    queryFn: async () => {
      const response = await recommendationsApi.getFeed({ strategy, params })
      return response.data
    },
    enabled: Boolean(strategy) && enabled,
    select,
    staleTime,
    keepPreviousData: true,
  })

