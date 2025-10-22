import React, { useMemo, useState } from 'react';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { app } from '../firebase-config';
import CircularText from './CircularText';
import CountUp from './CountUp';
import './Auth.css';
import logo from '../3.png';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN_LENGTH = 8;
const CIRCULAR_TEXT = 'ANDESEATS * SABOR QUE CONECTA * ';

const Auth = ({ onLogin }) => {
  const auth = getAuth(app);
  const [mode, setMode] = useState('login');
  const [formValues, setFormValues] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState('');

  const metrics = useMemo(
    () => [
      { label: 'Restaurantes locales', value: 14, suffix: '+' },
      { label: 'Categorías al detalle', value: 6 },
      { label: 'Estudiantes satisfechos', value: 320, suffix: '+' }
    ],
    []
  );

  const handleModeChange = (nextMode) => {
    if (submitting || mode === nextMode) return;
    setMode(nextMode);
    setFeedback('');
    setFormErrors({});
    setFormValues((prev) => ({
      email: prev.email,
      password: '',
      confirmPassword: ''
    }));
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const errors = {};
    const { email, password, confirmPassword } = formValues;

    if (!EMAIL_REGEX.test(email.trim())) {
      errors.email = 'Ingresa un correo electrónico válido.';
    }

    if (!password || password.length < PASSWORD_MIN_LENGTH) {
      errors.password = `La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres.`;
    }

    if (mode === 'register') {
      if (!confirmPassword) {
        errors.confirmPassword = 'Confirma tu contraseña.';
      } else if (confirmPassword !== password) {
        errors.confirmPassword = 'Las contraseñas no coinciden.';
      }
    }

    return errors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const errors = validate();

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setFeedback('');
      return;
    }

    setSubmitting(true);
    setFeedback('');

    const email = formValues.email.trim();
    const password = formValues.password;

    try {
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }

      localStorage.setItem('userEmail', email);
      onLogin();
    } catch (error) {
      let message =
        mode === 'login'
          ? 'No pudimos iniciar sesión. Revisa tus credenciales o inténtalo más tarde.'
          : 'No pudimos crear tu cuenta. Verifica los datos o inténtalo más tarde.';

      if (error.code === 'auth/email-already-in-use') {
        message = 'Este correo ya tiene una cuenta activa.';
      } else if (error.code === 'auth/invalid-credential') {
        message = 'Correo o contraseña incorrectos.';
      } else if (error.code === 'auth/network-request-failed') {
        message = 'Problema de conexión. Revisa tu red e inténtalo de nuevo.';
      }

      setFeedback(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-landing">
      <section className="auth-hero">
        <div className="auth-hero__badge">
          <CircularText
            text={CIRCULAR_TEXT}
            spinDuration={18}
            size="clamp(320px, 58vw, 480px)"
          />
          <img src={logo} alt="AndesEats" className="auth-hero__logo" />
        </div>
        <div className="auth-hero__content">
          <p className="auth-hero__eyebrow">Descubre, comparte, disfruta</p>
          <h1 className="auth-hero__title">
            Encuentra los sabores que conectan a la comunidad uniandina.
          </h1>
          <p className="auth-hero__description">
            En AndesEats reunimos recomendaciones honestas, precios para estudiantes y
            experiencias reales alrededor del campus. Explora por tipo de comida,
            beneficios y reseñas verificadas.
          </p>
          <div className="auth-stats">
            {metrics.map((metric) => (
              <article key={metric.label} className="auth-stat">
                <div className="auth-stat__figure">
                  <CountUp
                    to={metric.value}
                    duration={2}
                    className="auth-stat__number"
                    separator="."
                  />
                  {metric.suffix ? (
                    <span className="auth-stat__suffix">{metric.suffix}</span>
                  ) : null}
                </div>
                <p className="auth-stat__label">{metric.label}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="auth-panel">
        <header className="auth-panel__header">
          <nav className="auth-tabs" aria-label="Acciones de autenticación">
            <button
              type="button"
              className={`auth-tab ${mode === 'login' ? 'is-active' : ''}`}
              onClick={() => handleModeChange('login')}
            >
              Iniciar sesión
            </button>
            <button
              type="button"
              className={`auth-tab ${mode === 'register' ? 'is-active' : ''}`}
              onClick={() => handleModeChange('register')}
            >
              Crear cuenta
            </button>
          </nav>
          <p className="auth-panel__subtitle">
            {mode === 'login'
              ? 'Bienvenido de vuelta. Ingresa tus credenciales para continuar.'
              : 'Crea una cuenta para guardar tus lugares favoritos y dejar reseñas.'}
          </p>
        </header>

        {feedback && <p className="auth-panel__feedback">{feedback}</p>}

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="auth-field">
            <label htmlFor="email">Correo electrónico</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="tu@correo.com"
              autoComplete="email"
              value={formValues.email}
              onChange={handleChange}
              aria-invalid={Boolean(formErrors.email)}
              disabled={submitting}
              required
            />
            {formErrors.email && (
              <span className="auth-field__error">{formErrors.email}</span>
            )}
          </div>

          <div className="auth-field">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="Mínimo 8 caracteres"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              value={formValues.password}
              onChange={handleChange}
              aria-invalid={Boolean(formErrors.password)}
              disabled={submitting}
              required
            />
            {formErrors.password ? (
              <span className="auth-field__error">{formErrors.password}</span>
            ) : (
              <span className="auth-field__hint">
                Debe incluir al menos {PASSWORD_MIN_LENGTH} caracteres.
              </span>
            )}
          </div>

          {mode === 'register' && (
            <div className="auth-field">
              <label htmlFor="confirmPassword">Confirmar contraseña</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Repite tu contraseña"
                autoComplete="new-password"
                value={formValues.confirmPassword}
                onChange={handleChange}
                aria-invalid={Boolean(formErrors.confirmPassword)}
                disabled={submitting}
                required
              />
              {formErrors.confirmPassword && (
                <span className="auth-field__error">{formErrors.confirmPassword}</span>
              )}
            </div>
          )}

          <button type="submit" className="auth-submit" disabled={submitting}>
            {submitting
              ? 'Procesando…'
              : mode === 'login'
              ? 'Entrar a AndesEats'
              : 'Crear cuenta'}
          </button>
        </form>

        <footer className="auth-panel__footer">
          <h3>¿Por qué registrarte?</h3>
          <ul>
            <li>Guarda restaurantes favoritos y filtra por tus preferencias.</li>
            <li>Comparte reseñas verificadas con la comunidad universitaria.</li>
            <li>Recibe alertas de promociones y menús actualizados.</li>
          </ul>
        </footer>
      </section>
    </div>
  );
};

export default Auth;
