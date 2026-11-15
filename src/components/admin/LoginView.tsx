import { Logo } from './Logo'
import { LoginForm2fa } from './LoginForm2fa'

/** Своя страница входа: пароль, затем — код из приложения, если включена защита */
export function LoginView({ searchParams }: { searchParams?: Record<string, string | string[] | undefined> }) {
  const r = searchParams?.redirect
  const redirect = typeof r === 'string' && r.startsWith('/') && !r.startsWith('//') ? r : '/admin'
  return (
    <div className="gb-login">
      <Logo />
      <LoginForm2fa redirect={redirect} />
    </div>
  )
}
