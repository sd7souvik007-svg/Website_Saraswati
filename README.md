# Saraswati More

Personal portfolio site for Saraswati More.

- Cursor-tracking hero (one pre-extracted still per frame on a canvas), single-scroll floral story,
  reel carousel, collaborations and contact.
- `/portfolio` is the reel carousel on its own page.
- React + Vite, Motion, Lenis.

## Edit

- Text, links and contact details: `src/content.js`
- Reels: `public/reels/` (one `.mp4` and one `.jpg` cover per reel, listed in `content.js`)
- Portrait frames: `public/hero-v2/`. The site uses the reviewed desktop and Phone B assets by default.
- Music Mode: `public/music/` contains the edited soundtrack and its beat cues.

## Run

```
npm install
npm run dev
npm run build
```

Deployed on Vercel; every push to `main` redeploys.
