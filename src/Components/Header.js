import React, { useEffect, useState } from 'react';
import './Header.css';
import logo from '../3.png';
import { getAuth, signOut } from 'firebase/auth';
import { app } from '../firebase-config';

const Header = ({
  restaurants,
  setFilteredRestaurants,
  userEmail,
  onLogout,
  isAdmin,
  onToggleAdminPanel
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const auth = getAuth(app);

  useEffect(() => {
    if (Array.isArray(restaurants)) {
      setFilteredRestaurants(restaurants);
    }
  }, [restaurants, setFilteredRestaurants]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error al cerrar sesion', error);
    } finally {
      localStorage.removeItem('userEmail');
      setIsMenuOpen(false);
      onLogout?.();
      setFilteredRestaurants(restaurants);
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen((prev) => !prev);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const filterByVegetariano = () => {
    const filtered = restaurants.filter((item) =>
      Boolean(item.vegetariano ?? item.menuVegetariano)
    );
    setFilteredRestaurants(filtered);
    closeMenu();
  };

  const filterByDomicilios = () => {
    const filtered = restaurants.filter((item) =>
      Boolean(item.domicilios ?? item.domicilio)
    );
    setFilteredRestaurants(filtered);
    closeMenu();
  };

  const filterByDescuento = () => {
    const filtered = restaurants.filter((item) =>
      Boolean(item.tiquetera ?? item.ticketera ?? item.descuento)
    );
    setFilteredRestaurants(filtered);
    closeMenu();
  };

  const resetFilters = () => {
    setFilteredRestaurants(restaurants);
    closeMenu();
  };

  const handleAdminClick = () => {
    closeMenu();
    onToggleAdminPanel?.();
  };

  return (
    <>
      <header className="header">
        <div className="header-content">
          <button className="hamburger-menu" onClick={toggleMenu}>
            &#9776;
          </button>
          <div className="logo-container" onClick={resetFilters}>
            <img className="LogoHeader" src={logo} alt="Logo" />
          </div>
        </div>
      </header>

      <nav className={`nav ${isMenuOpen ? 'open' : ''}`}>
        <button className="close-menu" onClick={closeMenu}>
          &times;
        </button>
        <ul className="nav-list">
          <li className="nav-item">
            <button className="nav-link" onClick={filterByVegetariano}>
              Vegetariano
            </button>
          </li>
          <li className="nav-item">
            <button className="nav-link" onClick={filterByDomicilios}>
              Domicilios
            </button>
          </li>
          <li className="nav-item">
            <button className="nav-link" onClick={filterByDescuento}>
              Descuentos
            </button>
          </li>
          <li className="nav-item">
            <button className="nav-link reset-button" onClick={resetFilters}>
              Quitar filtros
            </button>
          </li>
        </ul>
        <div className="profile-section">
          <p className="user-email">{userEmail}</p>
          {isAdmin && (
            <button className="logout-button" onClick={handleAdminClick}>
              Panel admin
            </button>
          )}
          <button className="logout-button" onClick={handleLogout}>
            Cerrar sesion
          </button>
        </div>
      </nav>
    </>
  );
};

export default Header;
