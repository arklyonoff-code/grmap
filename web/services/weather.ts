import {
  fetchGarakCurrentWeather,
  normalizeWeatherApiKey,
  type WeatherInfo,
  type WeatherStatus,
} from '@grmap/shared/utils/weather';

export type { WeatherInfo, WeatherStatus };

export function getCurrentWeather(): Promise<WeatherInfo> {
  return fetchGarakCurrentWeather(normalizeWeatherApiKey(process.env.NEXT_PUBLIC_WEATHER_API_KEY));
}
