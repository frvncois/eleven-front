"use client";

import { useEffect, useRef } from "react";
import type { MotionValue } from "framer-motion";
import { posterBitmap } from "@/lib/archive-preload";
import { appScale } from "@/lib/device";

type Item = { poster: string | null; w: number; h: number };

const SEG_X = 24; // each thumbnail is a fine mesh, so it can bend over the ball
const SEG_Y = 14;

const VERT = `
attribute vec2 a_uv;
uniform vec4 u_rect;    // flat x, y, w, h in screen px
uniform vec2 u_screen;  // 1440 x screen height
uniform float u_radius; // ball radius in px
varying vec2 v_uv;
void main() {
  vec2 p = u_rect.xy + a_uv * u_rect.zw;
  vec2 c = u_screen * 0.5;
  vec2 d = p - c;
  float s = length(d);
  // A point s px from the centre of the flat grid shows at R·sin(s/R) on the ball.
  float r = u_radius * sin(min(s, u_radius * 1.5) / u_radius);
  vec2 q = c + (s > 0.0 ? d * (r / s) : d);
  vec2 clip = q / u_screen * 2.0 - 1.0;
  gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
  v_uv = a_uv;
}`;

const FRAG = `
precision mediump float;
uniform sampler2D u_tex;
uniform vec4 u_crop; // object-cover: uv scale (xy) and offset (zw)
varying vec2 v_uv;
void main() {
  gl_FragColor = texture2D(u_tex, v_uv * u_crop.xy + u_crop.zw);
}`;

/**
 * The Archive grid drawn on the GPU, bent over a ball: thumbnails curve with it,
 * flat in the middle and rolling away at the edges and corners. Positions come from the grid's
 * flat layout (motion values, read every frame); `hover` gets a label that follows the curve.
 */
