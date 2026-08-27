/**
 * City -> lat/lng resolution.
 *  1. bundled city table (cities.js), aliases included
 *  2. optional OpenCage forward geocoding (server side only, in-memory cached, when OPENCAGE_API_KEY is set)
 */
import { findCity, normalizeCityKey } from "./cities.js";

const remoteCache = new Map(); // key -> { lat, lng, city, country } | null

export function resolveLocal(city, country) {
  const hit = findCity(city);
  if (!hit) return null;
  return { city: hit.city, country: country || hit.country, countryCode: hit.countryCode, lat: hit.lat, lng: hit.lng };
}

export async function resolveRemote(city, country) {
  const key = process.env.OPENCAGE_API_KEY;
  if (!key || !city) return null;
  const cacheKey = `${normalizeCityKey(city)}|${normalizeCityKey(country)}`;
  if (remoteCache.has(cacheKey)) return remoteCache.get(cacheKey);
  let result = null;
  try {
    const q = encodeURIComponent(country ? `${city}, ${country}` : city);
    const url = `https://api.opencagedata.com/geocode/v1/json?q=${q}&key=${key}&limit=1&no_annotations=1`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (res.ok) {
      const json = await res.json();
      const first = json?.results?.[0];
      if (first?.geometry) {
        result = {
          city,
          country: first.components?.country ?? country ?? null,
          countryCode: (first.components?.country_code ?? "").toUpperCase() || null,
          lat: first.geometry.lat,
          lng: first.geometry.lng,
        };
      }
    }
  } catch (err) {
    console.warn(`[geocode] OpenCage lookup failed for "${city}": ${err.message}`);
  }
  remoteCache.set(cacheKey, result);
  return result;
}

/** Resolve a city name to coordinates using local table first, then OpenCage. */
export async function resolveCity(city, country) {
  return resolveLocal(city, country) ?? (await resolveRemote(city, country));
}

export function clearGeocodeCache() {
  remoteCache.clear();
}
