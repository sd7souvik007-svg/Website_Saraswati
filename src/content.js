// Everything she might want to change lives here.
// Lines marked DRAFT were written by Claude and need her approval before the site goes live.
// Contact values left empty show as "add in content.js" while developing and are hidden live.

export const person = {
  name: 'Saraswati',
  fullName: 'Saraswati More',
  // DRAFT
  heroLine: 'Beauty, aesthetics, lifestyle and fitness, the way I actually live them.',
}

export const contact = {
  instagram: '', // handle without @, e.g. 'saraswati.more'
  email: '', // public email
  whatsapp: '', // full number with country code, digits only, e.g. '919800000000'
}

// DRAFT: the statement that lights up word by word
export const intro =
  'I make beauty feel personal. Soft glam, warm light, honest skincare and the little rituals that make a day feel like mine.'

// Stand-in images until the ChatGPT scenes arrive (asset package, Step 2).
export const worlds = [
  {
    key: 'beauty',
    title: 'Beauty',
    // DRAFT
    line: 'Soft glam, blush that looks like a real flush, and products I would actually buy again.',
    image: '/reels/fae-grwm.jpg',
    scene: '/scenes/scene-beauty.png',
  },
  {
    key: 'aesthetic',
    title: 'Aesthetic',
    // DRAFT
    line: 'Florals, warm light and colour stories you can almost feel through the screen.',
    image: '/reels/ring-to-radiance.jpg',
    scene: '/scenes/scene-model.png',
  },
  {
    key: 'lifestyle',
    title: 'Lifestyle',
    // DRAFT
    line: 'Slow mornings, festive evenings and everything in between.',
    image: '/reels/bebo-swirl.jpg',
    scene: '/scenes/scene-lifestyle.png',
  },
  {
    key: 'fitness',
    title: 'Fitness',
    // DRAFT
    line: 'Moving to feel strong and glowing. Coming soon to the feed.',
    image: null,
    scene: '/scenes/scene-fitness.png',
  },
]

export const reels = [
  { id: 'ring-to-radiance', title: 'Ring to Radiance', tag: 'Traditional' },
  { id: 'fae-grwm', title: 'Blush & Glow GRWM', tag: 'Beauty' },
  { id: 'bebo-lip-balm', title: 'Bebo Mai Bebo', tag: 'Lip care' },
  { id: 'bebo-swirl', title: 'Tinted Lips', tag: 'Beauty' },
  { id: 'diwali', title: 'Diwali ki Shaam', tag: 'Festive' },
]

// DRAFT: goals, stated as goals
export const dream = {
  kicker: 'Next',
  title: 'the ramp.',
  lines: [
    'Walking for designers.',
    'Fronting beauty campaigns.',
    'Opening PR boxes from the brands I grew up wanting to try.',
  ],
  close: 'That is the plan. This is the beginning.',
}

// DRAFT
export const collab = {
  title: 'Open for brand collaborations',
  body: 'Beauty, skincare, fashion and lifestyle brands: let us make something that feels like a story, not an ad.',
  notes: ['Reels and stories', 'Product launches', 'Event appearances'],
  mediaKit: 'Media kit on request',
}
