import clsx from 'clsx'

const baseStyles =
  'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60 disabled:cursor-not-allowed'

const variants = {
  primary:
    'bg-primary text-white hover:bg-primary-700 focus-visible:outline-primary shadow-sm',
  secondary:
    'bg-white text-primary border border-primary hover:bg-primary-50 focus-visible:outline-primary',
  ghost:
    'bg-transparent text-primary hover:bg-primary-50 focus-visible:outline-primary',
}

const sizes = {
  sm: 'px-3 py-2 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
}

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className,
  leftIcon,
  rightIcon,
  as: Component = 'button',
  disabled,
  ...props
}) => (
  <Component
    className={clsx(baseStyles, variants[variant], sizes[size], className)}
    disabled={Component === 'button' ? isLoading || disabled : undefined}
    {...props}
  >
    {leftIcon && <span className="mr-2">{leftIcon}</span>}
    {isLoading ? 'Загрузка...' : children}
    {rightIcon && <span className="ml-2">{rightIcon}</span>}
  </Component>
)

export default Button

