/**
 * Bundled world-city table used for
 *  - geocoding customer/order cities without any external API
 *  - the demo data generator (weighted subset, see generator.js)
 *
 * Lookups are case/diacritic-insensitive and understand common aliases
 * ("Bangalore" -> Bengaluru, "Bombay" -> Mumbai, "NYC" -> New York ...).
 */

const C = (city, country, countryCode, lat, lng) => ({ city, country, countryCode, lat, lng });

export const CITIES = [
  // India
  C("Mumbai", "India", "IN", 19.076, 72.8777),
  C("Bengaluru", "India", "IN", 12.9716, 77.5946),
  C("Delhi", "India", "IN", 28.6139, 77.209),
  C("Chennai", "India", "IN", 13.0827, 80.2707),
  C("Hyderabad", "India", "IN", 17.385, 78.4867),
  C("Pune", "India", "IN", 18.5204, 73.8567),
  C("Kolkata", "India", "IN", 22.5726, 88.3639),
  C("Ahmedabad", "India", "IN", 23.0225, 72.5714),
  C("Jaipur", "India", "IN", 26.9124, 75.7873),
  C("Surat", "India", "IN", 21.1702, 72.8311),
  C("Lucknow", "India", "IN", 26.8467, 80.9462),
  C("Kochi", "India", "IN", 9.9312, 76.2673),
  C("Chandigarh", "India", "IN", 30.7333, 76.7794),
  C("Indore", "India", "IN", 22.7196, 75.8577),
  C("Bhopal", "India", "IN", 23.2599, 77.4126),
  C("Nagpur", "India", "IN", 21.1458, 79.0882),
  C("Coimbatore", "India", "IN", 11.0168, 76.9558),
  C("Visakhapatnam", "India", "IN", 17.6868, 83.2185),
  C("Gurugram", "India", "IN", 28.4595, 77.0266),
  C("Noida", "India", "IN", 28.5355, 77.391),
  C("Thiruvananthapuram", "India", "IN", 8.5241, 76.9366),
  C("Patna", "India", "IN", 25.5941, 85.1376),
  C("Vadodara", "India", "IN", 22.3072, 73.1812),
  C("Mysuru", "India", "IN", 12.2958, 76.6394),
  C("Guwahati", "India", "IN", 26.1445, 91.7362),
  // United States
  C("New York", "United States", "US", 40.7128, -74.006),
  C("San Francisco", "United States", "US", 37.7749, -122.4194),
  C("Los Angeles", "United States", "US", 34.0522, -118.2437),
  C("Chicago", "United States", "US", 41.8781, -87.6298),
  C("Seattle", "United States", "US", 47.6062, -122.3321),
  C("Austin", "United States", "US", 30.2672, -97.7431),
  C("Boston", "United States", "US", 42.3601, -71.0589),
  C("Miami", "United States", "US", 25.7617, -80.1918),
  C("Dallas", "United States", "US", 32.7767, -96.797),
  C("Denver", "United States", "US", 39.7392, -104.9903),
  C("Atlanta", "United States", "US", 33.749, -84.388),
  C("Houston", "United States", "US", 29.7604, -95.3698),
  C("San Jose", "United States", "US", 37.3382, -121.8863),
  C("Washington", "United States", "US", 38.9072, -77.0369),
  C("Philadelphia", "United States", "US", 39.9526, -75.1652),
  C("Portland", "United States", "US", 45.5152, -122.6784),
  C("San Diego", "United States", "US", 32.7157, -117.1611),
  C("Phoenix", "United States", "US", 33.4484, -112.074),
  C("Minneapolis", "United States", "US", 44.9778, -93.265),
  C("Las Vegas", "United States", "US", 36.1699, -115.1398),
  // Canada
  C("Toronto", "Canada", "CA", 43.6532, -79.3832),
  C("Vancouver", "Canada", "CA", 49.2827, -123.1207),
  C("Montreal", "Canada", "CA", 45.5017, -73.5673),
  C("Calgary", "Canada", "CA", 51.0447, -114.0719),
  // United Kingdom
  C("London", "United Kingdom", "GB", 51.5074, -0.1278),
  C("Manchester", "United Kingdom", "GB", 53.4808, -2.2426),
  C("Birmingham", "United Kingdom", "GB", 52.4862, -1.8904),
  C("Edinburgh", "United Kingdom", "GB", 55.9533, -3.1883),
  C("Leeds", "United Kingdom", "GB", 53.8008, -1.5491),
  C("Glasgow", "United Kingdom", "GB", 55.8642, -4.2518),
  C("Bristol", "United Kingdom", "GB", 51.4545, -2.5879),
  // Europe
  C("Berlin", "Germany", "DE", 52.52, 13.405),
  C("Munich", "Germany", "DE", 48.1351, 11.582),
  C("Hamburg", "Germany", "DE", 53.5511, 9.9937),
  C("Frankfurt", "Germany", "DE", 50.1109, 8.6821),
  C("Cologne", "Germany", "DE", 50.9375, 6.9603),
  C("Paris", "France", "FR", 48.8566, 2.3522),
  C("Lyon", "France", "FR", 45.764, 4.8357),
  C("Amsterdam", "Netherlands", "NL", 52.3676, 4.9041),
  C("Rotterdam", "Netherlands", "NL", 51.9244, 4.4777),
  C("Madrid", "Spain", "ES", 40.4168, -3.7038),
  C("Barcelona", "Spain", "ES", 41.3874, 2.1686),
  C("Rome", "Italy", "IT", 41.9028, 12.4964),
  C("Milan", "Italy", "IT", 45.4642, 9.19),
  C("Lisbon", "Portugal", "PT", 38.7223, -9.1393),
  C("Dublin", "Ireland", "IE", 53.3498, -6.2603),
  C("Vienna", "Austria", "AT", 48.2082, 16.3738),
  C("Zurich", "Switzerland", "CH", 47.3769, 8.5417),
  C("Brussels", "Belgium", "BE", 50.8503, 4.3517),
  C("Copenhagen", "Denmark", "DK", 55.6761, 12.5683),
  C("Stockholm", "Sweden", "SE", 59.3293, 18.0686),
  C("Oslo", "Norway", "NO", 59.9139, 10.7522),
  C("Helsinki", "Finland", "FI", 60.1699, 24.9384),
  C("Warsaw", "Poland", "PL", 52.2297, 21.0122),
  C("Prague", "Czech Republic", "CZ", 50.0755, 14.4378),
  C("Budapest", "Hungary", "HU", 47.4979, 19.0402),
  C("Athens", "Greece", "GR", 37.9838, 23.7275),
  // Middle East
  C("Dubai", "United Arab Emirates", "AE", 25.2048, 55.2708),
  C("Abu Dhabi", "United Arab Emirates", "AE", 24.4539, 54.3773),
  C("Riyadh", "Saudi Arabia", "SA", 24.7136, 46.6753),
  C("Doha", "Qatar", "QA", 25.2854, 51.531),
  C("Muscat", "Oman", "OM", 23.588, 58.3829),
  C("Tel Aviv", "Israel", "IL", 32.0853, 34.7818),
  C("Istanbul", "Turkey", "TR", 41.0082, 28.9784),
  // Asia Pacific
  C("Singapore", "Singapore", "SG", 1.3521, 103.8198),
  C("Kuala Lumpur", "Malaysia", "MY", 3.139, 101.6869),
  C("Bangkok", "Thailand", "TH", 13.7563, 100.5018),
  C("Jakarta", "Indonesia", "ID", -6.2088, 106.8456),
  C("Manila", "Philippines", "PH", 14.5995, 120.9842),
  C("Ho Chi Minh City", "Vietnam", "VN", 10.8231, 106.6297),
  C("Hanoi", "Vietnam", "VN", 21.0278, 105.8342),
  C("Hong Kong", "Hong Kong", "HK", 22.3193, 114.1694),
  C("Tokyo", "Japan", "JP", 35.6762, 139.6503),
  C("Osaka", "Japan", "JP", 34.6937, 135.5023),
  C("Seoul", "South Korea", "KR", 37.5665, 126.978),
  C("Shanghai", "China", "CN", 31.2304, 121.4737),
  C("Beijing", "China", "CN", 39.9042, 116.4074),
  C("Shenzhen", "China", "CN", 22.5431, 114.0579),
  C("Taipei", "Taiwan", "TW", 25.033, 121.5654),
  C("Colombo", "Sri Lanka", "LK", 6.9271, 79.8612),
  C("Dhaka", "Bangladesh", "BD", 23.8103, 90.4125),
  C("Kathmandu", "Nepal", "NP", 27.7172, 85.324),
  C("Karachi", "Pakistan", "PK", 24.8607, 67.0011),
  C("Lahore", "Pakistan", "PK", 31.5204, 74.3587),
  // Oceania
  C("Sydney", "Australia", "AU", -33.8688, 151.2093),
  C("Melbourne", "Australia", "AU", -37.8136, 144.9631),
  C("Brisbane", "Australia", "AU", -27.4698, 153.0251),
  C("Perth", "Australia", "AU", -31.9505, 115.8605),
  C("Auckland", "New Zealand", "NZ", -36.8485, 174.7633),
  // Africa
  C("Cairo", "Egypt", "EG", 30.0444, 31.2357),
  C("Lagos", "Nigeria", "NG", 6.5244, 3.3792),
  C("Nairobi", "Kenya", "KE", -1.2921, 36.8219),
  C("Johannesburg", "South Africa", "ZA", -26.2041, 28.0473),
  C("Cape Town", "South Africa", "ZA", -33.9249, 18.4241),
  C("Casablanca", "Morocco", "MA", 33.5731, -7.5898),
  // Latin America
  C("São Paulo", "Brazil", "BR", -23.5505, -46.6333),
  C("Rio de Janeiro", "Brazil", "BR", -22.9068, -43.1729),
  C("Buenos Aires", "Argentina", "AR", -34.6037, -58.3816),
  C("Mexico City", "Mexico", "MX", 19.4326, -99.1332),
  C("Bogotá", "Colombia", "CO", 4.711, -74.0721),
  C("Lima", "Peru", "PE", -12.0464, -77.0428),
  C("Santiago", "Chile", "CL", -33.4489, -70.6693),
];

