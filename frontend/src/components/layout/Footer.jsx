import { Link } from 'react-router-dom'

const footerLinks = [
  { label: 'О нас', to: '/about' },
  { label: 'Каталог', to: '/catalog' },
  { label: 'Контакты', to: '/contacts' },
]

const Footer = () => (
  <footer className="border-t border-white/60 bg-white/70">
    <div className="container mx-auto px-4 py-10">
      <div className="grid gap-8 md:grid-cols-3">
        <div>
          <h3 className="text-lg font-semibold text-neutral-900">Bookstore Rec</h3>
          <p className="mt-3 text-sm text-neutral-500">
            Персональные рекомендации и лучшие книги от вашего любимого магазина.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-neutral-700">Навигация</h4>
          <ul className="mt-3 flex flex-col gap-2 text-sm text-neutral-500">
            {footerLinks.map((link) => (
              <li key={link.to}>
                <Link to={link.to} className="hover:text-primary">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-neutral-700">Подписка</h4>
          <p className="mt-3 text-sm text-neutral-500">
            Подпишитесь на рассылку, чтобы быть в курсе новинок и специальных предложений.
          </p>
        </div>
      </div>
      <div className="mt-8 border-t border-white/60 pt-4 text-sm text-neutral-400">
        © {new Date().getFullYear()} Bookstore Rec. Все права защищены.
      </div>
    </div>
  </footer>
)

export default Footer

