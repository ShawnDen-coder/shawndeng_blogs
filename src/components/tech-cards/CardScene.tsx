import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState } from 'react'
import { DoubleSide, MathUtils, TextureLoader, Vector2, type Mesh, type Texture } from 'three'
import type { TechCard } from './card-prints'

const vertexShader = `
  varying vec2 cardUv;
  void main() {
    cardUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
  }
`

const fragmentShader = `
  uniform sampler2D face;
  uniform sampler2D foil;
  uniform vec2 light;
  uniform float reveal;
  varying vec2 cardUv;

  const float TAU = 6.283185;
  vec3 rainbow(float phase) {
    return .54 + .46 * cos(TAU * (phase + vec3(.02, .69, .36)));
  }

  // Sites stay registered to the print. Light direction picks which flecks flare.
  float flecks(vec2 paper, vec2 tilt, float sweep) {
    vec2 tile = floor(paper * 22.);
    vec3 seed = fract(sin(vec3(dot(tile, vec2(37.1, 17.3)),
                                dot(tile, vec2(11.7, 91.9)),
                                dot(tile, vec2(75.2, 29.4)))) * 4375.23);
    vec2 d = abs(fract(paper * 22.) - (.18 + .64 * seed.xy));
    float sparkle = exp(-95. * max(d.x, d.y))
      + exp(-55. * min(d.x, d.y) - 9. * max(d.x, d.y));
    float facing = .5 + .5 * cos(TAU * (seed.z + dot(tilt, vec2(.9, -.7)) + sweep));
    return sparkle * pow(facing, 12.) * smoothstep(.45, .85, seed.x);
  }

  void main() {
    vec2 uv = cardUv;
    vec4 ink = texture2D(face, uv);
    if (ink.a < .35) discard;
    if (!gl_FrontFacing) {
      vec2 p = (uv - .5) * vec2(1., 1.4);
      float radius = length(p);
      float rose = .22 + .035 * cos(7. * atan(p.y, p.x + .00001));
      float seal = 1. - smoothstep(.003, .013, abs(radius - rose));
      vec2 edge = min(uv, 1. - uv) * vec2(1., 1.4);
      float rim = 1. - smoothstep(.002, .006, abs(min(edge.x, edge.y) - .027));
      float weave = pow(abs(cos(95. * p.x) * cos(95. * p.y)), 5.);
      vec3 navy = vec3(.05, .13, .18) + weave * .12;
      gl_FragColor = vec4(mix(navy, vec3(.88, .76, .52), max(seal, rim)), ink.a);
      return;
    }
    vec3 plates = texture2D(foil, uv).rgb;
    float plate = plates.r;
    vec2 offset = light - .5;
    float phase = dot(uv, vec2(.89, .47)) + dot(offset, vec2(.81, -.45)) + reveal * .65;
    vec3 spectrum = rainbow(phase * 1.6);
    float ribbon = pow(.5 + .5 * cos(TAU * (phase * 1.45 - .24)), 4.);
    vec2 paper = uv * vec2(1., 1.4);
    vec2 radial = paper - vec2(.5, (840. - 349.) / 600.);
    float radius = length(radial);
    float angle = atan(radial.y, radial.x + .00001);
    float medallion = 1. - smoothstep(.265, .278, radius);
    // Interlaced engine-turning on the medallion, lit across its radial grain.
    float cut = radius * 41. + 1.2 * cos(angle * 7. + radius * 20.);
    float etch = (.5 + .5 * cos(TAU * cut)) * (1. - smoothstep(.15, .55, fwidth(cut)));
    float fan = pow(.5 + .5 * cos(3. * angle - 6. * offset.x + 4. * offset.y + reveal * 3.), 4.);
    vec3 groundColor = rainbow(phase * 1.3 + .16);
    vec3 color = ink.rgb + plates.b * (
      groundColor * (.22 * ribbon + medallion * etch * (.10 + .36 * fan))
      + vec3(1., .97, .88) * flecks(paper, offset, reveal) * (.6 + ribbon)
    );
    color += plates.g * groundColor * (.26 + .74 * ribbon);
    color = mix(color, spectrum * .91 + vec3(.12), plate * (.34 + .59 * ribbon));
    color += plate * ribbon * vec3(.42, .33, .23);
    // A broader reflection crosses the paper independently of the engraved plate.
    vec2 distanceToLight = (uv - light) * vec2(.72, 1.);
    float glare = exp(-13. * dot(distanceToLight, distanceToLight));
    color += (1. - color) * (.11 * glare + .035 * ribbon);
    gl_FragColor = vec4(color, ink.a);
  }
`

