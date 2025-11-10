import { Link } from 'react-router-dom'
import { BookOpen } from 'lucide-react'
import Button from '../components/common/Button'

const NotFoundPage = () => (
  <div className="flex h-[70vh] flex-col items-center justify-center gap-6 text-center">
    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
      <BookOpen className="h-8 w-8" />
    </div>
    <div className="space-y-2">
      <h1 className="text-3xl font-semibold text-neutral-900">Страница не найдена</h1>
      <p className="text-neutral-500">
        Возможно, страница была удалена или адрес указан неверно.
      </p>
    </div>
    <Button as={Link} to="/">
      Вернуться на главную
    </Button>
  </div>
)

export default NotFoundPage

