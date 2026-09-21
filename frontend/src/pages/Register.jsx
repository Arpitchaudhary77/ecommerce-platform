import {
  ArrowRight,
  Eye,
  EyeOff,
} from 'lucide-react';

import {
  Link,
  useNavigate,
} from 'react-router-dom';

import {
  useState,
} from 'react';

import {
  useAuth,
} from '../context/AuthContext';

export default function Register() {
  const navigate =
    useNavigate();

  const {
    register,
  } = useAuth();

  const [
    form,
    setForm,
  ] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
  });

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

  function updateField(
    field,
    value
  ) {
    setForm(
      (current) => ({
        ...current,
        [field]:
          value,
      })
    );
  }

  async function handleSubmit(
    event
  ) {
    event.preventDefault();

    setError('');
    setSubmitting(true);

    try {
      await register(
        form
      );

      navigate(
        '/account',
        { replace: true }
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
            JOIN NOVA
          </span>

          <h1>
            Create your account.
          </h1>

          <p>
            Save your details,
            manage addresses and
            keep your shopping bag
            across devices.
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

          <div className="form-two-column">
            <label>
              First name
              <input
                required
                value={
                  form.firstName
                }
                onChange={(
                  event
                ) =>
                  updateField(
                    'firstName',
                    event.target
                      .value
                  )
                }
              />
            </label>

            <label>
              Last name
              <input
                value={
                  form.lastName
                }
                onChange={(
                  event
                ) =>
                  updateField(
                    'lastName',
                    event.target
                      .value
                  )
                }
              />
            </label>
          </div>

          <label>
            Email
            <input
              type="email"
              required
              autoComplete="email"
              value={
                form.email
              }
              onChange={(
                event
              ) =>
                updateField(
                  'email',
                  event.target
                    .value
                )
              }
              placeholder="you@example.com"
            />
          </label>

          <label>
            Phone
            <input
              type="tel"
              autoComplete="tel"
              value={
                form.phone
              }
              onChange={(
                event
              ) =>
                updateField(
                  'phone',
                  event.target
                    .value
                )
              }
              placeholder="+91"
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
                minLength={8}
                autoComplete="new-password"
                value={
                  form.password
                }
                onChange={(
                  event
                ) =>
                  updateField(
                    'password',
                    event.target
                      .value
                  )
                }
                placeholder="Minimum 8 characters"
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
              ? 'Creating account...'
              : 'Create account'}

            {!submitting && (
              <ArrowRight
                size={18}
              />
            )}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account?{' '}
          <Link to="/login">
            Sign in
          </Link>
        </p>
      </section>
    </main>
  );
}
