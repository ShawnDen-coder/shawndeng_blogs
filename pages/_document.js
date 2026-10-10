import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  const meta = {
    title: 'Shawn Deng · AI Agent / DevOps / Homelab',
    description: 'Shawn Deng 的工程实践：DevOps、Homelab、Kubernetes 与 AI Agent。',
    image: 'https://shawnden-coder.github.io/shawndeng_blogs/og.svg'
  }

  return (
    <Html lang="zh-CN">
      <Head>
        <meta name="robots" content="follow, index" />
        <meta name="description" content={meta.description} />
        <meta property="og:site_name" content={meta.title} />
        <meta property="og:description" content={meta.description} />
        <meta property="og:title" content={meta.title} />
        <meta property="og:image" content={meta.image} />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
