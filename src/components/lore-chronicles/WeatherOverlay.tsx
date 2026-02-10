import { useMemo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export type WeatherType = "rain" | "snow" | "fog" | "none";

interface WeatherOverlayProps {
  weather: WeatherType;
  className?: string;
}

const RainDrop = ({ delay, left }: { delay: number; left: number }) => (
  <motion.div
    className="absolute w-[1px] h-4 bg-blue-300/40 rounded-full"
    style={{ left: `${left}%` }}
    initial={{ top: "-5%", opacity: 0.7 }}
    animate={{ top: "105%", opacity: 0 }}
    transition={{
      duration: 0.6 + Math.random() * 0.3,
      delay,
      repeat: Infinity,
      ease: "linear",
    }}
  />
);

const Snowflake = ({ delay, left, size }: { delay: number; left: number; size: number }) => (
  <motion.div
    className="absolute rounded-full bg-white/60"
    style={{ left: `${left}%`, width: size, height: size }}
    initial={{ top: "-5%", opacity: 0.8 }}
    animate={{
      top: "105%",
      opacity: 0,
      x: [0, 15, -10, 5, 0],
    }}
    transition={{
      duration: 4 + Math.random() * 3,
      delay,
      repeat: Infinity,
      ease: "linear",
    }}
  />
);

export const WeatherOverlay = ({ weather, className }: WeatherOverlayProps) => {
  const particles = useMemo(() => {
    if (weather === "rain") {
      return Array.from({ length: 60 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 1,
      }));
    }
    if (weather === "snow") {
      return Array.from({ length: 35 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 5,
        size: 2 + Math.random() * 4,
      }));
    }
    return [];
  }, [weather]);

  if (weather === "none") return null;

  if (weather === "fog") {
    return (
      <div className={cn("absolute inset-0 pointer-events-none overflow-hidden z-10", className)}>
        <motion.div
          className="absolute inset-0 bg-gradient-to-t from-white/20 via-white/10 to-transparent dark:from-gray-300/10 dark:via-gray-400/5"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent dark:via-gray-300/8"
          animate={{ x: ["-20%", "20%", "-20%"] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
    );
  }

  return (
    <div className={cn("absolute inset-0 pointer-events-none overflow-hidden z-10", className)}>
      {weather === "rain" &&
        particles.map((p) => <RainDrop key={p.id} delay={p.delay} left={p.left} />)}
      {weather === "snow" &&
        particles.map((p) => (
          <Snowflake key={p.id} delay={p.delay} left={p.left} size={(p as any).size || 3} />
        ))}
    </div>
  );
};
