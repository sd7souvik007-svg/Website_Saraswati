import Cursor from './components/Cursor.jsx'
import Nav from './components/Nav.jsx'
import ReelCarousel from './components/ReelCarousel.jsx'
import Petals from './components/Petals.jsx'
import { contact, person } from './content.js'

// The carousel on its own: a link she can send to brands.
export default function PortfolioPage() {
  return (
    <>
      <Cursor />
      <Nav home />
      <main className="portfolio-page">
        <Petals />
        <header className="pp-head">
          <a href="/" className="pp-name">
            {person.fullName}
          </a>
          <p className="eyebrow light">Portfolio</p>
          <h1 className="section-title light">
            Selected <em>reels</em>
          </h1>
        </header>
        <ReelCarousel />
        <div className="pp-actions">
          <a className="btn btn-solid" href="/#collaborate">
            Work with me
          </a>
          {contact.instagram && (
            <a className="btn btn-glass" href={`https://www.instagram.com/${contact.instagram}`} target="_blank" rel="noreferrer">
              @{contact.instagram}
            </a>
          )}
        </div>
      </main>
    </>
  )
}
