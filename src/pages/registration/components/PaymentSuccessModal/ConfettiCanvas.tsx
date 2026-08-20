import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

interface ConfettiParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  scaleX: number;
  shape: "rect" | "circle";
}

export default function ConfettiCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useGSAP(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Resize canvas to full window
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = [
      "#FFD700", // Royal Gold
      "#FFAA00", // Warm Amber
      "#25D366", // WhatsApp Emerald
      "#E63946", // Festival Crimson
      "#FFFFFF", // Pure White
      "#00F5D4", // Turquoise
      "#F72585", // Neon Magenta
    ];

    const particles: ConfettiParticle[] = [];
    const particleCount = 120;

    // Origin near the center-top where the celebration badge appears
    const originX = canvas.width / 2;
    const originY = canvas.height * 0.35;

    for (let i = 0; i < particleCount; i++) {
      const angle = gsap.utils.random(-Math.PI * 0.9, -Math.PI * 0.1);
      const velocity = gsap.utils.random(8, 22);

      particles.push({
        x: originX + gsap.utils.random(-50, 50),
        y: originY + gsap.utils.random(-20, 20),
        vx: Math.cos(angle) * velocity + gsap.utils.random(-3, 3),
        vy: Math.sin(angle) * velocity,
        size: gsap.utils.random(6, 14),
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: gsap.utils.random(0, Math.PI * 2),
        rotationSpeed: gsap.utils.random(-0.15, 0.15),
        opacity: 1,
        scaleX: 1,
        shape: Math.random() > 0.3 ? "rect" : "circle",
      });
    }

    // Side cannons burst from bottom corners as well!
    for (let i = 0; i < 40; i++) {
      // Left cannon
      particles.push({
        x: 0,
        y: canvas.height * 0.8,
        vx: gsap.utils.random(10, 20),
        vy: gsap.utils.random(-15, -25),
        size: gsap.utils.random(7, 13),
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: gsap.utils.random(0, Math.PI * 2),
        rotationSpeed: gsap.utils.random(-0.15, 0.15),
        opacity: 1,
        scaleX: 1,
        shape: "rect",
      });

      // Right cannon
      particles.push({
        x: canvas.width,
        y: canvas.height * 0.8,
        vx: gsap.utils.random(-20, -10),
        vy: gsap.utils.random(-15, -25),
        size: gsap.utils.random(7, 13),
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: gsap.utils.random(0, Math.PI * 2),
        rotationSpeed: gsap.utils.random(-0.15, 0.15),
        opacity: 1,
        scaleX: 1,
        shape: "rect",
      });
    }

    const gravity = 0.45;
    const drag = 0.985;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let alive = false;
      for (const p of particles) {
        p.vx *= drag;
        p.vy = p.vy * drag + gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;
        p.scaleX = Math.cos(p.rotation);

        // Fade out as it descends
        if (p.y > canvas.height * 0.6) {
          p.opacity -= 0.012;
        }

        if (p.opacity > 0 && p.y < canvas.height + 50) {
          alive = true;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          ctx.scale(p.scaleX, 1);
          ctx.globalAlpha = Math.max(0, p.opacity);
          ctx.fillStyle = p.color;

          if (p.shape === "circle") {
            ctx.beginPath();
            ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
            ctx.fill();
          } else {
            ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
          }

          ctx.restore();
        }
      }

      if (!alive) {
        gsap.ticker.remove(render);
      }
    };

    gsap.ticker.add(render);

    return () => {
      gsap.ticker.remove(render);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100svh",
        pointerEvents: "none",
        zIndex: 1005,
      }}
    />
  );
}
