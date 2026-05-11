import {
  fetchGarakCurrentWeather,
  type WeatherInfo,
  type WeatherStatus,
} from '@grmap/shared/utils/weather';

export type { WeatherInfo, WeatherStatus };

export function getCurrentWeather(): Promise<WeatherInfo> {
  return fetchGarakCurrentWeather(process.env.NEXT_PUBLIC_WEATHER_API_KEY);
}
