/**
 * The painted landscapes, made to move.
 *
 * A small WebGL shader that reads one of two still paintings and offsets
 * where it samples them, in places: clouds drift in the hero's sky, grasses
 * and flowers lean in the footer's meadow, the lake ripples. Nothing is
 * layered or cut out — the original pixels are all that is ever drawn, which
 * is why this costs a texture and a quad instead of a video.
 *
 * The masks that decide *where* each effect applies are tuned to the exact
 * two paintings in /public/landscape. They are feathered regions plus a
 * colour test (is this pixel green? is it turquoise?), not per-plant
 * cutouts, so a painted detail next to a grass blade can lean very slightly
 * with it. If that ever needs to be tighter, sharpen the mask — don't raise
 * the amplitude, and don't swap the artwork for something framed
 * differently, because every number below is in the artwork's own
 * coordinates.
 *
 * Ported from the handoff module; the shader source is verbatim.
 */

const vertex = `attribute vec2 a;varying vec2 uv;void main(){uv=vec2((a.x+1.)*.5,(1.-a.y)*.5);gl_Position=vec4(a,0.,1.);}`

const fragment = `precision highp float;varying vec2 uv;uniform sampler2D image;uniform float time;uniform float mode;uniform vec2 view;uniform vec2 dim;uniform vec3 dimColor;
float ellipse(vec2 p,vec2 c,vec2 r){float d=length((p-c)/r);return 1.-smoothstep(.75,1.,d);}
void main(){
 vec2 p=uv;float aspect=view.x/view.y;vec2 cover=aspect>2.?vec2(1.,2./aspect):vec2(aspect/2.,1.);p=(p-.5)*cover+.5;vec2 q=p;float t=time;
 vec4 original=texture2D(image,p);
 if(mode<.5){
  float edge=sin(3.14159*p.x)*sin(3.14159*p.y);float side=.3+.7*smoothstep(.12,.44,abs(p.x-.5));
  q.x+=edge*side*(.012*sin(t*.105)+.0035*sin(p.y*8.+t*.16));
  q.y+=edge*.003*sin(p.x*7.-t*.12);
 }else{
  // Lake mask follows the shoreline; color qualification excludes the painted banks.
  float water=ellipse(p,vec2(.625,.783),vec2(.16,.09))+ellipse(p,vec2(.706,.711),vec2(.091,.058));
  float aqua=smoothstep(.035,.13,original.g-original.r)*smoothstep(.015,.10,original.b-original.r);water=clamp(water,0.,1.)*aqua;
  q.x+=water*(.0014*sin(p.y*340.-t*1.1)+.00055*sin(p.y*680.+t*.7));
  q.y+=water*.0006*sin(p.x*75.+p.y*110.-t*.95);
  // Foreground flowers and grasses have phase-offset gusts; mountains and rocks stay anchored.
  float sides=max((1.-smoothstep(.20,.38,p.x))*smoothstep(.44,.74,p.y),smoothstep(.77,.93,p.x)*smoothstep(.48,.73,p.y));
  float foreground=smoothstep(.86,.99,p.y);float zone=max(sides,foreground);
  float green=smoothstep(.015,.075,original.g-original.b);float flower=smoothstep(.10,.28,original.r-original.b);
  float plant=zone*max(green,flower)*(1.-water);
  float gust=sin(t*1.13+p.x*15.+p.y*3.)*.72+sin(t*.49+p.x*9.)*.28;
  float anchor=.25+.75*pow(abs(sin(p.y*38.+p.x*13.)),1.5);
  q.x+=plant*.0048*gust*anchor;q.y+=plant*.0011*sin(t*1.13+p.x*15.+.6)*anchor;
 }
 vec4 color=texture2D(image,clamp(q,vec2(.001),vec2(.999)));
 // Night, applied here rather than by a layer over the top: a canvas running
 // WebGL is promoted to its own compositing layer, and an overlay above it is
 // not reliably composited over the frames it draws. Doing it in the shader
 // means what's on screen is dimmed by construction. Same arithmetic as the
 // CSS veil over the still image, so the two match — including the gradient,
 // which runs top to bottom of the element exactly as the CSS one does.
 gl_FragColor=vec4(mix(color.rgb,dimColor,mix(dim.x,dim.y,uv.y)),1.);
}`