type Pose = { x: number; y: number }
type Props = { card: TechCard; pose: Pose; onReady: () => void; onTap: () => void }

function PrintedCard({ card, pose, onReady, onTap }: Props) {
  const [textures, setTextures] = useState<Texture[] | null>(null)
  useEffect(() => {
    let active = true
    let loaded = 0
    const loader = new TextureLoader()
    const pair = [card.face, card.mask].map(src => loader.load(src, () => {
      loaded++
      if (active && loaded === 2) setTextures(pair)
    }))
    return () => {
      active = false
      pair.forEach(texture => texture.dispose())
    }
  }, [card])
  return textures && <CardMesh textures={textures} pose={pose} onReady={onReady} onTap={onTap} />
}

function CardMesh({ textures, pose, onReady, onTap }: Omit<Props, 'card'> & { textures: Texture[] }) {
  const [face, foil] = textures
  const mesh = useRef<Mesh>(null)
  const target = useRef(new Vector2(.5, .5))
  const invalidate = useThree(state => state.invalidate)
  const uniforms = useMemo(() => ({
    face: { value: face }, foil: { value: foil }, light: { value: new Vector2(.5, .5) },
    reveal: { value: 1 },
  }), [face, foil])
  const reduced = useRef(false)
  useEffect(() => {
    const preference = matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => { reduced.current = preference.matches; invalidate() }
    sync()
    preference.addEventListener('change', sync)
    onReady()
    return () => preference.removeEventListener('change', sync)
  }, [onReady, invalidate])
  useFrame((_, dt) => {
    if (!mesh.current) return
    target.current.set(.5 + pose.x * .48, .5 + pose.y * .48)
    const light = uniforms.light.value
    // A demand-rendered canvas can have a long gap before the first frame of a new card.
    const frameStep = Math.min(dt, .08)
    uniforms.reveal.value = reduced.current ? 0 : Math.max(0, uniforms.reveal.value - frameStep / 1.5)
    const blend = reduced.current ? 1 : 1 - Math.exp(-12 * frameStep)
    light.lerp(target.current, blend)
    const rotation = mesh.current.rotation
    const turn = 2 * Math.PI * MathUtils.smoothstep(1 - uniforms.reveal.value, 0, .7)
    rotation.set(
      reduced.current ? 0 : -(light.y - .5) * .52,
      reduced.current ? 0 : (light.x - .5) * .66 + turn,
      reduced.current ? 0 : -.026,
    )
    if (uniforms.reveal.value > 0 || light.distanceToSquared(target.current) > .0000005) invalidate()
  })
  return (
    <mesh ref={mesh} onClick={event => { if (event.delta < 5) onTap() }}>
      <planeGeometry args={[2, 2.8]} />
      <shaderMaterial uniforms={uniforms} vertexShader={vertexShader} fragmentShader={fragmentShader} side={DoubleSide} transparent forceSinglePass />
    </mesh>
  )
}

export default function CardScene({ card, onReady, onTap }: Omit<Props, 'pose'>) {
  const pose = useRef<Pose>({ x: -.28, y: .16 })
  const draw = useRef<(() => void) | undefined>(undefined)
  function move(x: number, y: number) {
    pose.current.x = MathUtils.clamp(x, -1, 1)
    pose.current.y = MathUtils.clamp(y, -1, 1)
    draw.current?.()
  }
  return (
    <div className="tech-interaction" onPointerMove={event => {
      const rect = event.currentTarget.getBoundingClientRect()
      move(2 * (event.clientX - rect.left) / rect.width - 1, 1 - 2 * (event.clientY - rect.top) / rect.height)
    }} onPointerLeave={() => move(-.28, .16)} onPointerCancel={() => move(-.28, .16)}
      onPointerUp={event => { if (event.pointerType !== 'mouse') move(-.28, .16) }}>
      <Canvas camera={{ position: [0, 0, 5], fov: 34 }} dpr={[1, 2]} frameloop="demand"
        gl={{ alpha: true, antialias: true }} onCreated={state => { draw.current = state.invalidate }}>
        <PrintedCard key={card.id} card={card} pose={pose.current} onReady={onReady} onTap={onTap} />
      </Canvas>
    </div>
  )
}
