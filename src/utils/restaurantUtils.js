import { GeoPoint } from 'firebase/firestore';

export const normalizeBoolean = (value) => {
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

const stripWrapperChars = (text) =>
  text.replace(/^[\s[\]"]+|[\s[\]"]+$/g, '').trim();

export const normalizeCuisineList = (value) => {
  if (Array.isArray(value)) {
    return value
      .map((item) =>
        stripWrapperChars(typeof item === 'string' ? item : String(item ?? ''))
      )
      .filter(Boolean);
  }

  if (typeof value === 'string') {
    const trimmed = stripWrapperChars(value);
    if (!trimmed) {
      return [];
    }

    if (!/[;,]/.test(value)) {
      return [trimmed];
    }

    return value
      .split(/[;,]/)
      .map((item) => stripWrapperChars(item))
      .filter(Boolean);
  }

  if (value && typeof value === 'object') {
    return Object.values(value)
      .flat()
      .map((item) =>
        stripWrapperChars(typeof item === 'string' ? item : String(item ?? ''))
      )
      .filter(Boolean);
  }

  return [];
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
    contacto:
      typeof data.contacto === 'string'
        ? data.contacto.trim()
        : data.contacto ?? '',
    horaApertura: data.horaApertura ?? '',
    horaCierre: data.horaCierre ?? '',
    precio: data.precio ?? '',
    domicilios: normalizeBoolean(data.domicilios ?? data.domicilio),
    tiquetera: normalizeBoolean(data.tiquetera ?? data.ticketera ?? data.descuento),
    vegetariano: normalizeBoolean(data.vegetariano ?? data.menuVegetariano),
    tipoComida: normalizeCuisineList(
      data.tipoComida ??
        data.TipoComida ??
        data.tiposComida ??
        data.tipo_comida ??
        data.TIPO_COMIDA
    ),
    rating: Number(data.rating ?? 0),
    ratingCount: Number(data.ratingCount ?? 0),
    ratingTotal: Number(data.ratingTotal ?? 0),
    pos: coordinates
  };
};
