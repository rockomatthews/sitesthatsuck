"use client";

import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type PointerEvent as ReactPointerEvent,
} from "react";

/* ============================================================================
   1. ShaderHero — raw WebGL2 fragment shader. No three.js, no library.
   A domain-warped fbm flow field in the ink/gold/rust palette, reactive to
   the pointer. Falls back to a CSS aurora if WebGL is unavailable or the user
   prefers reduced motion.
============================================================================ */

const FRAG = `#version 300 es
precision highp float;
out vec4 outColor;
uniform vec2  u_res;
uniform float u_time;
uniform vec2  u_mouse;   // 0..1

// hash + value noise + fbm ---------------------------------------------------
float hash(vec2 p){
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i + vec2(0,0)), hash(i + vec2(1,0)), u.x),
    mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), u.x), u.y);
}
float fbm(vec2 p){
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++){
    v += a * noise(p);
    p = p * 2.02 + 7.1;
    a *= 0.5;
  }
  return v;
}

void main(){
  vec2 uv = gl_FragCoord.xy / u_res.xy;
  vec2 p  = uv;
  p.x *= u_res.x / u_res.y;

  float t = u_time * 0.06;
  vec2 m  = (u_mouse - 0.5) * 0.6;

  // domain warp — feed fbm into itself for that liquid-marble flow
  vec2 q = vec2(fbm(p + t), fbm(p + vec2(5.2, 1.3) - t));
  vec2 r = vec2(fbm(p + 2.0 * q + vec2(1.7, 9.2) + m),
                fbm(p + 2.0 * q + vec2(8.3, 2.8) - m));
  float f = fbm(p + 2.0 * r + t);

  // palette: ink -> rust -> gold -> paper highlight
  vec3 ink   = vec3(0.043, 0.043, 0.047);
  vec3 rust  = vec3(0.545, 0.290, 0.170);
  vec3 gold  = vec3(0.788, 0.643, 0.215);
  vec3 paper = vec3(0.980, 0.969, 0.933);

  // spread the clustered fbm range so the flow actually shows
  float v = pow(clamp(f * 1.7, 0.0, 1.0), 0.7);

  vec3 col = mix(ink, rust, smoothstep(0.0, 0.55, v));
  col = mix(col, gold, smoothstep(0.45, 0.95, v));
  col = mix(col, paper, smoothstep(0.88, 1.0, v) * 0.45);

  // tint from the warp vectors → drifting iridescent bands, never flat black
  col += gold * 0.11 * (0.5 + 0.5 * sin(6.2831 * (r.x + t)));
  col += rust * 0.10 * (0.5 + 0.5 * cos(6.2831 * (q.y - t)));

  // gentle breathing + moodier vignette + grain
  col *= 0.88 + 0.1 * sin(u_time * 0.4);
  float vig = smoothstep(1.35, 0.1, length(uv - 0.5));
  col *= 0.62 + 0.38 * vig;
  col = max(col, ink * 1.25); // luminance floor
  col += (hash(gl_FragCoord.xy + u_time) - 0.5) * 0.025;

  outColor = vec4(col, 1.0);
}`;

const VERT = `#version 300 es
in vec2 a_pos;
void main(){ gl_Position = vec4(a_pos, 0.0, 1.0); }`;

function compile(gl: WebGL2RenderingContext, type: number, src: string) {
  const sh = gl.createShader(type);
  if (!sh) return null;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    gl.deleteShader(sh);
    return null;
  }
  return sh;
}

