"use client";

import { useEffect, useRef, useState } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

const COLORS = [
  "#ff9a9e",
  "#fecfef",
  "#ffd3b6",
  "#ffaaa5",
  "#ff8b94",
  "#ffc3a0",
  "#ffafbd",
  "#ffe5d9",
];

let burstListeners: Array<(x: number, y: number) => void> = [];
export function onSparkleBurst(cb: (x: number, y: number) => void) {
  burstListeners.push(cb);
  return () => {
    burstListeners = burstListeners.filter((c) => c !== cb);
  };
}
export function emitSparkleBurst(x: number, y: number) {
  burstListeners.forEach((cb) => cb(x, y));
}

export default function Sparkles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [particles, setParticles] = useState<Particle[]>([]);
  const animRef = useRef<number | null>(null);

  const addBurst = (x: number, y: number) => {
    const next: Particle[] = [];
    for (let i = 0; i < 16; i++) {
      const angle = (Math.PI * 2 * i) / 16 + (Math.random() - 0.5) * 0.8;
      const speed = 2.5 + Math.random() * 5;
      next.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        life: 0,
        maxLife: 45 + Math.random() * 35,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: 3 + Math.random() * 5,
      });
    }
    setParticles((prev) => [...prev, ...next]);
  };

  useEffect(() => {
    const unsubscribe = onSparkleBurst(addBurst);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    animRef.current = requestAnimationFrame(function loop() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setParticles((prev) => {
        const alive = prev.filter((p) => p.life < p.maxLife);
        alive.forEach((p) => {
          p.life += 1;
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.18;
          p.vx *= 0.93;
          p.size *= 0.95;
          const alpha = Math.max(0, 1 - p.life / p.maxLife);
          ctx.globalAlpha = alpha;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = alpha * 0.5;
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 0.3, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.globalAlpha = 1;
        if (alive.length) animRef.current = requestAnimationFrame(loop);
        return alive;
      });
    });

    return () => {
      unsubscribe();
      window.removeEventListener("resize", resize);
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        pointerEvents: "none",
        zIndex: 9999,
      }}
    />
  );
}
