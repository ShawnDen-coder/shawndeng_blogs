import assert from 'node:assert/strict'
import { createSceneLoop, paintProtected, selectRenderer, createBudgetTracker } from '../src/components/background/scene-runtime.ts'

let next = 0, queue = new Map(), draws = []
const loop = createSceneLoop({ request: fn => { const id = ++next; queue.set(id, fn); return id }, cancel: id => queue.delete(id), draw: t => draws.push(t), interval: () => 1000 / 15, initialPhase: 31 })
const step = now => { const callbacks = [...queue.values()]; queue.clear(); callbacks.forEach(fn => fn(now)) }
loop.update({ hidden: false, paused: false, restricted: false, frozen: false, still: false })
assert.equal(queue.size, 1)
step(100); step(200)
assert.equal(draws.length, 2)
const beforePause = draws.at(-1)
loop.update({ hidden: false, paused: true, restricted: false, frozen: false, still: false })
assert.equal(queue.size, 0)
loop.update({ hidden: true, paused: false, restricted: false, frozen: false, still: false })
assert.equal(queue.size, 0)
loop.update({ hidden: false, paused: false, restricted: false, frozen: false, still: false })
step(10000)
assert.equal(draws.at(-1), beforePause, 'resuming does not catch up elapsed time')
for (const blocked of ['restricted', 'frozen', 'still']) {
  loop.update({ hidden: false, paused: false, restricted: false, frozen: false, still: false, [blocked]: true })
  assert.equal(queue.size, 0, `${blocked} cancels the active frame`)
}
loop.update({ hidden: false, paused: false, restricted: false, frozen: false, still: false })
loop.dispose(); assert.equal(queue.size, 0)
loop.update({ hidden: false, paused: false, restricted: false, frozen: false, still: false }); assert.equal(queue.size, 0)

let calls = []
const ctx = { clearRect: (...x) => calls.push(['clear',...x]), save: () => calls.push(['save']), restore: () => calls.push(['restore']), scale: () => {}, fillRect: (...x) => calls.push(['mask',...x]), set globalCompositeOperation(x) {}, set globalAlpha(x) {} }
assert.equal(paintProtected(ctx, { width: 400, height: 200, viewportWidth: 400, viewportHeight: 200, rects: null, paint: () => calls.push(['paint']) }), false)
assert.equal(calls.some(x => x[0] === 'paint'), false, 'unmeasured protection keeps the scene blank')
calls=[]
assert.equal(paintProtected(ctx, { width: 400, height: 200, viewportWidth: 400, viewportHeight: 200, rects: [{left: 50,top: 40,width:100,height:30}], paint: () => calls.push(['paint']) }), true)
assert.deepEqual(calls.find(x => x[0] === 'mask'), ['mask',26,16,148,78])
calls=[]
assert.equal(paintProtected(ctx, { width: 400, height: 200, viewportWidth: 400, viewportHeight: 200, rects: [{left: 1,top: 1,width:10,height:10}], paint: () => { throw Error('render failed') } }), false)
assert.equal(calls.filter(x => x[0] === 'clear').length, 2, 'render errors clear any partial image')
console.log('Undertow scheduling, resume, cleanup and protected compositing passed')

let released = 0
const fallback = { draw() {}, destroy() { released++ } }
assert.equal(selectRenderer(() => { throw Error('GPU unavailable') }, () => fallback), fallback)
assert.equal(selectRenderer(() => null, () => null), null, 'no renderer must leave a plain background')
const failed = selectRenderer(() => null, () => { throw Error('cache failed') })
assert.equal(failed, null)
fallback.destroy(); assert.equal(released, 1)
console.log('Undertow renderer initialization failure paths passed')

const budget = createBudgetTracker()
for (let i=0; i<119; i++) assert.equal(budget.sample(8, 6), false)
assert.equal(budget.sample(8, 6), true, 'two slow windows cause a downgrade')
for (let i=0; i<60; i++) budget.sample(8, 6)
for (let i=0; i<60; i++) assert.equal(budget.sample(1, 6), false, 'a good window resets consecutive failures')
console.log('Undertow measured budget windows passed')

