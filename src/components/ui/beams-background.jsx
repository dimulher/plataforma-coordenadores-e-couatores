"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";

function createBeam(width, height) {
  const angle = -35 + Math.random() * 10;
  return {
    x: Math.random() * width * 1.5 - width * 0.25,
    y: Math.random() * height * 1.5 - height * 0.25,
    width: 30 + Math.random() * 60,
    length: height * 2.5,
    angle,
    speed: 0.6 + Math.random() * 1.2,
    opacity: 0.12 + Math.random() * 0.16,
    hue: 190 + Math.random() * 70,
    pulse: Math.random() * Math.PI * 2,
    pulseSpeed: 0.02 + Math.random() * 0.03,
  };
}

const opacityMap = {
  subtle: 0.7,
  medium: 0.85,
  strong: 1,
};

/**
 * BeamsBackground
 *
 * Props:
 *   intensity  — "subtle" | "medium" | "strong"  (default "strong")
 *   className  — extra CSS classes on the wrapper
 *   style      — inline styles on the wrapper
 *   children   — content rendered above the canvas
 */
export function BeamsBackground({
  intensity = "strong",
  className = "",
  style = {},
  children,
}) {
  const canvasRef        = useRef(null);
  const beamsRef         = useRef([]);
  const animationFrameRef = useRef(null);
  const MINIMUM_BEAMS    = 20;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const parent = canvas.parentElement;

    const updateCanvasSize = () => {
      const dpr    = window.devicePixelRatio || 1;
      const w      = parent ? parent.clientWidth  : window.innerWidth;
      const h      = parent ? parent.clientHeight : window.innerHeight;
      canvas.width  = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width  = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.scale(dpr, dpr);

      const totalBeams = Math.round(MINIMUM_BEAMS * 1.5);
      beamsRef.current = Array.from({ length: totalBeams }, () =>
        createBeam(w, h)
      );
    };

    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);

    function resetBeam(beam, index, totalBeams) {
      const w       = parent ? parent.clientWidth  : window.innerWidth;
      const h       = parent ? parent.clientHeight : window.innerHeight;
      const column  = index % 3;
      const spacing = w / 3;
      beam.y       = h + 100;
      beam.x       = column * spacing + spacing / 2 + (Math.random() - 0.5) * spacing * 0.5;
      beam.width   = 100 + Math.random() * 100;
      beam.speed   = 0.5 + Math.random() * 0.4;
      beam.hue     = 190 + (index * 70) / totalBeams;
      beam.opacity = 0.2 + Math.random() * 0.1;
      return beam;
    }

    function drawBeam(ctx, beam) {
      ctx.save();
      ctx.translate(beam.x, beam.y);
      ctx.rotate((beam.angle * Math.PI) / 180);

      const pulsingOpacity =
        beam.opacity * (0.8 + Math.sin(beam.pulse) * 0.2) * opacityMap[intensity];

      const gradient = ctx.createLinearGradient(0, 0, 0, beam.length);
      gradient.addColorStop(0,   `hsla(${beam.hue}, 85%, 65%, 0)`);
      gradient.addColorStop(0.1, `hsla(${beam.hue}, 85%, 65%, ${pulsingOpacity * 0.5})`);
      gradient.addColorStop(0.4, `hsla(${beam.hue}, 85%, 65%, ${pulsingOpacity})`);
      gradient.addColorStop(0.6, `hsla(${beam.hue}, 85%, 65%, ${pulsingOpacity})`);
      gradient.addColorStop(0.9, `hsla(${beam.hue}, 85%, 65%, ${pulsingOpacity * 0.5})`);
      gradient.addColorStop(1,   `hsla(${beam.hue}, 85%, 65%, 0)`);

      ctx.fillStyle = gradient;
      ctx.fillRect(-beam.width / 2, 0, beam.width, beam.length);
      ctx.restore();
    }

    function animate() {
      const w = parent ? parent.clientWidth  : window.innerWidth;
      const h = parent ? parent.clientHeight : window.innerHeight;

      ctx.clearRect(0, 0, w, h);
      ctx.filter = "blur(35px)";

      const total = beamsRef.current.length;
      beamsRef.current.forEach((beam, i) => {
        beam.y    -= beam.speed;
        beam.pulse += beam.pulseSpeed;
        if (beam.y + beam.length < -100) resetBeam(beam, i, total);
        drawBeam(ctx, beam);
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    }

    animate();

    return () => {
      window.removeEventListener("resize", updateCanvasSize);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [intensity]);

  return (
    <div
      className={className}
      style={{
        position: "absolute", inset: 0,
        overflow: "hidden",
        ...style,
      }}
    >
      {/* canvas beams */}
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute", inset: 0,
          filter: "blur(15px)",
          width: "100%", height: "100%",
        }}
      />

      {/* subtle breathing overlay */}
      <motion.div
        style={{
          position: "absolute", inset: 0,
          backdropFilter: "blur(50px)",
          background: "rgba(0,27,54,0.05)",
        }}
        animate={{ opacity: [0.05, 0.18, 0.05] }}
        transition={{ duration: 10, ease: "easeInOut", repeat: Infinity }}
      />

      {/* children rendered above canvas */}
      {children && (
        <div style={{ position: "relative", zIndex: 10, width: "100%", height: "100%" }}>
          {children}
        </div>
      )}
    </div>
  );
}
