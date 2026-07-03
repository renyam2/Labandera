import { useState, useEffect } from "react";

interface CalendarEvent {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  theme: {
    bgClass?: string;
    bannerText?: string;
    bannerBg?: string;
  };
}

const EVENTS: CalendarEvent[] = [
  {
    id: "elections-2024",
    name: "Elecciones Federales",
    startDate: "2024-06-02",
    endDate: "2024-06-03",
    theme: {
      bgClass: "bg-blue-900",
      bannerText: "🗳️ VOTA HOY",
      bannerBg: "bg-yellow-400 text-blue-900",
    },
  },
  {
    id: "fair-2024",
    name: "Feria del Libro",
    startDate: "2024-10-15",
    endDate: "2024-10-22",
    theme: {
      bgClass: "bg-amber-50",
      bannerText: "📚 SEMANA DEL LIBRO",
      bannerBg: "bg-amber-700 text-white",
    },
  },
];

export function useCalendarEvent() {
  const [activeEvent, setActiveEvent] = useState<CalendarEvent | null>(null);

  useEffect(() => {
    const checkEvent = () => {
      const now = new Date();
      const today = now.toISOString().split("T")[0];
      const found = EVENTS.find(
        (e) => today >= e.startDate && today <= e.endDate
      );
      setActiveEvent(found || null);
    };

    checkEvent();
    const interval = setInterval(checkEvent, 24 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return activeEvent;
}
