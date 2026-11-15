import { useEffect, useRef } from "react";
import "./GardenBackground.css";

// Small leafy sprigs scattered over the cream page background.
// They scroll with the page like a printed pattern. When the mouse passes near a
// sprig, it is gently blown aside and spins a little, then floats back (each sprig
// is a soft "spring"). Cards, photos and other boxes with their own background
// simply cover the sprigs, so they only show in the empty cream space.
//
// It's one <canvas> fixed behind the whole site (mounted once in App.jsx).
// Only the sprigs currently on screen are drawn, and the animation stops when
// nothing is moving, so it costs almost nothing while you read.
//
// Phones/tablets (no mouse) and people who turned on "reduce motion" in their
// system settings see the sprigs standing still.

const CELL = 210; // px: the page is split into squares this size...
const FILL = 0.8; // ...and about this share of squares get one sprig (lower = sparser)
// With these two numbers a full desktop screen (about 1440 × 800) shows around 20–23 sprigs.
const REACH = 90; // px: how far from the cursor sprigs react
const STIFFNESS = 0.03; // how strongly sprigs are pulled home (lower = floatier)
const DAMPING = 0.9; // how quickly the movement calms down

// Same "random" numbers every time for the same square, so sprigs keep their
// place when the page gets longer (e.g. after products load) instead of jumping.
function seeded(seed) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function cssColor(el, name, fallback) {
  return getComputedStyle(el).getPropertyValue(name).trim() || fallback;
}

// Builds the look of one sprig: a curved stem with leaves on alternate sides,
// smaller towards the tip, and one leaf at the very top. Each leaf gets one of
// a few greens, so the sprigs don't look printed in a single colour.
function makeSprig(rand, x, y, colors) {
  const length = 28 + rand() * 22;
  const bend = (rand() - 0.5) * 14;
  const pick = () => colors.leaves[Math.floor(rand() * colors.leaves.length)];
  const leaves = [];
  const leafCount = 3 + Math.floor(rand() * 4);
  for (let i = 0; i < leafCount; i++) {
    const t = 0.2 + (i / leafCount) * 0.72;
    leaves.push({
      t,
      angle: (i % 2 ? 1 : -1) * (0.75 + rand() * 0.35),
      size: (11 + rand() * 5) * (1 - t * 0.35), // leaves get smaller towards the tip
      color: pick(),
    });
  }
  leaves.push({ t: 1, angle: 0, size: 10 + rand() * 4, color: pick() }); // tip leaf
  return {
    x,
    y,
    rot: (rand() - 0.5) * 2.4, // not all sprigs point the same way
    length,
    bend,
    leaves,
    phase: rand() * Math.PI * 2,
    ox: 0,
    oy: 0,
    vx: 0,
    vy: 0,
    spin: 0,
    vspin: 0,
  };
}

