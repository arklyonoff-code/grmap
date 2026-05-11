"use client";

import type { WeatherInfo } from "@/services/weather";

type Props = {
  weather: WeatherInfo;
};

export function WeatherWarningBanner({ weather }: Props) {
  if (!weather.isDangerous) return null;

  const isSnow = weather.status === "snow";
  const tone = isSnow ? "snow" : "rain";

  return (
    <div className={`weather-warning-banner weather-warning-banner--${tone}`} role="alert">
      <span className="weather-warning-banner__icon" aria-hidden>
        {isSnow ? "❄️" : "🌧️"}
      </span>
      <div className="weather-warning-banner__body">
        <p className="weather-warning-banner__title">
          {isSnow ? "눈 주의" : "비 주의"} — 지하층 미끄러움
        </p>
        <p className="weather-warning-banner__sub">지하 1~2층 이동 시 속도를 줄이세요</p>
      </div>
    </div>
  );
}
