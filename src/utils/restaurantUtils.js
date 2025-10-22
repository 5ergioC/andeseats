import { GeoPoint } from 'firebase/firestore';

const normalizeBoolean = (value) => {
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    return normalized === 'true' || normalized === '1' || normalized === 'si';
  }

  if (typeof value === 'number') {
    return value === 1;
  }

  return Boolean(value);
};

const extractCoordinates = (rawPos) => {
  if (rawPos instanceof GeoPoint) {
    return {
      latitude: rawPos.latitude,
      longitude: rawPos.longitude
    };
  }

  if (rawPos && typeof rawPos === 'object') {
    const latitudeRaw =
      rawPos.latitude ??
      rawPos.lat ??
      rawPos.latitud ??
      rawPos.Latitud;

    const longitudeRaw =
      rawPos.longitude ??
      rawPos.lng ??
      rawPos.longitud ??
      rawPos.Longitud;

    const latitude = Number(latitudeRaw);
    const longitude = Number(longitudeRaw);

    if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
      return { latitude, longitude };
    }
  }

  return null;
};

export const normalizeRestaurantDoc = (doc) => {
  const data = doc.data() ?? {};

  const coordinates =
    extractCoordinates(data.pos) ??
    extractCoordinates({
      latitude: data.latitude,
      longitude: data.longitude
    });

  return {
    id: doc.id,
    nombre: data.nombre ?? '',
    descripcion: data.descripcion ?? '',
    direccion: data.direccion ?? '',
    contacto: data.contacto ?? '',
    horaApertura: data.horaApertura ?? '',
    horaCierre: data.horaCierre ?? '',
    precio: data.precio ?? '',
    domicilios: normalizeBoolean(data.domicilios ?? data.domicilio),
    tiquetera: normalizeBoolean(data.tiquetera ?? data.ticketera ?? data.descuento),
    vegetariano: normalizeBoolean(data.vegetariano ?? data.menuVegetariano),
    tipoComida: Array.isArray(data.tipoComida) ? data.tipoComida : [],
    rating: Number(data.rating ?? 0),
    ratingCount: Number(data.ratingCount ?? 0),
    ratingTotal: Number(data.ratingTotal ?? 0),
    pos: coordinates
  };
};
