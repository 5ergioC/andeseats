import React, { useEffect, useState } from 'react';
import './Header.css';
import logo from '../3.png';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { app } from '../firebase-config';

const Header = ({ setFilteredRestaurants }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [restaurants, setRestaurants] = useState([]);

  const toBoolean = (value) => {
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      return normalized === 'true' || normalized === '1' || normalized === 'si';
    }

    if (typeof value === 'number') {
      return value === 1;
    }

    return Boolean(value);
  };

  const normalizeRestaurantDoc = (doc) => {
    const data = doc.data() ?? {};
    const rawLatitude =
      data?.pos?.latitude ??
      data?.pos?.lat ??
      data?.latitude ??
      data?.lat ??
      data?.latitud ??
      data?.Latitud;
    const rawLongitude =
      data?.pos?.longitude ??
      data?.pos?.lng ??
      data?.longitude ??
      data?.lng ??
      data?.longitud ??
      data?.Longitud;

    const latitude = Number(rawLatitude);
    const longitude = Number(rawLongitude);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      console.warn('Restaurante sin coordenadas validas, se omite:', doc.id, data);
      return null;
    }

    return {
      id: doc.id,
      ...data,
      pos: {
        latitude,
        longitude
      }
    };
  };

  useEffect(() => {
    const fetchRestaurants = async () => {
      const db = getFirestore(app);
      const restaurantesCollection = collection(db, 'Restaurante');
      const restaurantesSnapshot = await getDocs(restaurantesCollection);
      const restaurantesList = restaurantesSnapshot.docs
        .map(normalizeRestaurantDoc)
        .filter(Boolean);

      setRestaurants(restaurantesList);
      setFilteredRestaurants(restaurantesList);
    };

    fetchRestaurants();

    const email = localStorage.getItem('userEmail'); // Obtener el correo del usuario
    if (email) {
      setUserEmail(email);
    }
  }, [setFilteredRestaurants]);

  const handleLogout = () => {
    localStorage.removeItem('userEmail'); // Eliminar el email del localStorage
    window.location.reload(); // Recargar la página para volver al estado inicial
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  // Funciones de filtrado que cierran el menú
  const filterByVegetariano = () => {
    const filtered = restaurants.filter(item =>
      toBoolean(item.menuVegetariano ?? item.menu_vegetariano)
    );
    setFilteredRestaurants(filtered);
    closeMenu();
  };

  const filterByDomicilios = () => {
    const filtered = restaurants.filter(item =>
      toBoolean(item.domicilios ?? item.domicilio)
    );
    setFilteredRestaurants(filtered);
    closeMenu();
  };

  const filterByDescuento = () => {
    const filtered = restaurants.filter(item =>
      toBoolean(item.descuento ?? item.ticketera ?? item.tiquetera)
    );
    setFilteredRestaurants(filtered);
    closeMenu();
  };

  const resetFilters = () => {
    setFilteredRestaurants(restaurants);
    closeMenu();
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
        <button className="close-menu" onClick={closeMenu}>×</button>
        <ul className="nav-list">
          <li className="nav-item">
            <button className="nav-link" onClick={filterByVegetariano}>Vegetariano</button>
          </li>
          <li className="nav-item">
            <button className="nav-link" onClick={filterByDomicilios}>Domicilios</button>
          </li>
          <li className="nav-item">
            <button className="nav-link" onClick={filterByDescuento}>Descuentos</button>
          </li>
          <li className="nav-item">
            <button className="nav-link reset-button" onClick={resetFilters}>Quitar Filtros</button>
          </li>
        </ul>
        <div className="profile-section">
          <p className="user-email">{userEmail}</p>
          <button className="logout-button" onClick={handleLogout}>
            Cerrar sesión
          </button>
        </div>
      </nav>
    </>
  );
};

export default Header;
