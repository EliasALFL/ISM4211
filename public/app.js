// Owl Weather: Open-Meteo forecast + geocoding, defaulting to FAU Boca Raton campus.
// API docs: https://open-meteo.com/en/docs and https://open-meteo.com/en/docs/geocoding-api
const FAU_BOCA = { name: 'Boca Raton, FL', sub: 'FAU Boca Raton campus', lat: 26.3725, lon: -80.1018 };
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const GEOCODE_URL = 'https://geocoding-api.open-meteo.com/v1/search';

const $ = (id) => document.getElementById(id);
let unit = localStorageGet('unit') || 'fahrenheit';
let place = FAU_BOCA;

// WMO weather codes -> [description, day icon, night icon]
const WMO = {
  0: ['Clear sky', '☀️', '🌙'], 1: ['Mainly clear', '🌤️', '🌙'], 2: ['Partly cloudy', '⛅', '☁️'], 3: ['Overcast', '☁️', '☁️'],
  45: ['Fog', '🌫️', '🌫️'], 48: ['Rime fog', '🌫️', '🌫️'],
  51: ['Light drizzle', '🌦️', '🌧️'], 53: ['Drizzle', '🌦️', '🌧️'], 55: ['Heavy drizzle', '🌧️', '🌧️'],
  56: ['Freezing drizzle', '🌧️', '🌧️'], 57: ['Freezing drizzle', '🌧️', '🌧️'],
  61: ['Light rain', '🌦️', '🌧️'], 63: ['Rain', '🌧️', '🌧️'], 65: ['Heavy rain', '🌧️', '🌧️'],
  66: ['Freezing rain', '🌧️', '🌧️'], 67: ['Freezing rain', '🌧️', '🌧️'],
  71: ['Light snow', '🌨️', '🌨️'], 73: ['Snow', '🌨️', '🌨️'], 75: ['Heavy snow', '❄️', '❄️'], 77: ['Snow grains', '🌨️', '🌨️'],
  80: ['Rain showers', '🌦️', '🌧️'], 81: ['Rain showers', '🌧️', '🌧️'], 82: ['Violent showers', '⛈️', '⛈️'],
  85: ['Snow showers', '🌨️', '🌨️'], 86: ['Snow showers', '❄️', '❄️'],
  95: ['Thunderstorm', '⛈️', '⛈️'], 96: ['Thunderstorm, hail', '⛈️', '⛈️'], 99: ['Thunderstorm, hail', '⛈️', '⛈️'],
};
const wmo = (code, isDay = 1) => { const w = WMO[code] || ['Unknown', '❔', '❔']; return { text: w[0], icon: isDay ? w[1] : w[2] }; };

function localStorageGet(k) { try { return localStorage.getItem(k); } catch { return null; } }
function localStorageSet(k, v) { try { localStorage.setItem(k, v); } catch {} }

const deg = (v) => `${Math.round(v)}°`;
const timeFmt = (iso) => new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
const hourFmt = (iso) => new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric' });
const dayFmt = (iso, i) => i === 0 ? 'Today' : new Date(iso + 'T12:00').toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' });
const compass = (d) => ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.round(d / 45) % 8];

async function loadWeather() {
  $('error').hidden = true;
  $('updated').textContent = 'Loading…';
  const params = new URLSearchParams({
    latitude: place.lat, longitude: place.lon,
    current: 'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m,is_day',
    hourly: 'temperature_2m,precipitation_probability,weather_code,is_day',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset,uv_index_max',
    temperature_unit: unit,
    wind_speed_unit: unit === 'fahrenheit' ? 'mph' : 'kmh',
    precipitation_unit: unit === 'fahrenheit' ? 'inch' : 'mm',
    timezone: 'auto',
    forecast_days: 7,
  });
  try {
    const res = await fetch(`${FORECAST_URL}?${params}`);
    if (!res.ok) throw new Error(`Open-Meteo returned ${res.status}`);
    render(await res.json());
  } catch (err) {
    $('updated').textContent = '';
    $('error').textContent = `Couldn't load the weather right now (${err.message}). Please try again in a moment.`;
    $('error').hidden = false;
  }
}

