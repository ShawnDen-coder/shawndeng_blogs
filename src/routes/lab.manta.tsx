import { createFileRoute } from '@tanstack/react-router'
import { MantaMotionLab } from '../components/ocean/MantaMotionLab'
import { pageHead } from '../lib/seo'

export const Route = createFileRoute('/lab/manta')({
  head: () => {
    const head = pageHead('蝠鲼动作曲线', '单只蝠鲼的拍翼、推进和转向调试预览。', '/lab/manta')
    return { ...head, meta: [...head.meta, { name: 'robots', content: 'noindex, nofollow' }] }
  },
  component: MantaMotionLab
})
