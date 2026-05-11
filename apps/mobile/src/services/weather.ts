import Constants from 'expo-constants';
import {
  fetchGarakCurrentWeather,
  normalizeWeatherApiKey,
  type WeatherInfo,
  type WeatherStatus,
} from '@grmap/shared/utils/weather';

export type { WeatherInfo, WeatherStatus };

function resolveWeatherApiKey(): string | undefined {
  const extra = Constants.expoConfig?.extra as { weatherApiKey?: string } | undefined;
  return normalizeWeatherApiKey(process.env.EXPO_PUBLIC_WEATHER_API_KEY ?? extra?.weatherApiKey);
}

export function getCurrentWeather(): Promise<WeatherInfo> {
  return fetchGarakCurrentWeather(resolveWeatherApiKey());
}
