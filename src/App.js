import React, { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { collection, getDocs, getFirestore } from 'firebase/firestore';
import { app } from './firebase-config';
import MapLibreOSM from './Components/MapLibreOSM';
import Auth from './Components/Auth';
import Header from './Components/Header';
import AdminPanel from './Components/AdminPanel';
import { normalizeRestaurantDoc } from './utils/restaurantUtils';
import './App.css';

const ADMIN_EMAIL = 'sa.castanoa1@uniandes.edu.co';

function AppContent() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [restaurants, setRestaurants] = useState([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState([]);
  const [isAdminPanelVisible, setIsAdminPanelVisible] = useState(false);
  const [loadingRestaurants, setLoadingRestaurants] = useState(false);
  const auth = getAuth(app);
  const db = getFirestore(app);

  const isAdmin = userEmail === ADMIN_EMAIL;

  const loadRestaurants = useCallback(async () => {
    setLoadingRestaurants(true);
    try {
      const snapshot = await getDocs(collection(db, 'Restaurante'));
      const list = await Promise.all(
        snapshot.docs.map(async (docSnap) => {
          const base = normalizeRestaurantDoc(docSnap);
          try {
            const ratingsSnapshot = await getDocs(collection(docSnap.ref, 'ratings'));
            let total = 0;
            let count = 0;
            ratingsSnapshot.forEach((ratingDoc) => {
              const val = Number(ratingDoc.data()?.valor);
              if (Number.isFinite(val)) {
                total += val;
                count += 1;
              }
            });
            const average = count > 0 ? total / count : 0;
            return {
              ...base,
              rating: average,
              ratingCount: count,
              ratingTotal: total
            };
          } catch (error) {
            console.error('No se pudo cargar el rating del restaurante', docSnap.id, error);
            return base;
          }
        })
      );
      const validList = list.filter((restaurant) => {
        const lat = restaurant?.pos?.latitude;
        const lng = restaurant?.pos?.longitude;
        return Number.isFinite(lat) && Number.isFinite(lng);
      });

      setRestaurants(validList);
      setFilteredRestaurants(validList);
    } catch (error) {
      console.error('Error al cargar restaurantes', error);
    } finally {
      setLoadingRestaurants(false);
    }
  }, [db]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsLoggedIn(true);
        setUserEmail(user.email ?? '');
        localStorage.setItem('userEmail', user.email ?? '');
      } else {
        setIsLoggedIn(false);
        setUserEmail('');
        localStorage.removeItem('userEmail');
        setRestaurants([]);
        setFilteredRestaurants([]);
        setIsAdminPanelVisible(false);
      }
    });

    return () => unsubscribe();
  }, [auth]);

  useEffect(() => {
    if (isLoggedIn) {
      loadRestaurants();
    }
  }, [isLoggedIn, loadRestaurants]);

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleToggleAdminPanel = () => {
    setIsAdminPanelVisible((prev) => !prev);
  };

  const handleLogout = () => {
    setIsAdminPanelVisible(false);
    setRestaurants([]);
    setFilteredRestaurants([]);
  };

  const mapRestaurants = useMemo(() => filteredRestaurants, [filteredRestaurants]);

  return (
    <div className="app">
      {isLoggedIn ? (
        <>
          <Header
            restaurants={restaurants}
            setFilteredRestaurants={setFilteredRestaurants}
            userEmail={userEmail}
            onLogout={handleLogout}
            isAdmin={isAdmin}
            onToggleAdminPanel={handleToggleAdminPanel}
          />
          <main className="app__map">
            {loadingRestaurants ? (
              <div className="app__loader">Cargando restaurantes...</div>
            ) : (
              <MapLibreOSM
                lugares={mapRestaurants}
                reloadRestaurants={loadRestaurants}
              />
            )}
          </main>
          {isAdmin && isAdminPanelVisible && (
            <AdminPanel
              restaurants={restaurants}
              reloadRestaurants={loadRestaurants}
            />
          )}
        </>
      ) : (
        <div className="app__auth">
          <Auth onLogin={handleLogin} />
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={'Cargando aplicacion...'}>
      <AppContent />
    </Suspense>
  );
}
