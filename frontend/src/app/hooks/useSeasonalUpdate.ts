import { useState, useEffect } from "react";

interface SeasonalTheme {
  name: string;
  bgClass: string;
  bannerText: string;
  bannerBg: string;
}

const SEASONS: Record<string, SeasonalTheme> = {
  "PRIMAVERA": {
    name: "Primavera",
    bgClass: "bg-green-50",
    bannerText: "🌸 TEMPORADA DE RENOVACIÓN",
    bannerBg: "bg-green-600 text-white",
  },
  "VERANO": {
    name: "Verano",
    bgClass: "bg-orange-50",
    bannerText: "☀️ TEMPORADA DE CALOR",
    bannerBg: "bg-orange-500 text-white",
  },
  "OTOÑO": {
    name: "Otoño",
    bgClass: "bg-amber-100",
    bannerText: "🍂 TEMPORADA DE CAMBIOS",
    bannerBg: "bg-amber-700 text-white",
  },
  "INVIERNO": {
    name: "Invierno",
    bgClass: "bg-blue-50",
    bannerText: "❄️ TEMPORADA DE REFLEXIÓN",
    bannerBg: "bg-blue-800 text-white",
  },
};

export function useSeasonalUpdate() {
  const [activeSeason, setActiveSeason] = useState<SeasonalTheme | null>(null);

  useEffect(() => {
    const determineSeason = () => {
      const month = new Date().getMonth();
      let season: string;
      if (month >= 2 && month <= 4) season = "PRIMAVERA";
      else if (month >= 5 && month <= 7) season = "VERANO";
      else if (month >= 8 && month <= 10) season = "OTOÑO";
      else season = "INVIERNO";
      setActiveSeason(SEASONS[season]);
    };

    determineSeason();
    const interval = setInterval(determineSeason, 24 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return activeSeason;
}
