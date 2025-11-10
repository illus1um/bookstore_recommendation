import { Loader2 } from 'lucide-react'
import clsx from 'clsx'

const Loading = ({ message = 'Загрузка...', className }) => (
  <div
    className={clsx(
      'flex min-h-[150px] flex-col items-center justify-center gap-2 text-neutral-500',
      className,
    )}
  >
    <Loader2 className="h-6 w-6 animate-spin text-primary" />
    <span className="text-sm">{message}</span>
  </div>
)

export default Loading

