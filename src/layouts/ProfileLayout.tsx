import type { ReactNode } from 'react'
import { ProfileIntro } from '../components/ProfileIntro'
export function ProfileLayout({ children, home = false }: { children: ReactNode; home?: boolean }) {
  return <div className="profile-layout"><ProfileIntro home={home}/><div className="profile-content" data-scene-protect>{children}</div></div>
}
