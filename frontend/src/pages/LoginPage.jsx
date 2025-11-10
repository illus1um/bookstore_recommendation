import LoginForm from '../components/auth/LoginForm'
import Card from '../components/common/Card'

const LoginPage = () => (
  <div className="flex min-h-[calc(100vh-160px)] items-center justify-center bg-neutral-50 px-4 py-12">
    <div className="w-full max-w-md">
      <Card
        header={
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900">Вход</h1>
            <p className="text-sm text-neutral-500">
              Войдите, чтобы получать персональные рекомендации и управлять покупками.
            </p>
          </div>
        }
      >
        <LoginForm />
      </Card>
    </div>
  </div>
)

export default LoginPage

