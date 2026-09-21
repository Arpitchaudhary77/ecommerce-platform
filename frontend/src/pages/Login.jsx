import {
  ArrowRight,
  Eye,
  EyeOff,
} from 'lucide-react';

import {
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from 'react-router-dom';

import {
  useState,
} from 'react';

import {
  useAuth,
} from '../context/AuthContext';

export default function Login() {
  const navigate =
    useNavigate();

  const location =
    useLocation();

  const [
    searchParams,
  ] = useSearchParams();

  const {
    login,
  } = useAuth();

  const [
    email,
    setEmail,
  ] = useState('');

  const [
    password,
    setPassword,
  ] = useState('');

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState('');

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  async function handleSubmit(
    event
  ) {
    event.preventDefault();

    setError('');
    setSubmitting(true);

    try {
      await login({
        email,
        password,
      });

      const next =
        searchParams.get(
          'next'
        ) || '/account';

      navigate(
        next,
        {
          replace: true,
          state: {
            from:
              location.pathname,
          },
        }
      );
    } catch (err) {
      setError(
        err.message
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-page container">
      <section className="auth-card">
        <div className="auth-intro">
          <span className="eyebrow">
            WELCOME BACK
          </span>

          <h1>
            Sign in to NOVA.
          </h1>

          <p>
            Access your orders,
            addresses and saved
            shopping bag.
          </p>
        </div>

        <form
          className="auth-form"
          onSubmit={
            handleSubmit
          }
        >
          {error && (
            <div className="form-error">
              {error}
            </div>
          )}

          <label>
            Email
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) =>
                setEmail(
                  event.target.value
                )
              }
              placeholder="you@example.com"
            />
          </label>

          <label>
            Password

            <div className="password-input">
              <input
                type={
                  showPassword
                    ? 'text'
                    : 'password'
                }
                required
                autoComplete="current-password"
                value={password}
                onChange={(event) =>
                  setPassword(
                    event.target.value
                  )
                }
                placeholder="Enter your password"
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword(
                    (value) =>
                      !value
                  )
                }
                aria-label="Toggle password visibility"
              >
                {showPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>
          </label>

          <button
            className="primary-button auth-submit"
            disabled={
              submitting
            }
          >
            {submitting
              ? 'Signing in...'
              : 'Sign in'}

            {!submitting && (
              <ArrowRight
                size={18}
              />
            )}
          </button>
        </form>

        <p className="auth-switch">
          New to NOVA?{' '}
          <Link to="/register">
            Create an account
          </Link>
        </p>
      </section>
    </main>
  );
}
