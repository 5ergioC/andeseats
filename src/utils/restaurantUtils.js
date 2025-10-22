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

const cleanCuisineValue = (raw) => {
  if (raw === null || raw === undefined) {
    return '';
  }

  let text = typeof raw === 'string' ? raw.trim() : String(raw ?? '').trim();
  if (!text) {
    return '';
  }

  // Remove surrounding brackets if the value came stringified
  if (text.startsWith('[') && text.endsWith(']')) {
    text = text.slice(1, -1).trim();
  }

  // Remove surrounding quotes (single or double)
  text = text.replace(/^['"]+|['"]+$/g, '').trim();

  if (!text) {
    return '';
  }

  return text;
};

export const normalizeCuisineList = (value) => {
  const reducer = (acc, current) => {
    const cleaned = cleanCuisineValue(current);
    if (cleaned) {
      acc.push(cleaned);
    }
    return acc;
  };

  if (Array.isArray(value)) {
    return value.reduce(reducer, []);
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return [];
    }

    // Try parsing JSON array or string if provided
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.reduce(reducer, []);
      }
      if (typeof parsed === 'string') {
        return reducer([], parsed);
      }
    } catch {
      // Ignore parse errors and fallback to manual splitting
    }

    if (/[;,]/.test(trimmed)) {
      return trimmed.split(/[;,]/).reduce(reducer, []);
    }

    return reducer([], trimmed);
  }

  if (value && typeof value === 'object') {
    return Object.values(value)
      .flat()
      .reduce(reducer, []);
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
