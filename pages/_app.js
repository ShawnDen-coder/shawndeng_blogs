import 'nextra-theme-blog/style.css'
import Head from 'next/head'
import {useRouter} from 'next/router'

import '../styles/main.css'

export default function Nextra({Component, pageProps}) {
  const router = useRouter()
  const slug = router.pathname.split('/').filter(Boolean).pop()
  const postMeta = {Docker: ['Docker 基础入门', 'Docker 镜像、容器与日常清理的基础实践。'], K8S: ['K8S 基础入门', 'Kubernetes 常用命令与集群操作的基础实践。']}[slug]
  const title = postMeta?.[0] || 'Shawn Deng · AI Agent / DevOps / Homelab'
  const description = postMeta?.[1] || 'Shawn Deng 的工程实践：DevOps、Homelab、Kubernetes 与 AI Agent。'
  const base = process.env.NODE_ENV === 'production' ? '/shawndeng_blogs' : ''
  const canonical = `https://shawnden-coder.github.io${base}${router.asPath.split('?')[0]}`
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={canonical} />
        <meta property="og:image" content="https://shawnden-coder.github.io/shawndeng_blogs/og.svg" />
        <link rel="alternate" type="application/rss+xml" title="RSS" href={`${base}/feed.xml`} />
      </Head>
      <Component {...pageProps} />
    </>
  )
}