export default function GardenBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const canMove =
      window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let colors = null;
    let sprigs = [];
    let pageWidth = 0;
    let rows = 0;
    let viewW = 0;
    let viewH = 0;
    let pointer = null; // { x, y, vx, vy } in page coordinates
    let frame = 0;

    const readColors = () => ({
      stem: cssColor(canvas, "--garden-stem", "150, 175, 160"),
      leaves: [
        cssColor(canvas, "--garden-leaf-1", "156, 186, 166"),
        cssColor(canvas, "--garden-leaf-2", "128, 162, 140"),
        cssColor(canvas, "--garden-leaf-3", "184, 204, 186"),
      ],
    });

    // Adds sprigs for any new rows when the page grows; rebuilds all if the width changes
    const layout = () => {
      const width = document.documentElement.clientWidth;
      const height = document.documentElement.scrollHeight;
      if (width !== pageWidth) {
        pageWidth = width;
        sprigs = [];
        rows = 0;
      }
      const cols = Math.ceil(width / CELL);
      const neededRows = Math.ceil(height / CELL);
      for (let r = rows; r < neededRows; r++) {
        for (let c = 0; c < cols; c++) {
          const rand = seeded(r * 7919 + c * 104729 + 1);
          if (rand() > FILL) continue;
          const x = (c + 0.15 + rand() * 0.7) * (width / cols);
          const y = (r + 0.15 + rand() * 0.7) * CELL;
          sprigs.push(makeSprig(rand, x, y, colors));
        }
      }
      rows = Math.max(rows, neededRows);
    };

    const resize = () => {
      const ratio = window.devicePixelRatio || 1;
      viewW = window.innerWidth;
      viewH = window.innerHeight;
      canvas.width = Math.round(viewW * ratio);
      canvas.height = Math.round(viewH * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      layout();
      draw();
    };

    const drawLeaf = (size) => {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(size * 0.5, -size * 0.38, size, 0);
      ctx.quadraticCurveTo(size * 0.5, size * 0.38, 0, 0);
      ctx.fill();
    };

    // Point on the stem: t = 0 at the base, 1 at the tip (stem grows upwards, slightly curved)
    const stemPoint = (s, t) => ({ x: s.bend * t * t, y: -s.length * t });

    const drawSprig = (s, screenX, screenY) => {
      ctx.save();
      ctx.translate(screenX, screenY);
      ctx.rotate(s.rot + s.spin);

      ctx.strokeStyle = `rgb(${colors.stem})`;
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(0, -s.length / 2, s.bend, -s.length);
      ctx.stroke();

      for (const leaf of s.leaves) {
        const p = stemPoint(s, leaf.t);
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(-Math.PI / 2 + leaf.angle);
        ctx.fillStyle = `rgb(${leaf.color})`;
        drawLeaf(leaf.size);
        ctx.restore();
      }
      ctx.restore();
    };

    const draw = () => {
      ctx.clearRect(0, 0, viewW, viewH);
      const sx = window.scrollX;
      const sy = window.scrollY;
      for (const s of sprigs) {
        const x = s.x + s.ox - sx;
        const y = s.y + s.oy - sy;
        if (y < -60 || y > viewH + 60 || x < -60 || x > viewW + 60) continue; // off screen
        drawSprig(s, x, y);
      }
    };

    // One animation step; the loop stops by itself once every sprig is home and still
    const step = () => {
      frame = 0;
      let moving = false;
      const speed = pointer ? Math.min(Math.hypot(pointer.vx, pointer.vy), 30) : 0;

      for (const s of sprigs) {
        if (pointer) {
          const dx = s.x + s.ox - pointer.x;
          const dy = s.y + s.oy - pointer.y;
          const dist = Math.hypot(dx, dy) || 1;
          if (dist < REACH) {
            const near = (1 - dist / REACH) ** 2;
            const gust = near * (0.15 + speed * 0.07);
            s.vx += (dx / dist) * gust + pointer.vx * near * 0.04;
            s.vy += (dy / dist) * gust + pointer.vy * near * 0.04;
            s.vspin += near * (0.004 + speed * 0.0025) * (s.phase > Math.PI ? 1 : -1);
          }
        }
        if (s.ox === 0 && s.oy === 0 && s.vx === 0 && s.vy === 0 && s.spin === 0 && s.vspin === 0) continue;

        s.vx = (s.vx - s.ox * STIFFNESS) * DAMPING;
        s.vy = (s.vy - s.oy * STIFFNESS) * DAMPING;
        s.vspin = (s.vspin - s.spin * STIFFNESS) * DAMPING;
        s.ox += s.vx;
        s.oy += s.vy;
        s.spin += s.vspin;

        if (Math.abs(s.vx) + Math.abs(s.vy) < 0.005 && Math.abs(s.ox) + Math.abs(s.oy) < 0.05 && Math.abs(s.vspin) < 0.0005 && Math.abs(s.spin) < 0.002) {
          s.ox = s.oy = s.vx = s.vy = s.spin = s.vspin = 0; // settled
        } else {
          moving = true;
        }
      }
      if (pointer) {
        pointer.vx *= 0.6;
        pointer.vy *= 0.6;
      }
      draw();
      if (moving) frame = requestAnimationFrame(step);
    };

    const requestDraw = () => {
      if (!frame) frame = requestAnimationFrame(step);
    };

    const onMove = (e) => {
      const x = e.clientX + window.scrollX;
      const y = e.clientY + window.scrollY;
      pointer = { x, y, vx: pointer ? x - pointer.x : 0, vy: pointer ? y - pointer.y : 0 };
      requestDraw();
    };

    const onOut = (e) => {
      if (!e.relatedTarget) pointer = null; // mouse left the window
    };

    colors = readColors();
    resize();

    // Page height changes when content loads or the route changes
    const observer = new ResizeObserver(() => {
      layout();
      requestDraw();
    });
    observer.observe(document.body);

    window.addEventListener("resize", resize);
    window.addEventListener("scroll", requestDraw, { passive: true });
    if (canMove) {
      window.addEventListener("pointermove", onMove, { passive: true });
      window.addEventListener("pointerout", onOut);
    }

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", requestDraw);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerout", onOut);
      cancelAnimationFrame(frame);
    };
  }, []);

  return <canvas ref={canvasRef} className="garden-bg" aria-hidden="true" />;
}
