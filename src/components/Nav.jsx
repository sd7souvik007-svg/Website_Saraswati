import { useEffect, useId, useRef, useState } from 'react'
import { contact } from '../content.js'

export default function Nav({ home = false }) {
  const p = home ? '/' : ''
  const [contactOpen, setContactOpen] = useState(false)
  const contactRef = useRef(null)
  const contactButtonRef = useRef(null)
  const contactId = useId()

  useEffect(() => {
    if (!contactOpen) return

    const dismissOutside = (event) => {
      if (!contactRef.current?.contains(event.target)) setContactOpen(false)
    }
    const dismissOnEscape = (event) => {
      if (event.key !== 'Escape') return
      setContactOpen(false)
      contactButtonRef.current?.focus()
    }

    document.addEventListener('pointerdown', dismissOutside)
    document.addEventListener('focusin', dismissOutside)
    document.addEventListener('keydown', dismissOnEscape)
    return () => {
      document.removeEventListener('pointerdown', dismissOutside)
      document.removeEventListener('focusin', dismissOutside)
      document.removeEventListener('keydown', dismissOnEscape)
    }
  }, [contactOpen])

  return (
    <nav className="nav" aria-label="Main">
      <a href={`${p}#portfolio`}>Work</a>
      <a href={`${p}#about`}>About</a>
      <a href={`${p}#collaborate`}>Collaborate</a>
      {(contact.email || contact.instagram) && (
        <div className="nav-contact" ref={contactRef}>
          <button
            className="nav-contact-toggle"
            ref={contactButtonRef}
            type="button"
            aria-expanded={contactOpen}
            aria-controls={contactId}
            onClick={() => setContactOpen((open) => !open)}
          >
            Contact
            <svg viewBox="0 0 12 12" width="11" height="11" aria-hidden="true">
              <path d="m3 4.5 3 3 3-3" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div className="nav-contact-panel" id={contactId} hidden={!contactOpen}>
            {contact.email && (
              <a href={`mailto:${contact.email}`}>
                <strong>Work email</strong>
                <span>{contact.email}</span>
              </a>
            )}
            {contact.instagram && (
              <a href={`https://www.instagram.com/${contact.instagram}`} target="_blank" rel="noreferrer">
                <strong>Instagram</strong>
                <span>@{contact.instagram}</span>
              </a>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
