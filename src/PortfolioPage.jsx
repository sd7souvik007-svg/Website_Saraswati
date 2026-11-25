import Cursor from './components/Cursor.jsx'
import ReelCarousel from './components/ReelCarousel.jsx'
import { Sparkles } from './components/Sections.jsx'
import { Bloom } from './components/Flowers.jsx'
import { contact, person } from './content.js'

// The carousel on its own: a link she can send to brands.
export default function PortfolioPage() {
  return (
    <>
      <Cursor />
      <main className="portfolio-page">
        <Sparkles count={40} />
        <Bloom size={260} className="pp-bloom a" color="#55101a" light="#6d1722" center="#430b13" />
        <Bloom size={200} className="pp-bloom b" petals={5} color="#55101a" light="#6d1722" center="#430b13" />
        <header className="pp-head">
          <a href="/" className="pp-name">
            {person.fullName}
          </a>
          <p className="eyebrow light">Portfolio</p>
          <h1 className="section-title light">
            My <em>reels</em>
          </h1>
        </header>
        <ReelCarousel />
        <div className="pp-actions">
          <a className="btn btn-solid" href="/#contact">
            Work with me
          </a>
          {contact.instagram && (
            <a className="btn btn-glass" href={`https://instagram.com/${contact.instagram}`} target="_blank" rel="noreferrer">
              @{contact.instagram}
            </a>
          )}
        </div>
      </main>
    </>
  )
}
