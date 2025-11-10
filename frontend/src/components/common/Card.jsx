import clsx from 'clsx'

const Card = ({ children, className, header, footer }) => (
  <div className={clsx('glass-panel p-6', className)}>
    {header && <div className="mb-4">{header}</div>}
    <div>{children}</div>
    {footer && <div className="mt-4">{footer}</div>}
  </div>
)

export default Card

