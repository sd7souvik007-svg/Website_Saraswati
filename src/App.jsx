import Hero from './components/Hero.jsx'
import Nav from './components/Nav.jsx'
import Cursor from './components/Cursor.jsx'
import Intro from './components/Intro.jsx'
import Worlds from './components/Worlds.jsx'
import Petals from './components/Petals.jsx'
import { Collab, Contact, Dream, Portfolio } from './components/Sections.jsx'
import useSmoothScroll from './useSmoothScroll.js'

export default function App() {
  useSmoothScroll()
  return (
    <>
      <Cursor />
      <Nav />
      <main>
        <Hero />
        <div className="story">
          <Petals />
          <Intro />
          <Worlds />
          <Portfolio />
          <Dream />
          <Collab />
          <Contact />
        </div>
      </main>
    </>
  )
}
