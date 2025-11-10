import { AlertTriangle } from 'lucide-react'
import clsx from 'clsx'

const ErrorMessage = ({
  title = 'Произошла ошибка',
  description = 'Попробуйте обновить страницу или повторите попытку позже.',
  action,
  className,
}) => (
  <div
    className={clsx(
      'rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-red-700',
      className,
    )}
  >
    <div className="flex items-center gap-3">
      <AlertTriangle className="h-5 w-5" />
      <div>
        <p className="font-medium">{title}</p>
        {description && <p className="text-sm text-red-600">{description}</p>}
      </div>
    </div>
    {action && <div className="mt-3">{action}</div>}
  </div>
)

export default ErrorMessage

