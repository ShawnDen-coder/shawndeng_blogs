import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

type Quality = 'high' | 'medium' | 'low' | 'still' | 'failed'
type Preferences = { userPaused: boolean; setUserPaused: (value: boolean) => void; quality: Quality; setQuality: (value: Quality) => void; restricted: boolean }
const Context = createContext<Preferences | null>(null)
export function SceneProvider({ children }: { children: ReactNode }) {
  const [userPaused, setUserPaused] = useState(false)
  const [quality, setQuality] = useState<Quality>('high')
  const [restricted, setRestricted] = useState(false)
  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setRestricted(media.matches || innerWidth <= 320 || (innerWidth < 768 && innerHeight < 700) || !!(navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData)
    update(); media.addEventListener('change', update); window.addEventListener('resize', update)
    return () => { media.removeEventListener('change', update); window.removeEventListener('resize', update) }
  }, [])
  return <Context.Provider value={{userPaused,setUserPaused,quality,setQuality,restricted}}>{children}</Context.Provider>
}
export function useScenePreferences() { const value = useContext(Context); if (!value) throw new Error('SceneProvider missing'); return value }
export function SceneControl() {
  const {userPaused,setUserPaused,quality,restricted} = useScenePreferences()
  if (restricted || quality === 'still' || quality === 'failed') return <span className="scene-toggle" aria-label={restricted ? '背景已静止：系统或设备限制' : quality === 'failed' ? '背景已静止：绘制不可用' : '背景已静止：性能限制'}>背景已静止</span>
  return <button className="scene-toggle" onClick={() => setUserPaused(!userPaused)}>{userPaused ? '继续背景' : '暂停背景'}</button>
}
