const YEAR = new Date().getFullYear()

export default {
  footer: (
    <small style={{display: 'block', marginTop: '8rem'}}>
      <time>{YEAR}</time>
      © Shawn Deng.
      <a href={`${process.env.NODE_ENV === 'production' ? '/shawndeng_blogs' : ''}/feed.xml`}>RSS</a>
      <style jsx>{`
          a {
              float: right;
          }

          @media screen and (max-width: 480px) {
              article {
                  padding-top: 2rem;
                  padding-bottom: 4rem;
              }
          }
      `}</style>
    </small>
  )
}