export function BallCanvas({
  items,
  pos,
  height,
  radius,
  visible,
  hover,
  label,
}: {
  items: Item[];
  pos: { left: MotionValue<number>; top: MotionValue<number> }[];
  height: number;
  radius: number;
  visible: boolean;
  hover: React.RefObject<number | null>;
  label: React.RefObject<HTMLDivElement | null>;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const gl = el.getContext("webgl", { antialias: true, premultipliedAlpha: true, alpha: true });
    if (!gl) return;
    const scale = appScale();
    const dpr = Math.min(2, window.devicePixelRatio * scale);
    el.width = Math.round(1440 * dpr);
    el.height = Math.round(height * dpr);
    gl.viewport(0, 0, el.width, el.height);

    const shader = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, shader(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, shader(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    // One shared mesh: a unit square cut into SEG_X × SEG_Y cells.
    const verts: number[] = [];
    for (let j = 0; j < SEG_Y; j++) {
      for (let i = 0; i < SEG_X; i++) {
        const u0 = i / SEG_X, u1 = (i + 1) / SEG_X, v0 = j / SEG_Y, v1 = (j + 1) / SEG_Y;
        verts.push(u0, v0, u1, v0, u0, v1, u1, v0, u1, v1, u0, v1);
      }
    }
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);
    const aUv = gl.getAttribLocation(prog, "a_uv");
    gl.enableVertexAttribArray(aUv);
    gl.vertexAttribPointer(aUv, 2, gl.FLOAT, false, 0, 0);
    const uRect = gl.getUniformLocation(prog, "u_rect");
    const uCrop = gl.getUniformLocation(prog, "u_crop");
    gl.uniform2f(gl.getUniformLocation(prog, "u_screen"), 1440, height);
    gl.uniform1f(gl.getUniformLocation(prog, "u_radius"), radius);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    // Posters were usually decoded before the page opened (lib/archive-preload). They go to the GPU
    // a few per frame, those on screen first, so opening the page never stalls. A tile draws once
    // its poster is in.
    type Tex = { tex: WebGLTexture | null; crop: [number, number, number, number]; pic: ImageBitmap | HTMLImageElement | null };
    const tex: Tex[] = items.map(() => ({ tex: null, crop: [1, 1, 0, 0], pic: null }));
    let alive = true;
    items.forEach((it, i) => {
      if (it.poster) posterBitmap(it.poster).then((pic) => alive && (tex[i].pic = pic));
    });
    const upload = (it: Item, t: Tex) => {
      const pic = t.pic!;
      const tx = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tx);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, pic);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      // object-fit: cover into the tile's 16:9 box.
      const box = it.w / it.h;
      const ratio = pic.width / pic.height;
      t.crop = ratio > box ? [box / ratio, 1, (1 - box / ratio) / 2, 0] : [1, ratio / box, 0, (1 - ratio / box) / 2];
      t.tex = tx;
    };
    const PER_FRAME = 3;

    const toScreen = (x: number, y: number) => {
      const dx = x - 720;
      const dy = y - height / 2;
      const s = Math.hypot(dx, dy);
      const k = s ? (radius * Math.sin(Math.min(s, radius * 1.5) / radius)) / s : 1;
      return { x: 720 + dx * k, y: height / 2 + dy * k };
    };

    let raf = 0;
    const count = SEG_X * SEG_Y * 6;
    const reach = radius * 1.4; // beyond this a tile is round the back of the ball
    const frame = () => {
      raf = requestAnimationFrame(frame);
      // Hand ready posters to the GPU, nearest the centre first, a few per frame.
      let budget = PER_FRAME;
      items
        .map((it, i) => ({ i, d: Math.hypot(pos[i].left.get() + it.w / 2 - 720, pos[i].top.get() + it.h / 2 - height / 2) }))
        .filter(({ i }) => !tex[i].tex && tex[i].pic)
        .sort((a, b) => a.d - b.d)
        .forEach(({ i }) => budget-- > 0 && upload(items[i], tex[i]));
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      items.forEach((it, i) => {
        const t = tex[i];
        if (!t.tex) return;
        const x = pos[i].left.get();
        const y = pos[i].top.get();
        if (Math.hypot(x + it.w / 2 - 720, y + it.h / 2 - height / 2) > reach) return;
        gl.bindTexture(gl.TEXTURE_2D, t.tex);
        gl.uniform4f(uRect, x, y, it.w, it.h);
        gl.uniform4f(uCrop, ...t.crop);
        gl.drawArrays(gl.TRIANGLES, 0, count);
      });
      // The hovered project's title / client sit just under its bent bottom edge.
      const l = label.current;
      const h = hover.current;
      if (l) {
        if (h === null || h === undefined) l.style.opacity = "0";
        else {
          const x = pos[h].left.get();
          const y = pos[h].top.get() + items[h].h + 8;
          const a = toScreen(x, y);
          const b = toScreen(x + items[h].w, y);
          l.style.transform = `translate(${a.x}px, ${a.y}px) rotate(${Math.atan2(b.y - a.y, b.x - a.x)}rad)`;
          l.style.width = `${Math.hypot(b.x - a.x, b.y - a.y)}px`;
          l.style.opacity = "1";
        }
      }
    };
    raf = requestAnimationFrame(frame);
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      tex.forEach((t) => t.tex && gl.deleteTexture(t.tex));
      gl.deleteBuffer(buf);
      gl.deleteProgram(prog);
      // Each list → grid toggle mounts a new canvas: release its context instead of waiting for GC, but only once the
      // canvas has really left the page. This cleanup also runs when the effect re-runs on the same canvas (a height
      // change after mount, React's dev double-mount), and losing the context then left the grid blank (Oct 23).
      setTimeout(() => {
        if (!el.isConnected) gl.getExtension("WEBGL_lose_context")?.loseContext();
      });
    };
  }, [items, pos, height, radius, hover, label]);

  return (
    <canvas
      ref={canvas}
      aria-hidden
      className="pointer-events-none absolute top-0 left-0 transition-opacity duration-300 ease-out"
      style={{ width: 1440, height, opacity: visible ? 1 : 0 }}
    />
  );
}