function ShaderHero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const canvas = canvasRef.current;
    if (!canvas || reduce) {
      setFailed(true);
      return;
    }
    const gl = canvas.getContext("webgl2", { antialias: false, alpha: false });
    if (!gl) {
      setFailed(true);
      return;
    }

    const vs = compile(gl, gl.VERTEX_SHADER, VERT);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    const prog = gl.createProgram();
    if (!vs || !fs || !prog) {
      setFailed(true);
      return;
    }
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      setFailed(true);
      return;
    }
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW,
    );
    const loc = gl.getAttribLocation(prog, "a_pos");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(prog, "u_res");
    const uTime = gl.getUniformLocation(prog, "u_time");
    const uMouse = gl.getUniformLocation(prog, "u_mouse");

    const mouse = { x: 0.5, y: 0.5 };
    const tx = { x: 0.5, y: 0.5 };

    const dpr = () => Math.min(window.devicePixelRatio || 1, 2);
    function resize() {
      if (!canvas || !gl) return;
      const w = canvas.clientWidth * dpr();
      const h = canvas.clientHeight * dpr();
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    }
    function onMove(e: PointerEvent) {
      if (!canvas) return;
      const r = canvas.getBoundingClientRect();
      tx.x = (e.clientX - r.left) / r.width;
      tx.y = 1 - (e.clientY - r.top) / r.height;
    }
    window.addEventListener("pointermove", onMove);

    const start = performance.now();
    let raf = 0;
    function frame(now: number) {
      resize();
      mouse.x += (tx.x - mouse.x) * 0.05;
      mouse.y += (tx.y - mouse.y) * 0.05;
      gl!.uniform2f(uRes, canvas!.width, canvas!.height);
      gl!.uniform1f(uTime, (now - start) / 1000);
      gl!.uniform2f(uMouse, mouse.x, mouse.y);
      gl!.drawArrays(gl!.TRIANGLES, 0, 3);
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    const onLost = (e: Event) => {
      e.preventDefault();
      cancelAnimationFrame(raf);
      setFailed(true);
    };
    canvas.addEventListener("webglcontextlost", onLost);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("webglcontextlost", onLost);
      gl.deleteProgram(prog);
      gl.deleteBuffer(buf);
    };
  }, []);

  return (
    <div className="absolute inset-0 -z-10 overflow-hidden">
      <canvas
        ref={canvasRef}
        aria-hidden
        className="h-full w-full"
        style={{ display: failed ? "none" : "block" }}
      />
      {/* CSS-aurora fallback (also the reduced-motion experience) */}
      {failed && (
        <div className="sx-grain relative h-full w-full bg-[var(--color-ink)]">
          <div className="sx-aurora" />
        </div>
      )}
      {/* legibility scrim */}
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-ink)]/30 via-transparent to-[var(--color-ink)]" />
    </div>
  );
}

