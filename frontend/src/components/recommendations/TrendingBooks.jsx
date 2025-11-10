import RecommendationCarousel from './RecommendationCarousel'
import Loading from '../common/Loading'
import ErrorMessage from '../common/ErrorMessage'
import { useTrendingBooks } from '../../hooks/useRecommendations'

const TrendingBooks = () => {
  const { data, isLoading, isError } = useTrendingBooks()

  if (isLoading) return <Loading message="Популярные книги загружаются..." />
  if (isError) return <ErrorMessage description="Не удалось загрузить популярные книги." />

  return (
    <RecommendationCarousel
      books={data}
      title="Популярные книги"
      subtitle="Самые просматриваемые и покупаемые книги на этой неделе"
    />
  )
}

export default TrendingBooks

