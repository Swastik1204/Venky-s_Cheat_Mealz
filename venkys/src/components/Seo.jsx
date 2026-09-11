// Seo — per-route document head. React 19 hoists <title>/<meta>/<link>
// rendered anywhere in the tree into <head> and dedupes by attribute, so a
// route mounting this replaces the previous route's tags automatically —
// no head-manager library needed.
const SITE = 'https://venkys-durgapur.web.app'
const DEFAULT_IMAGE = `${SITE}/icons/og-image.jpg`

export default function Seo({ title, description, path = '/', image = DEFAULT_IMAGE }) {
  const url = `${SITE}${path}`
  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={image} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
    </>
  )
}