/* ============================================================================
   2. CursorGlow — a fluid pointer-following light. Lerped for that
   "weighted" feel. Hidden on touch / coarse pointers.
============================================================================ */
function CursorGlow() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const el = ref.current;
    if (!el || coarse || reduce) return;

    const pos = { x: innerWidth / 2, y: innerHeight / 2 };
    const tgt = { ...pos };
    const onMove = (e: PointerEvent) => {
      tgt.x = e.clientX;
      tgt.y = e.clientY;
      el.style.opacity = "1";
    };
    window.addEventListener("pointermove", onMove);

    let raf = 0;
    const loop = () => {
      pos.x += (tgt.x - pos.x) * 0.12;
      pos.y += (tgt.y - pos.y) * 0.12;
      el.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0) translate(-50%, -50%)`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-50 h-[420px] w-[420px] rounded-full opacity-0 transition-opacity duration-500"
      style={{
        background:
          "radial-gradient(circle, rgba(201,164,55,0.16), rgba(201,164,55,0.06) 35%, transparent 70%)",
        mixBlendMode: "screen",
      }}
    />
  );
}

/* ============================================================================
   3. TiltCard — pointer-driven 3D tilt + sheen. CSS owns the transform; JS
   just writes custom properties (cheap, GPU-friendly).
============================================================================ */
function TiltCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    el.style.setProperty("--sx-ry", `${(px - 0.5) * 16}deg`);
    el.style.setProperty("--sx-rx", `${(0.5 - py) * 16}deg`);
    el.style.setProperty("--sx-mx", `${px * 100}%`);
    el.style.setProperty("--sx-my", `${py * 100}%`);
    el.style.setProperty("--sx-sheen", "1");
  };
  const reset = () => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--sx-rx", "0deg");
    el.style.setProperty("--sx-ry", "0deg");
    el.style.setProperty("--sx-sheen", "0");
  };

  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={reset}
      className={`sx-tilt relative ${className}`}
    >
      {children}
      <span className="sx-tilt__sheen" />
    </div>
  );
}

/* ============================================================================
   4. MagneticButton — pulls toward the cursor within a radius.
============================================================================ */
function MagneticButton({
  children,
  href = "#",
}: {
  children: ReactNode;
  href?: string;
}) {
  const ref = useRef<HTMLAnchorElement>(null);
  const onMove = (e: ReactPointerEvent<HTMLAnchorElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const mx = e.clientX - (r.left + r.width / 2);
    const my = e.clientY - (r.top + r.height / 2);
    el.style.setProperty("--sx-tx", `${mx * 0.35}px`);
    el.style.setProperty("--sx-ty", `${my * 0.5}px`);
  };
  const reset = () => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--sx-tx", "0px");
    el.style.setProperty("--sx-ty", "0px");
  };
  return (
    <a
      ref={ref}
      href={href}
      onPointerMove={onMove}
      onPointerLeave={reset}
      className="sx-magnetic sx-ring inline-flex min-h-[52px] items-center justify-center rounded-full bg-[var(--color-gold)] px-8 text-sm font-medium text-[var(--color-ink)]"
    >
      {children}
    </a>
  );
}

/* ============================================================================
   5. ScrambleText — decodes from glyph noise to the real word on view + hover.
============================================================================ */
const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*/<>{}".split("");

function ScrambleText({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const raf = useRef(0);

  const run = () => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.textContent = text;
      return;
    }
    cancelAnimationFrame(raf.current);
    const start = performance.now();
    const dur = 700;
    const tick = (now: number) => {
      const prog = Math.min((now - start) / dur, 1);
      const reveal = Math.floor(prog * text.length);
      let out = "";
      for (let i = 0; i < text.length; i++) {
        if (text[i] === " ") out += " ";
        else if (i < reveal) out += text[i];
        else out += GLYPHS[(Math.random() * GLYPHS.length) | 0];
      }
      el.textContent = out;
      if (prog < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  };

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          run();
          io.disconnect();
        }
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  return (
    <span
      ref={ref}
      onPointerEnter={run}
      className={`mono cursor-default ${className}`}
    >
      {text}
    </span>
  );
}

/* ============================================================================
   6. RunControls — two buttons that tell the 3D scene to run Chappie across.
   Decoupled from the canvas island via a window CustomEvent.
============================================================================ */
function RunControls() {
  const fire = (dir: "left" | "right") => () =>
    window.dispatchEvent(new CustomEvent("chappie-run", { detail: { dir } }));
  const dance = () => window.dispatchEvent(new CustomEvent("chappie-dance"));
  const laugh = () => window.dispatchEvent(new CustomEvent("chappie-laugh"));
  return (
    <div className="flex flex-wrap gap-3">
      <button
        type="button"
        onClick={fire("left")}
        className="sx-ring inline-flex min-h-[52px] items-center gap-2 rounded-full bg-[var(--color-gold)] px-7 text-sm font-medium text-[var(--color-ink)] transition hover:opacity-90"
      >
        Run in from left <span aria-hidden>→</span>
      </button>
      <button
        type="button"
        onClick={fire("right")}
        className="inline-flex min-h-[52px] items-center gap-2 rounded-full border border-white/20 bg-[var(--color-raven)]/60 px-7 text-sm font-medium text-[var(--color-paper)] backdrop-blur transition hover:border-[var(--color-gold)] hover:text-[var(--color-gold)]"
      >
        <span aria-hidden>←</span> Run in from right
      </button>
      <button
        type="button"
        onClick={dance}
        className="inline-flex min-h-[52px] items-center gap-2 rounded-full border border-white/20 bg-[var(--color-raven)]/60 px-7 text-sm font-medium text-[var(--color-paper)] backdrop-blur transition hover:border-[var(--color-gold)] hover:text-[var(--color-gold)]"
      >
        Make him dance <span aria-hidden>♪</span>
      </button>
      <button
        type="button"
        onClick={laugh}
        className="inline-flex min-h-[52px] items-center gap-2 rounded-full border border-white/20 bg-[var(--color-raven)]/60 px-7 text-sm font-medium text-[var(--color-paper)] backdrop-blur transition hover:border-[var(--color-gold)] hover:text-[var(--color-gold)]"
      >
        Laugh at a bad site <span aria-hidden>😂</span>
      </button>
    </div>
  );
}

/* ============================================================================
   Exports — grouped so the server page can compose them.
============================================================================ */
export {
  ShaderHero,
  CursorGlow,
  TiltCard,
  MagneticButton,
  ScrambleText,
  RunControls,
};
