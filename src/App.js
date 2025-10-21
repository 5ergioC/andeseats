import React, { Suspense, useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { app } from './firebase-config';
import MapLibreOSM from './Components/MapLibreOSM';
import Auth from './Components/Auth';
import Header from './Components/Header';

function AppContent() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [filteredRestaurants, setFilteredRestaurants] = useState([]);
  const auth = getAuth(app);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(!!user);
    });

    return () => unsubscribe();
  }, [auth]);

  const lugares = [
    {
      id: '1',
      tipoComida: 'pizza',
      direccion: 'Cra. 3 #18 - 57 L S 101',
      nombre: 'Taglios',
      descripcion: 'Se venden porciones de pizza en 20 sabores diferentes. TambiAcn se ofrecen hamburguesas, perros calientes, salchipapas y lasaA�as. Todos los productos se preparan en el momento con ingredientes frescos.',
      pos: { latitude: 4.6029, longitude: -74.0684 },
      precio: '10k - 30k',
      domicilios: false,
      menuVegetariano: true,
      tiquetera: false,
      contacto: '601 305 6942',
      horaCierre: '10:00 PM',
      horaApertura: '12:00 PM',
    },
    {
      id: '2',
      tipoComida: 'PanaderA-a',
      direccion: 'Cra. 1 #20a-5',
      nombre: 'PanaderA-a doA�a Blanca',
      descripcion: 'Panaderia que vende variedad de platos, puedes encontrar desayunos y almuerzos. Es rico en general.',
      pos: { latitude: 4.6033, longitude: -74.0663 },
      domicilios: false,
      horaCierre: '8:00 PM',
      horaApertura: '07:00 AM',
    },
    {
      id: '3',
      tipoComida: 'hamburguesas',
      direccion: 'Calle 21 #1-43',
      nombre: 'Chick n Chips',
      descripcion: 'Comida rapida, nuggets con papas a la francesa, la gaseosa viene debajo de los nuggets y papas, como un cono, por lo que es facil de llevar a cualquier lugar y consumir.',
      pos: { latitude: 4.6042, longitude: -74.0665 },
      precio: '15,4k - 25k',
      domicilios: false,
      menuVegetariano: false,
      tiquetera: true,
      contacto: '321 402 7520',
      horaCierre: '6:00 PM',
      horaApertura: '11:30 AM',
    },
    {
      id: '4',
      tipoComida: 'Sushi',
      direccion: 'Calle 20 # 2a-26',
      nombre: 'Yamato',
      descripcion: 'Restaurante de comida asiA�tica con opciones para todos los gustos. Cuenta con dos cartas diferentes, lo que permite variar en cada visita y descubrir nuevos sabores. Cada una maneja precios distintos, y hay opciones desde valores muy accesibles. Ideal para quienes quieren disfrutar de la cocina asiA�tica sin gastar de mA�s.',
      pos: { latitude: 4.6035, longitude: -74.06665 },
      precio: '12,9k - 120k',
      domicilios: true,
      menuVegetariano: true,
      tiquetera: false,
      contacto: '313 573 6767',
      horaCierre: '21:30 PM',
      horaApertura: '11:00 AM',
    },
  ];

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  return (
    <div>
      {isLoggedIn ? (
        <div className="app">
          <Header setFilteredRestaurants={setFilteredRestaurants} />
          <MapLibreOSM lugares={filteredRestaurants.length > 0 ? filteredRestaurants : lugares} />
        </div>
      ) : (
        <Auth onLogin={handleLogin} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={"Cargando aplicaciA3n..."}>
      <AppContent />
    </Suspense>
  );
}