export type LandscapeMotion = {
  readonly paused: boolean
  /** How many scenes actually got a WebGL context — 0 means the paintings are
   *  on screen as plain images and there is nothing for a pause control to do. */
  readonly scenes: number
  setPaused: (value: boolean) => void
  dispose: () => void
}

type Options = {
  /** Retina costs four times the fill for a painting nobody inspects. */
  maxDpr?: number
  /** The movement is slow enough that 30 reads the same as 60 and halves the work. */
  fps?: number
  onPauseChange?: (paused: boolean) => void
}

type Scene = {
  element: HTMLElement
  canvas: HTMLCanvasElement
  gl: WebGLRenderingContext
  img: HTMLImageElement
  ready: boolean
  visible: boolean
  lost?: boolean
  shaders: (WebGLShader | null)[]
  program?: WebGLProgram | null
  buffer?: WebGLBuffer | null
  texture?: WebGLTexture | null
  clock?: WebGLUniformLocation | null
  view?: WebGLUniformLocation | null
  dim?: WebGLUniformLocation | null
  dimColor?: WebGLUniformLocation | null
  upload?: () => void
  error?: () => void
  contextlost?: () => void
  resize?: ResizeObserver
  intersection?: IntersectionObserver
}

/**
 * Mount after the DOM exists — in React, from an effect in a client
 * component, returning `dispose` so a route change can't leave a second loop
 * running over the first.
 *
 * Each scene is an element with `data-landscape="clouds"` or `"landscape"`
 * holding one image element and one `canvas[data-landscape-canvas]`. The image
 * stays in the document and visible: it is what shows before the texture
 * uploads, if WebGL is unavailable, and whenever someone has asked for less
 * motion. The canvas only fades in over it once there is something better to
 * show.
 */
/**
 * Turns any CSS colour the page is actually using — a var() chain, hex,
 * oklch — into the 0..1 components the shader wants, by letting the browser
 * compute it and then letting a 2D canvas decode it.
 */
const toRgb = (expression: string): [number, number, number] => {
  const probe = document.createElement('span')
  probe.style.color = expression
  document.body.appendChild(probe)
  const computed = getComputedStyle(probe).color
  document.body.removeChild(probe)
  const ctx = document.createElement('canvas').getContext('2d')
  if (!ctx) return [0, 0, 0]
  ctx.fillStyle = computed
  ctx.fillRect(0, 0, 1, 1)
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data
  return [r / 255, g / 255, b / 255]
}

