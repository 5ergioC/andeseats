import React, { useState } from 'react';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import { app } from '../firebase-config';
import './Auth.css'; // Importamos los estilos
import logo from '../3.png'; // Ajusta la ruta a tu logo

const Auth = ({ onLogin }) => {
  const auth = getAuth(app); // Obtenemos la instancia de auth

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isRegistering, setIsRegistering] = useState(false); // Estado para alternar entre login y registro

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      localStorage.setItem('userEmail', email); // Guardamos el email en localStorage
      onLogin(); // Notificamos que el usuario ha iniciado sesión
    } catch (err) {
      setError('Error: Verifica tus credenciales');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      localStorage.setItem('userEmail', email); // Guardamos el email en localStorage
      onLogin(); // Notificamos que el usuario ha creado la cuenta e inició sesión
    } catch (err) {
      setError('Error: No se pudo crear la cuenta');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <img src={logo} alt="AndesEats Logo" className="auth-logo" />
        <p className="auth-description">
          AndesEats es una plataforma dedicada a ofrecer recomendaciones de restaurantes 
          que se ajustan al presupuesto de los estudiantes de la Universidad 
          de los Andes.
        </p>
        
        {error && <p className="error">{error}</p>}
        <form onSubmit={isRegistering ? handleRegister : handleLogin}>
          <div className="input-group">
            <label htmlFor="email">Correo electrónico</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <label htmlFor="password">Contraseña</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="login-button">
            {isRegistering ? 'Registrarse' : 'Iniciar sesión'}
          </button>
        </form>
        <button
          className="toggle-button"
          onClick={() => setIsRegistering(!isRegistering)}
        >
          {isRegistering
            ? '¿Ya tienes una cuenta? Inicia sesión'
            : '¿No tienes cuenta? Regístrate'}
        </button>
      </div>
    </div>
  );
};

export default Auth;
