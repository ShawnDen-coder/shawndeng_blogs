import { useEffect, useMemo, useRef, useState } from 'react'
import { OceanRenderer } from './renderer'
import { buildMotionFrames, DEFAULT_MOTION } from './motion-curves'
import type { LabFrame, MotionSettings } from './motion-curves'
import './motion-lab.css'

const controls: Array<{ key: keyof MotionSettings; label: string; min: number; max: number; step: number; unit: string }> = [
  { key: 'period', label: '拍翼周期', min: 2.8, max: 5, step: .1, unit: 's' },
  { key: 'hold', label: '顶端滑行', min: .15, max: 1.2, step: .05, unit: 's' },
  { key: 'amplitude', label: '翼面幅度', min: .35, max: .9, step: .01, unit: 'rad' },
  { key: 'delay', label: '翼尖滞后', min: 0, max: .45, step: .01, unit: 's' },
  { key: 'twist', label: '后缘扭转', min: 0, max: .4, step: .01, unit: '' },
  { key: 'turn', label: '转弯侧倾', min: 0, max: .4, step: .01, unit: 'rad' }
]
const degrees = (rad: number) => rad * 180 / Math.PI
const tracks: Array<{ title: string; unit: string; range: [number, number]; lines: Array<{ key: 'root' | 'tip' | 'twist' | 'speed' | 'bank' | 'thrust' | 'tailSide' | 'tailLift'; label: string; color: string; dashed?: boolean; value: (f: LabFrame) => number }> }> = [
  { title: '拍翼与跟随', unit: '°', range: [-90, 90], lines: [
    { key: 'root', label: '内翼弯曲', color: '#7cbedb', value: f => degrees(f.root) },
    { key: 'tip', label: '翼尖卷曲', color: '#ddd9cf', dashed: true, value: f => degrees(f.tip) }
  ] },
  { title: '后缘与转弯', unit: '°', range: [-35, 35], lines: [
    { key: 'twist', label: '后缘扭转', color: '#7cbedb', value: f => degrees(f.twist) },
    { key: 'bank', label: '身体侧倾', color: '#ddd9cf', dashed: true, value: f => degrees(f.bank) }
  ] },
  { title: '尾尖延迟跟随', unit: '模型长度', range: [-.2, .2], lines: [
    { key: 'tailSide', label: '侧向弯曲', color: '#7cbedb', value: f => f.tailSide },
    { key: 'tailLift', label: '轻微起伏', color: '#ddd9cf', dashed: true, value: f => f.tailLift }
  ] },
  { title: '拍翼产生的推进', unit: '相对值', range: [0, 6], lines: [
    { key: 'thrust', label: '视觉推力', color: '#7cbedb', value: f => f.thrust }
  ] },
  { title: '推进后的速度', unit: '场景短边/s', range: [0, .16], lines: [
    { key: 'speed', label: '积分速度', color: '#7cbedb', value: f => f.speed }
  ] }
]

