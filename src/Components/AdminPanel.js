import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  GeoPoint,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getFirestore,
  updateDoc
} from 'firebase/firestore';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { app } from '../firebase-config';
import './AdminPanel.css';

const emptyForm = {
  nombre: '',
  descripcion: '',
  direccion: '',
  contacto: '',
  horaApertura: '',
  horaCierre: '',
  precio: '',
  domicilios: false,
  tiquetera: false,
  vegetariano: false,
  tipoComida1: '',
  tipoComida2: '',
  tipoComida3: '',
  latitude: '',
  longitude: ''
};

const DEFAULT_CENTER = { lng: -74.066, lat: 4.603 };
const DEFAULT_ZOOM = 16;

const mapStyle = {
  version: 8,
  sources: {
    'osm-raster-tiles': {
      type: 'raster',
      tiles: ['https://a.tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution:
        'OpenStreetMap contributors'
    }
  },
  layers: [
    {
      id: 'osm-tiles',
      type: 'raster',
      source: 'osm-raster-tiles',
      minzoom: 0,
      maxzoom: 22
    }
  ]
};

const formatCoordinate = (value) =>
  value === undefined || value === null || value === ''
    ? ''
    : String(value);

const parseCoordinate = (value) => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
};

const AdminPanel = ({ restaurants, reloadRestaurants }) => {
  const db = getFirestore(app);
  const [selectedId, setSelectedId] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [statusMessage, setStatusMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  const sortedRestaurants = useMemo(() => {
    return [...restaurants].sort((a, b) =>
      (a?.nombre ?? '').localeCompare(b?.nombre ?? '', 'es', {
        sensitivity: 'base'
      })
    );
  }, [restaurants]);

  const resetForm = (nextId = '') => {
    setSelectedId(nextId);
    setForm({ ...emptyForm });
    setStatusMessage('');
  };

  const fillFormFromRestaurant = (restaurant) => {
    if (!restaurant) {
      resetForm();
      return;
    }

    const tipos = Array.isArray(restaurant.tipoComida)
      ? restaurant.tipoComida.filter(Boolean)
      : [];

    setForm({
      nombre: restaurant.nombre ?? '',
      descripcion: restaurant.descripcion ?? '',
      direccion: restaurant.direccion ?? '',
      contacto: restaurant.contacto ?? '',
      horaApertura: restaurant.horaApertura ?? '',
      horaCierre: restaurant.horaCierre ?? '',
      precio: restaurant.precio ?? '',
      domicilios: Boolean(restaurant.domicilios),
      tiquetera: Boolean(restaurant.tiquetera),
      vegetariano: Boolean(
        restaurant.vegetariano ?? restaurant.menuVegetariano
      ),
      tipoComida1: tipos[0] ?? '',
      tipoComida2: tipos[1] ?? '',
      tipoComida3: tipos[2] ?? '',
      latitude: formatCoordinate(restaurant?.pos?.latitude),
      longitude: formatCoordinate(restaurant?.pos?.longitude)
    });
  };

  useEffect(() => {
    if (!selectedId) {
      return;
    }

    const restaurant = restaurants.find((item) => item.id === selectedId);
    if (restaurant) {
      fillFormFromRestaurant(restaurant);
    }
  }, [restaurants, selectedId]);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) {
      return;
    }

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: mapStyle,
      center: [DEFAULT_CENTER.lng, DEFAULT_CENTER.lat],
      zoom: DEFAULT_ZOOM,
      attributionControl: false
    });

    mapRef.current = map;

    map.addControl(new maplibregl.NavigationControl(), 'top-right');

    const handleClick = (event) => {
      const { lng, lat } = event.lngLat;
      setForm((prev) => ({
        ...prev,
        latitude: lat.toFixed(6),
        longitude: lng.toFixed(6)
      }));
      setStatusMessage('');
    };

    map.on('click', handleClick);

    return () => {
      map.off('click', handleClick);
      map.remove();
      mapRef.current = null;
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current) {
      return;
    }

    const lat = parseCoordinate(form.latitude);
    const lng = parseCoordinate(form.longitude);

    if (lat === null || lng === null) {
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
      mapRef.current.easeTo({
        center: [DEFAULT_CENTER.lng, DEFAULT_CENTER.lat],
        zoom: DEFAULT_ZOOM,
        duration: 600
      });
      return;
    }

    if (!markerRef.current) {
      const marker = new maplibregl.Marker({
        color: '#f15a24',
        draggable: true
      })
        .setLngLat([lng, lat])
        .addTo(mapRef.current);

      marker.on('dragend', () => {
        const position = marker.getLngLat();
        setForm((prev) => ({
          ...prev,
          latitude: position.lat.toFixed(6),
          longitude: position.lng.toFixed(6)
        }));
      });

      markerRef.current = marker;
    } else {
      markerRef.current.setLngLat([lng, lat]);
    }

    mapRef.current.easeTo({
      center: [lng, lat],
      zoom: DEFAULT_ZOOM,
      duration: 600
    });
  }, [form.latitude, form.longitude]);

  const handleSelectRestaurant = (event) => {
    const id = event.target.value;
    setSelectedId(id);
    setStatusMessage('');

    if (!id) {
      resetForm();
      return;
    }

    const restaurant = restaurants.find((item) => item.id === id);
    fillFormFromRestaurant(restaurant);
  };

  const handleChange = (event) => {
    const { name, type, value, checked } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const buildPayload = () => {
    const latitude = parseCoordinate(form.latitude);
    const longitude = parseCoordinate(form.longitude);
    const tipos = [form.tipoComida1, form.tipoComida2, form.tipoComida3]
      .map((value) => (value ?? '').trim())
      .filter(Boolean);

    if (tipos.length === 0) {
      throw new Error('Ingresa al menos un tipo de comida.');
    }

    if (latitude === null || longitude === null) {
      throw new Error('Ingresa una latitud y longitud validas.');
    }

    return {
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim(),
      direccion: form.direccion.trim(),
      contacto: form.contacto.trim(),
      horaApertura: form.horaApertura.trim(),
      horaCierre: form.horaCierre.trim(),
      precio: form.precio.trim(),
      domicilios: Boolean(form.domicilios),
      tiquetera: Boolean(form.tiquetera),
      vegetariano: Boolean(form.vegetariano),
      tipoComida: tipos,
      pos: new GeoPoint(latitude, longitude)
    };
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatusMessage('');

    try {
      const payload = buildPayload();
      setIsSubmitting(true);

      if (selectedId) {
        await updateDoc(doc(db, 'Restaurante', selectedId), payload);
        setStatusMessage('Restaurante actualizado con exito.');
        fillFormFromRestaurant({
          ...payload,
          pos: { latitude: payload.pos.latitude, longitude: payload.pos.longitude }
        });
      } else {
        await addDoc(collection(db, 'Restaurante'), payload);
        setStatusMessage('Restaurante creado con exito.');
        resetForm();
      }

      await reloadRestaurants();
    } catch (error) {
      console.error('Error al guardar restaurante', error);
      setStatusMessage(error.message || 'No se pudo guardar el restaurante.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedId) {
      return;
    }

    const confirmDelete =
      typeof window !== 'undefined'
        ? window.confirm('Seguro que deseas eliminar este restaurante?')
        : true;

    if (!confirmDelete) {
      return;
    }

    setStatusMessage('');
    setIsSubmitting(true);

    try {
      await deleteDoc(doc(db, 'Restaurante', selectedId));
      setStatusMessage('Restaurante eliminado.');
      resetForm();
      await reloadRestaurants();
    } catch (error) {
      console.error('Error al eliminar restaurante', error);
      setStatusMessage('No se pudo eliminar el restaurante.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="admin-panel">
      <h2>Panel de administracion</h2>
      <div className="admin-panel__content">
        <div className="admin-panel__selector">
          <label htmlFor="admin-restaurant-select">
            Selecciona un restaurante:
          </label>
          <select
            id="admin-restaurant-select"
            value={selectedId}
            onChange={handleSelectRestaurant}
          >
            <option value="">Nuevo restaurante</option>
            {sortedRestaurants.map((restaurant) => (
              <option key={restaurant.id} value={restaurant.id}>
                {restaurant.nombre || '(Sin nombre)'}
              </option>
            ))}
          </select>
          {selectedId && (
            <button
              type="button"
              className="admin-panel__delete"
              onClick={handleDelete}
              disabled={isSubmitting}
            >
              Eliminar restaurante
            </button>
          )}
        </div>

        <div className="admin-panel__layout">
          <form className="admin-panel__form" onSubmit={handleSubmit}>
            <div className="admin-panel__grid">
              <label>
                Nombre
                <input
                  name="nombre"
                  value={form.nombre}
                  onChange={handleChange}
                  required
                />
              </label>
            <label>
              Contacto
              <input
                name="contacto"
                value={form.contacto}
                onChange={handleChange}
              />
            </label>
            <label>
              Direccion
              <input
                  name="direccion"
                  value={form.direccion}
                  onChange={handleChange}
                  required
                />
              </label>
              <label className="admin-panel__textarea">
                Descripcion
                <textarea
                  name="descripcion"
                  value={form.descripcion}
                  onChange={handleChange}
                  rows={4}
                  required
                />
              </label>
              <label>
                Hora de apertura
                <input
                  name="horaApertura"
                  value={form.horaApertura}
                  onChange={handleChange}
                  placeholder="Ej: 12:00 pm"
                  required
                />
              </label>
              <label>
                Hora de cierre
                <input
                  name="horaCierre"
                  value={form.horaCierre}
                  onChange={handleChange}
                  placeholder="Ej: 10:00 pm"
                  required
              />
            </label>
            <label>
              Precio
              <input
                name="precio"
                value={form.precio}
                onChange={handleChange}
                placeholder="Ej: 10k - 30k"
                required
              />
            </label>
            <label>
              Tipo de comida 1
              <input
                name="tipoComida1"
                value={form.tipoComida1}
                onChange={handleChange}
                placeholder="Obligatorio"
                required
              />
            </label>
            <label>
              Tipo de comida 2
              <input
                name="tipoComida2"
                value={form.tipoComida2}
                onChange={handleChange}
                placeholder="Opcional"
              />
            </label>
            <label>
              Tipo de comida 3
              <input
                name="tipoComida3"
                value={form.tipoComida3}
                onChange={handleChange}
                placeholder="Opcional"
              />
            </label>
            <label>
              Latitud
              <input
                name="latitude"
                value={form.latitude}
                  onChange={handleChange}
                  required
                />
              </label>
              <label>
                Longitud
                <input
                  name="longitude"
                  value={form.longitude}
                  onChange={handleChange}
                  required
                />
              </label>
            </div>

            <fieldset className="admin-panel__options">
              <legend>Opciones</legend>
              <label>
                <input
                  type="checkbox"
                  name="domicilios"
                  checked={form.domicilios}
                  onChange={handleChange}
                />
                Ofrece domicilios
              </label>
              <label>
                <input
                  type="checkbox"
                  name="tiquetera"
                  checked={form.tiquetera}
                  onChange={handleChange}
                />
                Acepta tiquetera o descuentos
              </label>
              <label>
                <input
                  type="checkbox"
                  name="vegetariano"
                  checked={form.vegetariano}
                  onChange={handleChange}
                />
                Tiene opciones vegetarianas
              </label>
            </fieldset>

            <div className="admin-panel__actions">
              <button type="submit" disabled={isSubmitting}>
                {selectedId ? 'Actualizar' : 'Crear'} restaurante
              </button>
              <button
                type="button"
                onClick={() => resetForm('')}
                disabled={isSubmitting}
              >
                Limpiar formulario
              </button>
            </div>
          </form>

          <aside className="admin-panel__map-section">
            <div className="admin-panel__map" ref={mapContainerRef} />
            <p className="admin-panel__map-help">
              Haz clic en el mapa o arrastra el marcador para llenar la latitud y
              longitud. Tambien puedes ajustar los valores manualmente.
            </p>
          </aside>
        </div>

        {statusMessage && (
          <p className="admin-panel__status">{statusMessage}</p>
        )}
      </div>
    </section>
  );
};

export default AdminPanel;
