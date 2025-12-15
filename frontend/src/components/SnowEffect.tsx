"use client";

import { useEffect, useState } from "react";
import { useTheme } from "@/components/ThemeProvider";

export default function SnowEffect() {
  const { theme, snowEnabled } = useTheme();
  const [snowflakes, setSnowflakes] = useState<Array<{
    id: number;
    left: number;
    delay: number;
    duration: number;
    size: number;
    drift: number;
  }>>([]);

  useEffect(() => {
    // Создаем 60 снежинок
    const flakes = Array.from({ length: 60 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 5,
      duration: 8 + Math.random() * 12,
      size: 3 + Math.random() * 7,
      drift: (Math.random() - 0.5) * 30, // Горизонтальное смещение
    }));
    setSnowflakes(flakes);
  }, []);

  // Показываем снег только на темной теме и когда включен снег
  if (theme !== "dark" || !snowEnabled) {
    return null;
  }

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: "none",
        zIndex: 9999,
        overflow: "hidden",
      }}
    >
      {snowflakes.map((flake) => (
        <div
          key={flake.id}
          style={{
            position: "absolute",
            top: "-10px",
            left: `${flake.left}%`,
            width: `${flake.size}px`,
            height: `${flake.size}px`,
            background: "rgba(255, 255, 255, 0.9)",
            borderRadius: "50%",
            opacity: 0.7 + Math.random() * 0.3,
            animation: `snowfall ${flake.duration}s linear ${flake.delay}s infinite`,
            boxShadow: `0 0 ${flake.size}px rgba(255, 255, 255, 0.8)`,
            filter: "blur(0.5px)",
            '--snow-drift': `${flake.drift}px`,
          } as React.CSSProperties & { '--snow-drift': string }}
        />
      ))}
    </div>
  );
}