function render(data) {
  const c = data.current, d = data.daily, h = data.hourly;
  const now = wmo(c.weather_code, c.is_day);

  $('place').textContent = place.name;
  $('updated').textContent = `${place.sub ? place.sub + ' · ' : ''}Updated ${timeFmt(c.time)} local time`;
  $('nowIcon').textContent = now.icon;
  $('nowTemp').textContent = deg(c.temperature_2m) + (unit === 'fahrenheit' ? 'F' : 'C');
  $('nowCond').textContent = now.text;
  $('nowFeels').textContent = `Feels like ${deg(c.apparent_temperature)}`;
  $('hiLo').textContent = `${deg(d.temperature_2m_max[0])} / ${deg(d.temperature_2m_min[0])}`;
  $('hum').textContent = `${c.relative_humidity_2m}%`;
  $('wind').textContent = `${Math.round(c.wind_speed_10m)} ${unit === 'fahrenheit' ? 'mph' : 'km/h'} ${compass(c.wind_direction_10m)}`;
  $('pop').textContent = `${d.precipitation_probability_max[0] ?? 0}%`;
  $('uv').textContent = d.uv_index_max[0] != null ? d.uv_index_max[0].toFixed(1) : '–';
  $('sun').textContent = `${timeFmt(d.sunrise[0])} / ${timeFmt(d.sunset[0])}`;

  // Next 24 hours starting from the current hour
  const start = Math.max(0, h.time.findIndex((t) => t >= c.time.slice(0, 13)));
  $('hourly').innerHTML = h.time.slice(start, start + 24).map((t, i) => {
    const k = start + i, w = wmo(h.weather_code[k], h.is_day[k]);
    return `<div class="hour"><div>${i === 0 ? 'Now' : hourFmt(t)}</div><div class="i" title="${w.text}">${w.icon}</div>` +
      `<div><strong>${deg(h.temperature_2m[k])}</strong></div><div class="p">💧${h.precipitation_probability[k] ?? 0}%</div></div>`;
  }).join('');

  $('daily').innerHTML = d.time.map((t, i) => {
    const w = wmo(d.weather_code[i]);
    return `<div class="day"><div class="d">${dayFmt(t, i)}</div><div class="i">${w.icon}</div>` +
      `<div class="c" data-pop="💧${d.precipitation_probability_max[i] ?? 0}%">${w.text} · 💧${d.precipitation_probability_max[i] ?? 0}%</div>` +
      `<div class="t"><b>${deg(d.temperature_2m_max[i])}</b> / ${deg(d.temperature_2m_min[i])}</div></div>`;
  }).join('');
}

// City search via Open-Meteo geocoding
$('search').addEventListener('submit', async (e) => {
  e.preventDefault();
  const q = $('q').value.trim();
  const list = $('results');
  if (q.length < 2) return;
  list.innerHTML = '<li>Searching…</li>'; list.hidden = false;
  try {
    const res = await fetch(`${GEOCODE_URL}?${new URLSearchParams({ name: q, count: 6, language: 'en', format: 'json' })}`);
    const { results = [] } = await res.json();
    if (!results.length) { list.innerHTML = '<li>No matches found</li>'; return; }
    list.innerHTML = '';
    results.forEach((r) => {
      const li = document.createElement('li');
      li.tabIndex = 0;
      const region = [r.admin1, r.country_code].filter(Boolean).join(', ');
      li.textContent = `${r.name}${region ? ', ' + region : ''}`;
      const pick = () => {
        place = { name: li.textContent, sub: '', lat: r.latitude, lon: r.longitude };
        list.hidden = true; $('q').value = '';
        loadWeather();
      };
      li.addEventListener('click', pick);
      li.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') pick(); });
      list.appendChild(li);
    });
  } catch {
    list.innerHTML = '<li>Search failed, try again</li>';
  }
});
document.addEventListener('click', (e) => { if (!$('search').contains(e.target)) $('results').hidden = true; });

$('home').addEventListener('click', () => { place = FAU_BOCA; loadWeather(); });
$('unit').addEventListener('click', () => {
  unit = unit === 'fahrenheit' ? 'celsius' : 'fahrenheit';
  localStorageSet('unit', unit);
  loadWeather();
});

// Weather loads only after sign-in; auth.js calls this once a session exists.
let started = false;
window.startWeather = () => { if (!started) { started = true; loadWeather(); } };