export function createLandscapeMotion(
  root: ParentNode = document,
  options: Options = {},
): LandscapeMotion {
  const { maxDpr = 1.5, fps = 30, onPauseChange = () => {} } = options
  const media = window.matchMedia('(prefers-reduced-motion: reduce)')
  let paused = media.matches
  let disposed = false
  let raf = 0
  let last = 0
  let time = 0
  const states: Scene[] = []

  // Nothing runs unless there is a reason to: something on screen, the tab in
  // front, and no one having asked it to stop.
  const active = () =>
    !disposed && !paused && !document.hidden && states.some((s) => s.ready && s.visible)
  const request = () => {
    if (active() && !raf) raf = requestAnimationFrame(tick)
  }
  const stop = () => {
    cancelAnimationFrame(raf)
    raf = 0
    last = 0
  }

  function draw(s: Scene) {
    if (!s.ready || disposed) return
    const { gl, canvas, element } = s
    const width = element.clientWidth
    const height = element.clientHeight
    if (!width || !height) return
    const dpr = Math.min(window.devicePixelRatio || 1, maxDpr)
    const w = Math.round(width * dpr)
    const h = Math.round(height * dpr)
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w
      canvas.height = h
    }
    if (!s.program) return
    gl.useProgram(s.program)
    gl.viewport(0, 0, w, h)
    gl.uniform2f(s.view!, width, height)
    gl.uniform1f(s.clock!, time)
    gl.drawArrays(gl.TRIANGLES, 0, 6)
  }

  /**
   * How far towards the page's own colour this scene should sit, read from
   * the stylesheet so the decision stays with the design rather than being a
   * number buried in here. Dark mode sets it; light mode leaves it at zero.
   */
  function readDim(s: Scene) {
    if (!s.program) return
    const css = getComputedStyle(s.element)
    const num = (name: string, fallback: number) => {
      const v = parseFloat(css.getPropertyValue(name))
      return Number.isFinite(v) ? v : fallback
    }
    // A scene veils by one amount unless it asks for a gradient, which the
    // footer does so its meadow keeps more colour than its sky.
    const base = num('--scene-dim', 0)
    const from = num('--scene-dim-from', base)
    const to = num('--scene-dim-to', base)
    const veil = css.getPropertyValue('--scene-veil').trim() || 'var(--bg)'
    const [r, g, b] = from > 0 || to > 0 ? toRgb(veil) : [0, 0, 0]
    s.gl.useProgram(s.program)
    s.gl.uniform2f(s.dim!, from, to)
    s.gl.uniform3f(s.dimColor!, r, g, b)
  }

  // The theme can change under a scene at any time, from the toggle in the
  // header or from the system. Watching the attribute catches every route to
  // it, including one set directly without announcing itself.
  const theme = new MutationObserver(() => {
    states.forEach((s) => {
      readDim(s)
      if (s.ready && s.visible) draw(s)
    })
  })
  theme.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })

  function tick(now: number) {
    raf = 0
    if (!active()) {
      last = 0
      return
    }
    if (!last || now - last >= 1000 / fps) {
      // Clamped so a backgrounded tab returning doesn't jump the scene
      // forward by however long it was away.
      if (last) time += Math.min((now - last) / 1000, 0.1)
      last = now
      states.forEach((s) => {
        if (s.visible) draw(s)
      })
    }
    request()
  }

  function setPaused(value: boolean) {
    paused = Boolean(value)
    stop()
    states.forEach((s) => {
      // Paused *because the OS asked* shows the untouched painting. Paused
      // because someone pressed the button holds the frame it was on, which
      // is what makes resume continue rather than jump.
      s.element.classList.toggle('motion-ready', s.ready && !(paused && media.matches))
      if (s.ready && s.visible) draw(s)
    })
    onPauseChange(paused)
    request()
  }

  const visibility = () => {
    stop()
    request()
  }
  const preference = (e: MediaQueryListEvent) => setPaused(e.matches)
  document.addEventListener('visibilitychange', visibility)
  media.addEventListener('change', preference)

  for (const element of Array.from(root.querySelectorAll<HTMLElement>('[data-landscape]'))) {
    const img = element.querySelector('img')
    const canvas = element.querySelector<HTMLCanvasElement>('canvas[data-landscape-canvas]')
    if (!img || !canvas) continue
    const gl = canvas.getContext('webgl', {
      alpha: false,
      antialias: false,
      preserveDrawingBuffer: false,
    })
    // No WebGL at all: the painting is already on screen and stays the whole story.
    if (!gl) continue
    const s: Scene = { element, canvas, gl, img, ready: false, visible: true, shaders: [] }
    states.push(s)
    const fallback = () => {
      s.ready = false
      element.classList.remove('motion-ready')
    }
    try {
      const compile = (type: number, source: string) => {
        const shader = gl.createShader(type)
        s.shaders.push(shader)
        gl.shaderSource(shader!, source)
        gl.compileShader(shader!)
        if (!gl.getShaderParameter(shader!, gl.COMPILE_STATUS))
          throw Error(gl.getShaderInfoLog(shader!) ?? 'shader')
        return shader!
      }
      s.program = gl.createProgram()
      gl.attachShader(s.program!, compile(gl.VERTEX_SHADER, vertex))
      gl.attachShader(s.program!, compile(gl.FRAGMENT_SHADER, fragment))
      gl.linkProgram(s.program!)
      if (!gl.getProgramParameter(s.program!, gl.LINK_STATUS))
        throw Error(gl.getProgramInfoLog(s.program!) ?? 'program')
      gl.useProgram(s.program!)
      s.buffer = gl.createBuffer()
      gl.bindBuffer(gl.ARRAY_BUFFER, s.buffer)
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
        gl.STATIC_DRAW,
      )
      const attr = gl.getAttribLocation(s.program!, 'a')
      gl.enableVertexAttribArray(attr)
      gl.vertexAttribPointer(attr, 2, gl.FLOAT, false, 0, 0)
      s.texture = gl.createTexture()
      gl.bindTexture(gl.TEXTURE_2D, s.texture)
      // The paintings aren't power-of-two, which WebGL 1 allows only with
      // clamped wrapping and no mipmaps. Both are set here deliberately.
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
      gl.uniform1i(gl.getUniformLocation(s.program!, 'image'), 0)
      gl.uniform1f(
        gl.getUniformLocation(s.program!, 'mode'),
        element.dataset.landscape === 'clouds' ? 0 : 1,
      )
      s.clock = gl.getUniformLocation(s.program!, 'time')
      s.view = gl.getUniformLocation(s.program!, 'view')
      s.dim = gl.getUniformLocation(s.program!, 'dim')
      s.dimColor = gl.getUniformLocation(s.program!, 'dimColor')
      readDim(s)
      s.upload = () => {
        if (disposed || s.lost) return
        try {
          gl.bindTexture(gl.TEXTURE_2D, s.texture ?? null)
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img)
          if (gl.getError() !== gl.NO_ERROR) throw Error('Texture upload failed')
          s.ready = true
          draw(s)
          element.classList.toggle('motion-ready', !(paused && media.matches))
          request()
        } catch (error) {
          fallback()
          console.warn('Landscape: using static artwork.', error)
        }
      }
      s.error = fallback
      // Fires again when a responsive source swaps, which re-uploads the
      // new file rather than leaving the texture on the old one.
      img.addEventListener('load', s.upload)
      img.addEventListener('error', s.error)
      if (img.complete && img.naturalWidth) s.upload()
      s.resize = new ResizeObserver(() => {
        draw(s)
        request()
      })
      s.resize.observe(element)
      s.intersection = new IntersectionObserver(
        (entries) => {
          s.visible = entries[0].isIntersecting
          if (s.visible) draw(s)
          if (active()) request()
          else stop()
        },
        { rootMargin: '120px' },
      )
      s.intersection.observe(element)
      // Recreating a lost context isn't implemented; remounting does it. The
      // painting is still there, so this degrades to the static scene.
      s.contextlost = () => {
        s.lost = true
        fallback()
        if (!active()) stop()
      }
      canvas.addEventListener('webglcontextlost', s.contextlost)
    } catch (error) {
      fallback()
      console.warn('Landscape: using static artwork.', error)
    }
  }

  onPauseChange(paused)
  request()

  return {
    get paused() {
      return paused
    },
    get scenes() {
      return states.length
    },
    setPaused,
    dispose() {
      if (disposed) return
      disposed = true
      stop()
      theme.disconnect()
      document.removeEventListener('visibilitychange', visibility)
      media.removeEventListener('change', preference)
      for (const s of states) {
        s.resize?.disconnect()
        s.intersection?.disconnect()
        if (s.upload) s.img.removeEventListener('load', s.upload)
        if (s.error) s.img.removeEventListener('error', s.error)
        if (s.contextlost) s.canvas.removeEventListener('webglcontextlost', s.contextlost)
        s.element.classList.remove('motion-ready')
        if (s.texture) s.gl.deleteTexture(s.texture)
        if (s.buffer) s.gl.deleteBuffer(s.buffer)
        if (s.program) s.gl.deleteProgram(s.program)
        s.shaders.forEach((shader) => s.gl.deleteShader(shader))
      }
    },
  }
}
