import React, { useEffect, useMemo, useRef, useState } from 'react';
import 'maplibre-gl/dist/maplibre-gl.css';
import maplibregl from 'maplibre-gl';
import LugarDetail from './LugarDetail';
import ClusterModal from './ClusterModal';

const EMPTY_FEATURE_COLLECTION = {
  type: 'FeatureCollection',
  features: []
};

const CLUSTER_LEAVES_LIMIT = 100;

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

const transformFeatureToRestaurant = (feature) => {
  if (!feature?.geometry || feature.geometry.type !== 'Point') {
    return null;
  }

  const coordinates = Array.isArray(feature.geometry.coordinates)
    ? feature.geometry.coordinates
    : [undefined, undefined];
  const [lng, lat] = coordinates;

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  const properties = feature.properties ?? {};

  return {
    id: properties.id ?? '',
    nombre: properties.nombre ?? 'Restaurante sin nombre',
    direccion: properties.direccion ?? 'Direccion no disponible',
    descripcion: properties.descripcion ?? '',
    contacto: properties.contacto ?? 'No definido',
    precio: properties.precio ?? 'No definido',
    rating: Number(properties.rating ?? 0),
    domicilios: toBoolean(properties.domicilios),
    menuVegetariano: toBoolean(properties.menuVegetariano),
    descuento: toBoolean(properties.descuento),
    tiquetera: toBoolean(properties.tiquetera),
    horaApertura: properties.horaApertura ?? 'No definido',
    horaCierre: properties.horaCierre ?? 'No definido',
    coordinates: {
      lng,
      lat
    }
  };
};

const toActivePoint = (restaurant) => ({
  ID: restaurant.id ?? '',
  Nombre: restaurant.nombre ?? 'Restaurante sin nombre',
  Direccion: restaurant.direccion ?? 'Direccion no disponible',
  Descripcion: restaurant.descripcion ?? '',
  Contacto: restaurant.contacto ?? 'No definido',
  Precio: restaurant.precio ?? 'No definido',
  Rating: restaurant.rating ?? 0,
  Domicilios: restaurant.domicilios ?? false,
  MenuVegetariano: restaurant.menuVegetariano ?? false,
  Descuento: restaurant.descuento ?? false,
  Tiquetera: restaurant.tiquetera ?? false,
  HoraApertura: restaurant.horaApertura ?? 'No definido',
  HoraCierre: restaurant.horaCierre ?? 'No definido'
});

