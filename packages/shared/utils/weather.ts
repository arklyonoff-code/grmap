export const GARAK_WEATHER_COORD = { lat: 37.4929, lng: 127.119 };

const FETCH_TIMEOUT_MS = 5000;

const WEATHER_API_KEY_PLACEHOLDERS = new Set([
  '',
  'openweathermap_api_key_here',
  '여기에_OpenWeatherMap_키_입력',
]);

export function normalizeWeatherApiKey(value?: string | null): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (WEATHER_API_KEY_PLACEHOLDERS.has(trimmed)) return undefined;
  return trimmed;
}

export type WeatherStatus = 'clear' | 'rain' | 'snow' | 'unknown';

export interface WeatherInfo {
  status: WeatherStatus;
  description: string;
  isDangerous: boolean;
}

export function weatherFromOpenWeatherCode(id: number): WeatherInfo {
  if (id >= 200 && id < 300) {
    return { status: 'rain', description: '천둥번개', isDangerous: true };
  }
  if (id >= 300 && id < 400) {
    return { status: 'rain', description: '이슬비', isDangerous: true };
  }
  if (id >= 500 && id < 600) {
    return { status: 'rain', description: '비', isDangerous: true };
  }
  if (id >= 600 && id < 700) {
    return { status: 'snow', description: '눈', isDangerous: true };
  }
  return { status: 'clear', description: '', isDangerous: false };
}

export async function fetchGarakCurrentWeather(apiKey?: string): Promise<WeatherInfo> {
  if (!apiKey) {
    return { status: 'unknown', description: '', isDangerous: false };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const { lat, lng } = GARAK_WEATHER_COORD;
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric&lang=kr`,
      { signal: controller.signal }
    );
    if (!res.ok) {
      return { status: 'unknown', description: '', isDangerous: false };
    }
    const data = (await res.json()) as { weather?: Array<{ id?: number }> };
    const id = data.weather?.[0]?.id ?? 800;
    return weatherFromOpenWeatherCode(id);
  } catch {
    return { status: 'unknown', description: '', isDangerous: false };
  } finally {
    clearTimeout(timeoutId);
  }
}