// Exercise the same protected drawing controller used by UndertowScene.
const { createProtectedRenderer } = await import('../src/components/background/scene-runtime.ts')
let primaryDraws=0, fallbackDraws=0, fallbackCreates=0, primaryDestroyed=0, fallbackDestroyed=0, resets=0, stopped=0
const broken = { draw() { primaryDraws++; throw Error('lost GPU') }, destroy() { primaryDestroyed++ } }
const backup = { draw() { fallbackDraws++; if (fallbackDraws > 1) throw Error('2d failure') }, destroy() { fallbackDestroyed++ } }
const pipeline = createProtectedRenderer({ ctx, reset: () => resets++, fallback: () => { fallbackCreates++; return backup }, stop: () => stopped++ })
pipeline.setPrimary(broken)
const geometry = { width:400, height:200, viewportWidth:400, viewportHeight:200, rects:null }
assert.equal(pipeline.draw(geometry, 31, false), 'unready')
assert.equal(primaryDraws, 0); assert.equal(fallbackCreates, 0)
geometry.rects=[{left:50,top:40,width:100,height:30}]
assert.equal(pipeline.draw(geometry, 31, false), 'drawn')
assert.equal(primaryDestroyed, 1); assert.equal(fallbackCreates, 1); assert.equal(fallbackDraws, 1); assert.equal(resets, 1)
assert.equal(pipeline.draw(geometry, 32, false), 'failed')
assert.equal(fallbackDestroyed, 1); assert.equal(stopped, 1); assert.equal(resets, 2)
assert.equal(pipeline.draw(geometry, 33, false), 'failed')
assert.equal(fallbackCreates, 1); assert.equal(stopped, 1)
pipeline.dispose()
console.log('Protected renderer runtime failure and cleanup passed')
const { createCanvasRenderer } = await import('../src/components/background/undertow-renderer.ts')
const oldDocument=globalThis.document
const makeContext=()=>({ createLinearGradient:()=>({addColorStop(){}}), fillRect(){}, set fillStyle(value) {} })
globalThis.document={createElement:()=>({width:0,height:0,getContext:()=>makeContext()})}
const canvasRenderer=createCanvasRenderer(false,false,10000)
let alpha=1, images=[]
const renderContext={save(){},restore(){},fillRect(){},set fillStyle(value){},set globalAlpha(value){alpha=value},drawImage(...args){images.push({alpha,args})}}
canvasRenderer.draw(renderContext,800,500,0,false)
const firstAlphas=images.slice(1).map(x=>x.alpha)
assert.equal(images.length,3,'base and two foam layers are composited')
images=[]; canvasRenderer.draw(renderContext,800,500,1/(2*.026),false)
const secondAlphas=images.slice(1).map(x=>x.alpha)
assert.ok(firstAlphas[0] < secondAlphas[0] && firstAlphas[1] > secondAlphas[1], 'swell layers alternate half a cycle apart')
canvasRenderer.destroy(); globalThis.document=oldDocument
console.log('Canvas renderer cached alternating foam layers passed')
let pending=new Map(), nextFrame=0, measurements=0, painted=0
const coalesced=createSceneLoop({request:fn=>{const id=++nextFrame;pending.set(id,fn);return id},cancel:id=>pending.delete(id),interval:()=>100,initialPhase:31,draw:()=>{measurements++;painted++}})
const fire=now=>{const callbacks=[...pending.values()];pending.clear();callbacks.forEach(fn=>fn(now))}
coalesced.update({hidden:false,paused:true,restricted:false,frozen:false,still:false})
for(let i=0;i<30;i++) coalesced.requestRedraw()
assert.equal(pending.size,1);fire(1000);assert.equal(measurements,1)
for(let i=0;i<30;i++) coalesced.requestRedraw()
fire(1016);assert.equal(painted,1,'scroll bursts cannot bypass the frame interval')
fire(1100);assert.equal(painted,2);assert.equal(pending.size,0,'static redraw does not leave an animation loop')
coalesced.update({hidden:true,paused:true,restricted:false,frozen:false,still:false});coalesced.requestRedraw();assert.equal(pending.size,0)
coalesced.dispose()
console.log('Coalesced static measurement and frame pacing passed')
let generated=0, clock=0
const previousPerformance=globalThis.performance, previousDocument=globalThis.document
globalThis.performance={now:()=>{clock+=10;return clock}}
globalThis.document={createElement:()=>({width:0,height:0,getContext:()=>({createLinearGradient:()=>({addColorStop(){}}),fillRect(){generated++},set fillStyle(value){}})})}
assert.equal(createCanvasRenderer(false,false,40),null,'slow cache initialization must abort')
assert.ok(generated<5000,'budget is checked while generating, not only afterward')
globalThis.performance=previousPerformance;globalThis.document=previousDocument
console.log('Canvas initialization budget abort passed')
const { createSceneController } = await import('../src/components/background/scene-runtime.ts')
let frames=new Map(), sequence=0, geometryReads=0, renderCalls=0, samples=0, timed=0
const actualPipeline=createProtectedRenderer({ctx,reset(){},fallback:()=>null,stop(){}})
actualPipeline.setPrimary({draw(){renderCalls++},destroy(){}})
const geometry2={width:400,height:200,viewportWidth:400,viewportHeight:200,rects:[{left:10,top:10,width:100,height:50}]}
const controller=createSceneController({request:fn=>{const id=++sequence;frames.set(id,fn);return id},cancel:id=>frames.delete(id),interval:()=>100,initialPhase:31,clear(){},now:()=>10,onTiming:()=>timed++,measure(){geometryReads++},draw:phase=>{actualPipeline.draw(geometry2,phase,false);samples++}})
const runFrame=now=>{const callbacks=[...frames.values()];frames.clear();callbacks.forEach(fn=>fn(now))}
controller.update({hidden:false,paused:true,restricted:false,frozen:false,still:false})
for(let i=0;i<50;i++)controller.invalidate()
runFrame(1000);assert.equal(geometryReads,1);assert.equal(renderCalls,1);assert.equal(samples,1)
for(let i=0;i<50;i++)controller.invalidate()
runFrame(1016);assert.equal(renderCalls,1);runFrame(1100);assert.equal(geometryReads,2);assert.equal(renderCalls,2);assert.equal(samples,2);assert.equal(timed,2)
controller.dispose();actualPipeline.dispose()
console.log('Product controller and protected renderer integration passed')
