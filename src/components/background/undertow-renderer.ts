export type UndertowRenderer = { draw: (ctx: CanvasRenderingContext2D, width: number, height: number, phase: number, dark: boolean) => void; destroy: () => void }
const vertex = `#version 300 es
in vec2 p; out vec2 uv; void main(){uv=p*.5+.5;gl_Position=vec4(p,0.,1.);}`
// Original compact shore field: layered noise distorts the waterline and foam.
const fragment = `#version 300 es
precision highp float; in vec2 uv; out vec4 color; uniform float t; uniform float dark; uniform float aspect;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n2(vec2 p){vec2 i=floor(p),f=fract(p); f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float s=0.,a=.5; for(int i=0;i<5;i++){s+=a*n2(p);p=p*2.03+7.1;a*=.5;}return s;}
float cells(vec2 p){vec2 i=floor(p),f=fract(p);float a=2.,b=2.;for(int y=-1;y<=1;y++)for(int x=-1;x<=1;x++){vec2 g=vec2(float(x),float(y));vec2 q=g+vec2(hash(i+g),hash(i+g+17.))-f;float d=dot(q,q);if(d<a){b=a;a=d;}else b=min(b,d);}return b-a;}
void main(){vec2 p=uv;float reach=.5+.5*sin(t*.026*6.283);float line=.60-.24*reach+.055*(fbm(vec2(p.x*4.,t*.035))-.5);float water=1.-smoothstep(line-.009,line+.009,p.y);float grain=fbm(vec2(p.x*aspect*45.,p.y*45.+t*.03));float net=1.-smoothstep(.02,.14,cells(vec2(p.x*aspect*25.+t*.025,p.y*25.)));float foam=exp(-abs(p.y-line)*65.)*(.3+.7*net);vec3 shore=mix(vec3(.88,.91,.93),vec3(.04,.045,.05),dark);vec3 sea=mix(vec3(.50,.61,.67),vec3(.16,.18,.19),dark);vec3 c=mix(shore,sea,water);c+=foam*mix(.20,.38,dark)+(grain-.5)*.035;color=vec4(c,1.);}`
export function createWebGLRenderer(width: number, height: number, onLost: () => void): UndertowRenderer | null {
  const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height
  const gl = canvas.getContext('webgl2', { alpha: false, preserveDrawingBuffer: true }); if (!gl) return null
  const shaders: WebGLShader[] = []
  let program: WebGLProgram | null = null, buffer: WebGLBuffer | null = null, disposed = false
  const lost = (event: Event) => { event.preventDefault(); if (!disposed) onLost() }
  canvas.addEventListener('webglcontextlost', lost)
  const destroy = () => { disposed = true; canvas.removeEventListener('webglcontextlost',lost); if (buffer) gl.deleteBuffer(buffer); if (program) gl.deleteProgram(program); shaders.forEach(s => gl.deleteShader(s)); gl.getExtension('WEBGL_lose_context')?.loseContext() }
  try {
    const compile = (type: number, source: string) => { const shader = gl.createShader(type); if (!shader) throw Error('shader'); shaders.push(shader); gl.shaderSource(shader,source); gl.compileShader(shader); if (!gl.getShaderParameter(shader,gl.COMPILE_STATUS)) throw Error('shader compile'); return shader }
    const vs = compile(gl.VERTEX_SHADER,vertex), fs = compile(gl.FRAGMENT_SHADER,fragment); program = gl.createProgram(); if (!program) throw Error('program')
    gl.attachShader(program,vs); gl.attachShader(program,fs); gl.linkProgram(program); if (!gl.getProgramParameter(program,gl.LINK_STATUS)) throw Error('link')
    buffer = gl.createBuffer(); if (!buffer) throw Error('buffer'); gl.bindBuffer(gl.ARRAY_BUFFER,buffer); gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW)
    gl.useProgram(program); const position=gl.getAttribLocation(program,'p'); gl.enableVertexAttribArray(position); gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0)
    const activeProgram = program
    return { draw(ctx,w,h,t,dark) { gl.viewport(0,0,width,height); gl.uniform1f(gl.getUniformLocation(activeProgram,'t'),t); gl.uniform1f(gl.getUniformLocation(activeProgram,'dark'),dark?1:0); gl.uniform1f(gl.getUniformLocation(activeProgram,'aspect'),width/height); gl.drawArrays(gl.TRIANGLE_STRIP,0,4); ctx.drawImage(canvas,0,0,w,h) }, destroy }
  } catch { destroy(); return null }
}
// Generate the two cached layers once; no per-frame pixel loop. Budget is measured at initialization.
export const CANVAS_CACHE_BUDGET_MS = 40
export function createCanvasRenderer(mobile: boolean, low: boolean, budget = CANVAS_CACHE_BUDGET_MS): UndertowRenderer | null {
  const started = performance.now(), width = low ? (mobile?300:480) : (mobile?440:700), height = low ? (mobile?480:300) : (mobile?700:440)
  const base = document.createElement('canvas'), swell = document.createElement('canvas'); base.width=swell.width=width; base.height=swell.height=height
  const a=base.getContext('2d'), b=swell.getContext('2d'); if (!a || !b) return null
  const gradient=a.createLinearGradient(0,0,0,height); gradient.addColorStop(0,'#e0e7eb'); gradient.addColorStop(.47,'#c6d3da'); gradient.addColorStop(.50,'#f4f8fa'); gradient.addColorStop(.53,'#8ba3b0'); gradient.addColorStop(1,'#607e8d'); a.fillStyle=gradient; a.fillRect(0,0,width,height)
  // A deterministic cached texture avoids runtime noise generation and external assets.
  for (let y=0;y<height;y+=6) for(let x=0;x<width;x+=6) { const n=Math.abs(Math.sin(x*12.9898+y*78.233)*43758.5453)%1; const band=Math.max(0,1-Math.abs(y/height-.5)/.22); b.fillStyle=`rgba(235,245,248,${n*band*.35})`; b.fillRect(x,y,6,6) }
  if (performance.now()-started > budget) { base.width=0; swell.width=0; return null }
  return { draw(ctx,w,h,t,dark) {
    ctx.save()
    try {
      if (dark) { ctx.fillStyle='#111820'; ctx.fillRect(0,0,w,h); ctx.globalAlpha=.24 }
      const shift=Math.sin(t*.026*6.283)*h*.10
      ctx.drawImage(base,0,-h*.12+shift,w,h*1.24)
      const angle=t*.026*Math.PI, strength=dark?.18:.24
      ctx.globalAlpha=strength*Math.sin(angle)**2
      ctx.drawImage(swell,Math.sin(t*.03)*12-12,shift,w+24,h)
      ctx.globalAlpha=strength*Math.cos(angle)**2
      ctx.drawImage(swell,-w*.08-Math.sin(t*.023)*10,shift+h*.04,w*1.16,h*.90)
    } finally { ctx.restore() }
  }, destroy() { base.width=0; swell.width=0 } }
}
