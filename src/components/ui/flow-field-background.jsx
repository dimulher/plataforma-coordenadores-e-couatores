import React, { useEffect, useRef } from 'react';

/**
 * FlowFieldBackground — canvas particle flow field.
 * Adapted from the NeuralBackground TypeScript component to JSX.
 *
 * Props:
 *   color         — hex/rgb color for particles   (default '#3F7DB0')
 *   trailOpacity  — 0.0–1.0, lower = longer trails (default 0.12)
 *   particleCount — number of particles            (default 500)
 *   speed         — velocity multiplier            (default 1)
 *   bgColor       — rgba fill for trail overlay    (default 'rgba(0,27,54,…)')
 */
export default function FlowFieldBackground({
  color        = '#3F7DB0',
  trailOpacity = 0.12,
  particleCount = 500,
  speed        = 1,
  bgColor,           // auto-derived from trailOpacity if omitted
}) {
  const canvasRef    = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const canvas    = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width     = container.clientWidth;
    let height    = container.clientHeight;
    let particles = [];
    let rafId;
    let mouse     = { x: -9999, y: -9999 };

    // ── Particle ────────────────────────────────────────────────
    class Particle {
      constructor() { this.reset(true); }

      reset(init = false) {
        this.x    = Math.random() * width;
        this.y    = init ? Math.random() * height : (Math.random() < 0.5 ? 0 : height);
        this.vx   = 0;
        this.vy   = 0;
        this.age  = 0;
        this.life = Math.random() * 220 + 80;
      }

      update() {
        const angle = (Math.cos(this.x * 0.005) + Math.sin(this.y * 0.005)) * Math.PI;
        this.vx += Math.cos(angle) * 0.18 * speed;
        this.vy += Math.sin(angle) * 0.18 * speed;

        // mouse repulsion
        const dx   = mouse.x - this.x;
        const dy   = mouse.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 140) {
          const f = (140 - dist) / 140;
          this.vx -= dx * f * 0.04;
          this.vy -= dy * f * 0.04;
        }

        this.x  += this.vx;
        this.y  += this.vy;
        this.vx *= 0.95;
        this.vy *= 0.95;
        this.age++;

        if (this.age > this.life) this.reset();

        // wrap
        if (this.x < 0)      this.x = width;
        if (this.x > width)  this.x = 0;
        if (this.y < 0)      this.y = height;
        if (this.y > height) this.y = 0;
      }

      draw(context) {
        const alpha = 1 - Math.abs((this.age / this.life) - 0.5) * 2;
        context.globalAlpha = alpha * 0.7;
        context.fillStyle   = color;
        context.fillRect(this.x, this.y, 1.6, 1.6);
      }
    }

    // ── Init ─────────────────────────────────────────────────────
    const init = () => {
      const dpr       = window.devicePixelRatio || 1;
      canvas.width    = width  * dpr;
      canvas.height   = height * dpr;
      ctx.scale(dpr, dpr);
      canvas.style.width  = `${width}px`;
      canvas.style.height = `${height}px`;
      particles = Array.from({ length: particleCount }, () => new Particle());
    };

    // ── Animate ───────────────────────────────────────────────────
    const trailColor = bgColor || `rgba(0,27,54,${trailOpacity})`;
    const animate = () => {
      ctx.fillStyle = trailColor;
      ctx.fillRect(0, 0, width, height);
      particles.forEach(p => { p.update(); p.draw(ctx); });
      ctx.globalAlpha = 1;
      rafId = requestAnimationFrame(animate);
    };

    // ── Events ────────────────────────────────────────────────────
    const onResize = () => {
      width  = container.clientWidth;
      height = container.clientHeight;
      init();
    };
    const onMouseMove  = e => {
      const r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
    };
    const onMouseLeave = () => { mouse.x = -9999; mouse.y = -9999; };

    init();
    animate();

    window.addEventListener('resize', onResize);
    container.addEventListener('mousemove', onMouseMove);
    container.addEventListener('mouseleave', onMouseLeave);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', onResize);
      container.removeEventListener('mousemove', onMouseMove);
      container.removeEventListener('mouseleave', onMouseLeave);
    };
  }, [color, trailOpacity, particleCount, speed, bgColor]);

  return (
    <div
      ref={containerRef}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'hidden' }}
    >
      <canvas
        ref={canvasRef}
        style={{ display: 'block', width: '100%', height: '100%' }}
      />
    </div>
  );
}
