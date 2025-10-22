import React from 'react';
import './Header.css';
import logo from '../3.png';
import { getAuth, signOut } from 'firebase/auth';
import { app } from '../firebase-config';

const Header = ({
  userEmail,
  isAdmin,
  onLogout,
  onToggleAdminPanel,
  onToggleFilters
}) => {
  const auth = getAuth(app);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error al cerrar sesion', error);
    } finally {
      localStorage.removeItem('userEmail');
      onLogout?.();
    }
  };

  return (
    <header className="topbar">
      <button
        className="topbar__filters"
        type="button"
        onClick={onToggleFilters}
      >
        Filtros
      </button>

      <div className="topbar__brand">
        <img className="topbar__logo" src={logo} alt="AndesEats" />
        <div className="topbar__brand-text">
          <span className="topbar__brand-name">AndesEats</span>
          <span className="topbar__brand-tagline">
            Explora los mejores sabores cerca de la U
          </span>
        </div>
      </div>

      <div className="topbar__actions">
        <span className="topbar__email" title={userEmail}>
          {userEmail}
        </span>
        {isAdmin && (
          <button
            type="button"
            className="topbar__button"
            onClick={onToggleAdminPanel}
          >
            Panel admin
          </button>
        )}
        <button
          type="button"
          className="topbar__button topbar__button--primary"
          onClick={handleLogout}
        >
          Cerrar sesi&oacute;n
        </button>
      </div>
    </header>
  );
};

export default Header;