/** alias (normalized) -> canonical city name */
const ALIASES = {
  bangalore: "Bengaluru",
  bombay: "Mumbai",
  calcutta: "Kolkata",
  madras: "Chennai",
  poona: "Pune",
  gurgaon: "Gurugram",
  trivandrum: "Thiruvananthapuram",
  cochin: "Kochi",
  mysore: "Mysuru",
  baroda: "Vadodara",
  "new delhi": "Delhi",
  nyc: "New York",
  "new york city": "New York",
  sf: "San Francisco",
  la: "Los Angeles",
  "washington dc": "Washington",
  "washington d c": "Washington",
  saigon: "Ho Chi Minh City",
  "sao paulo": "São Paulo",
  bogota: "Bogotá",
  "frankfurt am main": "Frankfurt",
  munchen: "Munich",
  muenchen: "Munich",
  wien: "Vienna",
  praha: "Prague",
  roma: "Rome",
  milano: "Milan",
  lisboa: "Lisbon",
  koln: "Cologne",
  peking: "Beijing",
  kl: "Kuala Lumpur",
  hk: "Hong Kong",
  "mexico df": "Mexico City",
  "ciudad de mexico": "Mexico City",
};

/** Normalize a city string for matching: lowercase, strip diacritics/punctuation, collapse spaces. */
export function normalizeCityKey(name) {
  if (name == null) return "";
  return String(name)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[.,'’]/g, "")
    .replace(/[-_/]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const CITY_INDEX = new Map();
for (const c of CITIES) CITY_INDEX.set(normalizeCityKey(c.city), c);
for (const [alias, canonical] of Object.entries(ALIASES)) {
  const c = CITY_INDEX.get(normalizeCityKey(canonical));
  if (c) CITY_INDEX.set(normalizeCityKey(alias), c);
}

/** Find a bundled city by (messy) name. Returns the table entry or null. */
export function findCity(name) {
  const key = normalizeCityKey(name);
  if (!key) return null;
  return CITY_INDEX.get(key) ?? null;
}

export default CITIES;