const MapLibreOSM = ({ lugares, filtroTipoComida }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [activePoint, setActivePoint] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [clusterModalData, setClusterModalData] = useState(null);

  const osmStyle = {
    version: 8,
    sources: {
      'osm-raster-tiles': {
        type: 'raster',
        tiles: ['https://a.tile.openstreetmap.org/{z}/{x}/{y}.png'],
        tileSize: 256,
        attribution:
          'Ac <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
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

  const geoJsonData = useMemo(() => {
    const baseList = Array.isArray(lugares) ? lugares : [];

    const filteredByTipo = filtroTipoComida
      ? baseList.filter((l) => l.tipoComida === filtroTipoComida)
      : baseList;

    const features = filteredByTipo
      .map((lugar) => {
        const rawPos = lugar?.pos ?? {};
        const latCandidate =
          rawPos.latitude ??
          rawPos.lat ??
          lugar.latitude ??
          lugar.lat ??
          lugar.latitud ??
          lugar.Latitud;
        const lngCandidate =
          rawPos.longitude ??
          rawPos.lng ??
          lugar.longitude ??
          lugar.lng ??
          lugar.longitud ??
          lugar.Longitud;

        const latitude = Number(latCandidate);
        const longitude = Number(lngCandidate);

        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
          console.warn(
            'Lugar sin coordenadas validas, se omite:',
            lugar?.nombre ?? lugar?.id ?? lugar
          );
          return null;
        }

        return {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [longitude, latitude]
          },
          properties: {
            id: lugar.id ?? '',
            nombre: lugar.nombre ?? '',
            direccion: lugar.direccion ?? 'Direccion no disponible',
            descripcion: lugar.descripcion ?? '',
            contacto: lugar.contacto ?? 'No definido',
            precio: lugar.precio ?? 'No definido',
            rating: Number(lugar.rating ?? 0),
            domicilios: lugar.domicilios ?? lugar.domicilio ?? false,
            menuVegetariano:
              lugar.menuVegetariano ?? lugar.menu_vegetariano ?? false,
            descuento:
              lugar.descuento ?? lugar.ticketera ?? lugar.tiquetera ?? false,
            tiquetera: lugar.tiquetera ?? lugar.ticketera ?? false,
            horaApertura: lugar.horaApertura ?? 'No definido',
            horaCierre: lugar.horaCierre ?? 'No definido'
          }
        };
      })
      .filter(Boolean);

    return {
      type: 'FeatureCollection',
      features
    };
  }, [lugares, filtroTipoComida]);

  const focusOnCoordinates = (lng, lat, zoom = 17) => {
    if (!map.current || !Number.isFinite(lng) || !Number.isFinite(lat)) {
      return;
    }

    map.current.flyTo({
      center: [lng, lat],
      zoom,
      essential: true
    });
  };

  useEffect(() => {
    if (map.current) {
      return;
    }

    const instance = new maplibregl.Map({
      container: mapContainer.current,
      style: osmStyle,
      center: [-74.066, 4.603],
      zoom: 17
    });

    map.current = instance;

    instance.addControl(new maplibregl.NavigationControl(), 'top-right');
    instance.addControl(new maplibregl.AttributionControl(), 'bottom-right');

    const handleClusterClick = (event) => {
      if (!map.current) {
        return;
      }

      const features = map.current.queryRenderedFeatures(event.point, {
        layers: ['clusters']
      });

      const clusterFeature = features[0];
      if (!clusterFeature) {
        return;
      }

      const clusterId = clusterFeature.properties?.cluster_id;
      const totalPoints = clusterFeature.properties?.point_count ?? 0;
      const source = map.current.getSource('restaurants');

      if (clusterId === undefined || !source) {
        return;
      }

      const coordinates = Array.isArray(clusterFeature.geometry?.coordinates)
        ? clusterFeature.geometry.coordinates
        : null;

      const fallbackZoomToCluster = () => {
        if (coordinates) {
          focusOnCoordinates(
            coordinates[0],
            coordinates[1],
            Math.min((map.current?.getZoom?.() ?? 16) + 1, 19)
          );
        }
      };

      const processLeaves = (leaves) => {
        const restaurants = (leaves ?? [])
          .map(transformFeatureToRestaurant)
          .filter(Boolean);

        if (!restaurants.length) {
          fallbackZoomToCluster();
          return;
        }

        setClusterModalData({
          center: coordinates
            ? { lng: coordinates[0], lat: coordinates[1] }
            : null,
          restaurants,
          total: totalPoints || restaurants.length,
          truncated: totalPoints > 0 && totalPoints > restaurants.length
        });
      };

      const handleError = (error) => {
        if (error) {
          console.error('No se pudieron obtener los restaurantes del cluster', error);
        }
        fallbackZoomToCluster();
      };

      const limit =
        totalPoints > 0
          ? Math.min(totalPoints, CLUSTER_LEAVES_LIMIT)
          : CLUSTER_LEAVES_LIMIT;

      try {
        const maybePromise = source.getClusterLeaves(clusterId, limit, 0);

        if (maybePromise && typeof maybePromise.then === 'function') {
          maybePromise.then(processLeaves).catch(handleError);
          return;
        }

        if (Array.isArray(maybePromise)) {
          processLeaves(maybePromise);
          return;
        }
      } catch (error) {
        handleError(error);
        return;
      }

      source.getClusterLeaves(clusterId, limit, 0, (error, leaves) => {
        if (error) {
          handleError(error);
          return;
        }
        processLeaves(leaves);
      });
    };

    const handleUnclusteredClick = (event) => {
      const feature = event.features?.[0];
      if (!feature) {
        return;
      }

      const restaurant = transformFeatureToRestaurant(feature);
      if (!restaurant) {
        return;
      }

      setClusterModalData(null);
      setActivePoint(toActivePoint(restaurant));
      focusOnCoordinates(restaurant.coordinates.lng, restaurant.coordinates.lat);
    };

    const handleMouseEnter = () => {
      if (map.current) {
        map.current.getCanvas().style.cursor = 'pointer';
      }
    };

    const handleMouseLeave = () => {
      if (map.current) {
        map.current.getCanvas().style.cursor = '';
      }
    };

    const handleLoad = () => {
      setMapLoaded(true);

      if (instance.getSource('restaurants')) {
        return;
      }

      instance.addSource('restaurants', {
        type: 'geojson',
        data: EMPTY_FEATURE_COLLECTION,
        cluster: true,
        clusterMaxZoom: 19,
        clusterRadius: 50
      });

      instance.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'restaurants',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': '#ff7f50',
          'circle-radius': ['step', ['get', 'point_count'], 20, 10, 28, 30, 36],
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 2
        }
      });

      instance.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'restaurants',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': ['get', 'point_count'],
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          'text-size': 12
        },
        paint: {
          'text-color': '#2f2f2f'
        }
      });

      instance.addLayer({
        id: 'unclustered-point',
        type: 'circle',
        source: 'restaurants',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': '#f15a24',
          'circle-radius': 9,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff'
        }
      });

      instance.on('click', 'clusters', handleClusterClick);
      instance.on('click', 'unclustered-point', handleUnclusteredClick);
      instance.on('mouseenter', 'clusters', handleMouseEnter);
      instance.on('mouseleave', 'clusters', handleMouseLeave);
      instance.on('mouseenter', 'unclustered-point', handleMouseEnter);
      instance.on('mouseleave', 'unclustered-point', handleMouseLeave);
    };

    instance.on('load', handleLoad);

    return () => {
      setMapLoaded(false);
      setActivePoint(null);
      setClusterModalData(null);

      instance.remove();
      map.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapLoaded || !map.current) {
      return;
    }

    const source = map.current.getSource('restaurants');
    if (source) {
      source.setData(geoJsonData);
    }

    setClusterModalData(null);
  }, [geoJsonData, mapLoaded]);

  const handleCloseClusterModal = () => setClusterModalData(null);

  const handleSelectRestaurantFromCluster = (restaurant) => {
    setClusterModalData(null);
    setActivePoint(toActivePoint(restaurant));
    focusOnCoordinates(restaurant.coordinates.lng, restaurant.coordinates.lat);
  };

  return (
    <>
      <div ref={mapContainer} style={{ width: '100%', height: '100vh' }} />
      {activePoint && (
        <LugarDetail
          {...activePoint}
          SetActivePoint={() => setActivePoint(null)}
        />
      )}
      <ClusterModal
        data={clusterModalData}
        onClose={handleCloseClusterModal}
        onSelect={handleSelectRestaurantFromCluster}
      />
    </>
  );
};

export default MapLibreOSM;
