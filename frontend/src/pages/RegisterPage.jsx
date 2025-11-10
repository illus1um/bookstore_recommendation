import RegisterForm from '../components/auth/RegisterForm'
import Card from '../components/common/Card'

const RegisterPage = () => (
  <div className="flex min-h-[calc(100vh-160px)] items-center justify-center bg-neutral-50 px-4 py-12">
    <div className="w-full max-w-2xl">
      <Card
        header={
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900">
              Создать аккаунт
            </h1>
            <p className="text-sm text-neutral-500">
              Заполните форму, чтобы получить доступ к персонализированным рекомендациям.
            </p>
          </div>
        }
      >
        <RegisterForm />
      </Card>
    </div>
  </div>
)

export default RegisterPage

