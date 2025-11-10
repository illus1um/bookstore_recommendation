import clsx from 'clsx'

export const Input = ({
  label,
  error,
  helperText,
  className,
  leftAddon,
  rightAddon,
  ...props
}) => (
  <div className={clsx('flex flex-col gap-1', className)}>
    {label && (
      <label className="text-sm font-medium text-neutral-700">
        {label}
      </label>
    )}
    <div className="flex items-center rounded-lg border border-neutral-200 bg-white focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition">
      {leftAddon && <span className="pl-3 text-neutral-400">{leftAddon}</span>}
      <input
        className="w-full border-none bg-transparent px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
        {...props}
      />
      {rightAddon && <span className="pr-3 text-neutral-400">{rightAddon}</span>}
    </div>
    {error && <p className="text-xs text-red-500">{error}</p>}
    {helperText && !error && <p className="text-xs text-neutral-500">{helperText}</p>}
  </div>
)

export default Input

