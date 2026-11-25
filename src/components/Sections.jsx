import { motion } from 'motion/react'
import ReelCarousel from './ReelCarousel.jsx'
import { Bloom, HangingBlossoms, Leaf } from './Flowers.jsx'
import { collab, contact, dream, person } from '../content.js'

const inView = (d = 0) => ({
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.4 },
  transition: { duration: 0.9, delay: d, ease: [0.22, 1, 0.36, 1] },
})

export function Portfolio() {
  return (
    <section className="portfolio" id="portfolio">
      <Sparkles />
      <motion.p className="eyebrow light" {...inView()}>
        Portfolio
      </motion.p>
      <motion.h2 className="section-title light" {...inView(0.1)}>
        My <em>reels</em>
      </motion.h2>
      <ReelCarousel />
      <a className="btn btn-glass small" href="/portfolio">
        Open the portfolio on its own page
      </a>
    </section>
  )
}

export function Sparkles({ count = 26 }) {
  return (
    <div className="sparkles" aria-hidden>
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          style={{
            left: `${(i * 37) % 100}%`,
            top: `${(i * 53) % 100}%`,
            animationDelay: `${(i % 7) * 0.6}s`,
            fontSize: `${8 + (i % 4) * 4}px`,
          }}
        >
          ✦
        </span>
      ))}
    </div>
  )
}

const PAINTED = [
  { x: 4, y: 10, s: 120 }, { x: 86, y: 6, s: 90 }, { x: 90, y: 70, s: 140 }, { x: 2, y: 78, s: 80 },
  { x: 70, y: 40, s: 60 }, { x: 22, y: 46, s: 50 },
]

export function Dream() {
  return (
    <section className="dream">
      {PAINTED.map((b, i) => (
        <div key={i} className="painted" style={{ left: `${b.x}%`, top: `${b.y}%` }} aria-hidden>
          <Leaf size={b.s * 0.6} style={{ position: 'absolute', left: -b.s * 0.3, top: b.s * 0.7, transform: 'rotate(35deg)' }} />
          <Bloom size={b.s} petals={i % 2 ? 5 : 6} color="#a8142c" light="#d9405a" center="#5a0f17" />
        </div>
      ))}
      <motion.p className="eyebrow" {...inView()}>
        {dream.kicker}
      </motion.p>
      <motion.h2 className="dream-title" {...inView(0.1)}>
        <span className="script">{dream.title}</span>
      </motion.h2>
      <div className="dream-lines">
        {dream.lines.map((l, i) => (
          <motion.p key={i} {...inView(0.15 + i * 0.12)}>
            {l}
          </motion.p>
        ))}
      </div>
      <motion.p className="dream-close" {...inView(0.5)}>
        {dream.close}
      </motion.p>
    </section>
  )
}

export function Collab() {
  return (
    <section className="collab">
      <motion.div className="collab-card" {...inView()}>
        <Bloom size={160} className="collab-bloom" color="#7a1626" light="#a83244" center="#3d070d" />
        <p className="eyebrow light">Work with me</p>
        <h2 className="section-title light">{collab.title}</h2>
        <p className="collab-body">{collab.body}</p>
        <ul className="chips">
          {collab.notes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
        <div className="collab-actions">
          <a className="btn btn-solid" href="#contact">
            Start a conversation
          </a>
          <span className="muted">{collab.mediaKit}</span>
        </div>
      </motion.div>
    </section>
  )
}

const dev = import.meta.env.DEV

function ContactPill({ label, value, href, icon }) {
  if (!value && !dev) return null
  return (
    <a className={`pill ${value ? '' : 'pill-empty'}`} href={value ? href : undefined} target={value ? '_blank' : undefined} rel="noreferrer">
      <span className="pill-icon">{icon}</span>
      <span>
        <strong>{label}</strong>
        <small>{value || 'add in content.js'}</small>
      </span>
    </a>
  )
}

export function Contact() {
  const send = (e) => {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const subject = `Collaboration: ${f.get('brand') || f.get('name')}`
    const body = `${f.get('message')}\n\n${f.get('name')}${f.get('brand') ? `, ${f.get('brand')}` : ''}`
    window.location.href = `mailto:${contact.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  }
  return (
    <section className="contact" id="contact">
      <HangingBlossoms />
      <div className="leaf-shadow" aria-hidden />
      <div className="contact-inner">
        <motion.p className="eyebrow" {...inView()}>
          Contact
        </motion.p>
        <motion.h2 className="contact-title" {...inView(0.1)}>
          Let's <span className="script">talk</span>
        </motion.h2>
        <motion.div className="pills" {...inView(0.2)}>
          <ContactPill
            label="Instagram"
            value={contact.instagram && `@${contact.instagram}`}
            href={`https://instagram.com/${contact.instagram}`}
            icon={<svg viewBox="0 0 24 24" width="20" height="20"><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="1.8" /><circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" strokeWidth="1.8" /><circle cx="17.3" cy="6.7" r="1.2" fill="currentColor" /></svg>}
          />
          <ContactPill
            label="Email"
            value={contact.email}
            href={`mailto:${contact.email}`}
            icon={<svg viewBox="0 0 24 24" width="20" height="20"><rect x="3" y="5" width="18" height="14" rx="3" fill="none" stroke="currentColor" strokeWidth="1.8" /><path d="M4 7l8 6 8-6" fill="none" stroke="currentColor" strokeWidth="1.8" /></svg>}
          />
          <ContactPill
            label="WhatsApp"
            value={contact.whatsapp && `+${contact.whatsapp}`}
            href={`https://wa.me/${contact.whatsapp}`}
            icon={<svg viewBox="0 0 24 24" width="20" height="20"><path d="M4 20l1.3-4A8 8 0 1 1 8 19z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /><path d="M9 9.5c.5 2 2.5 4 4.5 4.6l1-1.1 1.8.8c-.3 1-1.2 1.6-2.2 1.5C11 15 8.9 12.9 8.6 10.1 8.5 9 9.2 8.1 10.1 7.9l.8 1.8z" fill="currentColor" /></svg>}
          />
        </motion.div>
        {(contact.email || dev) && (
          <motion.form className="contact-form" onSubmit={send} {...inView(0.3)}>
            <div className="row">
              <label>
                Your name
                <input name="name" required autoComplete="name" />
              </label>
              <label>
                Brand (optional)
                <input name="brand" autoComplete="organization" />
              </label>
            </div>
            <label>
              Message
              <textarea name="message" rows="4" required />
            </label>
            <button className="btn btn-solid" type="submit">
              Send by email
            </button>
          </motion.form>
        )}
      </div>
      <footer className="footer">
        <span>
          © {new Date().getFullYear()} {person.fullName}
        </span>
        <a href="/portfolio">Portfolio</a>
      </footer>
    </section>
  )
}
