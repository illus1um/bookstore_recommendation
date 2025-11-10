import RecommendationCarousel from './RecommendationCarousel'
import Loading from '../common/Loading'
import ErrorMessage from '../common/ErrorMessage'
import { useSimilarBooks } from '../../hooks/useRecommendations'

const SimilarBooks = ({ bookId }) => {
  const { data, isLoading, isError } = useSimilarBooks(bookId)

  if (isLoading) return <Loading message="Загружаем похожие книги..." />
  if (isError) return <ErrorMessage description="Не удалось получить похожие книги." />

  return (
    <RecommendationCarousel
      books={data}
      title="Похожие книги"
      subtitle="Читатели, которым понравилась эта книга, также выбирают"
    />
  )
}

export default SimilarBooks

