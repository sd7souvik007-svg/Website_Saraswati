export default function Nav({ home = false }) {
  const p = home ? '/' : ''
  return (
    <nav className="nav" aria-label="Main">
      <a href={`${p}#portfolio`}>Work</a>
      <a href={`${p}#about`}>About</a>
      <a href={`${p}#contact`}>Contact</a>
    </nav>
  )
}