export function MantaMotionLab() {
  const [settings, setSettings] = useState<MotionSettings>({ ...DEFAULT_MOTION })
  const [time, setTime] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [rate, setRate] = useState(.5)
  const [follow, setFollow] = useState(true)
  const [size, setSize] = useState({ width: 900, height: 430 })
  const [canvasError, setCanvasError] = useState(false)
  const canvas = useRef<HTMLCanvasElement>(null)
  const renderer = useRef<OceanRenderer | null>(null)
  const timeRef = useRef(0)
  const frames = useMemo(() => buildMotionFrames(settings, size.width, size.height), [settings, size])
  const duration = settings.period * 4
  const shownTime = Math.min(time, duration)
  const current = frames[Math.min(frames.length - 1, Math.round(shownTime * 120))]
  const seek = (value: number) => {
    setPlaying(false)
    timeRef.current = Math.max(0, Math.min(duration, value))
    setTime(timeRef.current)
  }
  useEffect(() => {
    const element = canvas.current
    const ctx = element?.getContext('2d')
    if (!element || !ctx) { setCanvasError(true); return }
    renderer.current = new OceanRenderer(ctx)
    const resize = () => {
      const { width, height } = element.getBoundingClientRect()
      if (width && height) setSize({ width, height })
    }
    const observer = new ResizeObserver(resize)
    observer.observe(element)
    resize()
    return () => { observer.disconnect(); renderer.current = null }
  }, [])
  useEffect(() => {
    renderer.current?.resize(size.width, size.height, window.devicePixelRatio || 1)
  }, [size])
  useEffect(() => {
    let disposed = false
    const draw = () => {
      if (!disposed) renderer.current?.draw(shownTime, 0, 0, undefined, [
        { ...current.pose, ...(follow ? { x: .5, y: .54 } : {}) }
      ])
    }
    draw()
    document.fonts.ready.then(draw)
    return () => { disposed = true }
  }, [current, shownTime, follow, size])
  useEffect(() => {
    if (!playing) return
    let raf = 0, previous = 0
    const frame = (now: number) => {
      if (document.hidden) { previous = 0; raf = requestAnimationFrame(frame); return }
      if (previous) timeRef.current = Math.min(duration, timeRef.current + Math.min(.05, (now - previous) / 1000) * rate)
      previous = now
      setTime(timeRef.current)
      if (timeRef.current >= duration) { setPlaying(false); return }
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [playing, rate, duration])
  const update = (key: keyof MotionSettings, value: number) => {
    setPlaying(false)
    timeRef.current = 0
    setTime(0)
    setSettings(previous => ({ ...previous, [key]: value }))
  }
  return (
    <section className="motion-lab" data-ui>
      <header className="motion-lab-heading">
        <div><h1>蝠鲼 · 动作曲线</h1><p>先校准单只。沿时间轴观察翼面如何带动身体前进。</p></div>
        <span>实验预览 · 未应用到主页</span>
      </header>
      <div className="motion-workspace">
        <div className="motion-preview">
          <div className="motion-stage">
            <canvas ref={canvas} aria-label="单只 ASCII 蝠鲼，当前姿态由下方时间轴控制" />
            {canvasError && <p role="alert">Canvas 无法加载，仍可查看和调整下方曲线。</p>}
            <div className="motion-stage-caption"><span>{current.stage} · {follow ? '跟随观察' : '固定视角'}</span><span>{shownTime.toFixed(2)} s</span></div>
          </div>
          <div className="motion-transport">
            <button className="motion-play" onClick={() => {
              if (shownTime >= duration) { timeRef.current = 0; setTime(0) }
              setPlaying(value => !value)
            }}>{playing ? '暂停' : shownTime >= duration ? '重新播放' : '播放'}</button>
            <button onClick={() => seek(shownTime - 1 / 30)} disabled={shownTime === 0}>上一帧</button>
            <button onClick={() => seek(shownTime + 1 / 30)} disabled={shownTime >= duration}>下一帧</button>
            <label>速度 <select value={rate} onChange={event => setRate(Number(event.target.value))} aria-label="播放速度">
              <option value={.25}>0.25×</option><option value={.5}>0.5×</option><option value={1}>1×</option>
            </select></label>
            <label className="motion-follow"><input type="checkbox" checked={follow} onChange={event => setFollow(event.target.checked)} />跟随观察</label>
          </div>
          <label className="motion-timeline">时间轴 <output>{shownTime.toFixed(2)} / {duration.toFixed(2)} s</output>
            <input aria-label="动画时间轴" type="range" min={0} max={duration} step={1 / 120} value={shownTime} onChange={event => seek(Number(event.target.value))} />
          </label>
          <div className="motion-charts">
            {tracks.map(track => {
              const y = (value: number) => 82 - (value - track.range[0]) / (track.range[1] - track.range[0]) * 72
              return <div className="motion-track" key={track.title}>
                <div className="motion-track-heading"><h2>{track.title}</h2><div>{track.lines.map(line => <span key={line.key} style={{ color: line.color }}>{line.label} {line.value(current).toFixed(['speed', 'tailSide', 'tailLift'].includes(line.key) ? 3 : 1)}{track.unit === '°' ? '°' : ''}</span>)}</div></div>
                <svg viewBox="0 0 800 104" role="img" aria-label={`${track.title}，横轴 0 至 ${duration.toFixed(1)} 秒，纵轴单位 ${track.unit}`} onPointerDown={event => {
                  const rect = event.currentTarget.getBoundingClientRect()
                  seek(((event.clientX - rect.left) / rect.width * 800 - 34) / 760 * duration)
                }}>
                  {[track.range[0], 0, track.range[1]].filter((v, i, all) => all.indexOf(v) === i).map(value => <g key={value}><path d={`M34 ${y(value)}H794`} stroke="#353535" strokeWidth=".6" /><text x="0" y={y(value) + 3} fill="#9a9a9a" fontSize="9">{value}</text></g>)}
                  {track.lines.map(line => <path key={line.key} d={frames.filter((_, i) => i % 8 === 0).map((f, i) => `${i ? 'L' : 'M'}${34 + f.time / duration * 760},${y(line.value(f))}`).join(' ')} stroke={line.color} strokeWidth="1.6" strokeDasharray={line.dashed ? '5 4' : undefined} fill="none" />)}
                  <path d={`M${34 + shownTime / duration * 760} 5V87`} stroke="#eee" strokeWidth="1" />
                  {[0, 1, 2, 3, 4].map(n => <text key={n} x={34 + n / 4 * 760} y="101" textAnchor={n === 4 ? 'end' : 'start'} fill="#9a9a9a" fontSize="9">{(duration * n / 4).toFixed(1)} s</text>)}
                </svg>
              </div>
            })}
          </div>
        </div>
        <aside className="motion-settings" aria-label="运动参数">
          <h2>调整动作</h2><p>修改参数会回到起点。播放到末尾停止。</p>
          {controls.map(control => <label key={control.key}>{control.label}<output>{settings[control.key].toFixed(2)} {control.unit}</output>
            <input type="range" min={control.min} max={control.max} step={control.step} value={settings[control.key]} onChange={event => update(control.key, Number(event.target.value))} />
          </label>)}
          <button onClick={() => { setPlaying(false); timeRef.current = 0; setTime(0); setSettings({ ...DEFAULT_MOTION }) }}>恢复默认参数</button>
          <p className="motion-note">曲线是基于研究特征的视觉近似，不是流体仿真。上下拍均参与推进，顶端保持上反姿态，身体侧倾与路径转弯使用同一信号。</p>
          <a href="https://www.mdpi.com/2226-4310/3/3/20" target="_blank" rel="noreferrer">拍翼研究 ↗</a>
        </aside>
      </div>
    </section>
  )
}
