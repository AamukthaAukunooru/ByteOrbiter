export const PLANETS = [
  {
    name: 'Mercury',
    body: 'Mercury',
    color: '#b5b5b5',
    radius: 0.38,
    emoji: '☿',
    facts: [
      'Smallest planet in the solar system',
      'A year on Mercury lasts just 88 Earth days',
      'Surface temperatures swing from -180°C to 430°C',
      'Has no atmosphere to speak of',
    ],
  },
  {
    name: 'Venus',
    body: 'Venus',
    color: '#e8cda0',
    radius: 0.95,
    emoji: '♀',
    facts: [
      'Hottest planet — hotter than Mercury despite being farther from the Sun',
      'Rotates backwards compared to most planets',
      'A day on Venus is longer than its year',
      'Thick clouds of sulfuric acid blanket the surface',
    ],
  },
  {
    name: 'Earth',
    body: 'Earth',
    color: '#4fa3e0',
    radius: 1.0,
    emoji: '🌍',
    facts: [
      'The only known planet with life',
      'About 71% of the surface is covered by water',
      'Has one natural satellite — the Moon',
      'Protected by a strong magnetic field',
    ],
  },
  {
    name: 'Mars',
    body: 'Mars',
    color: '#c1440e',
    radius: 0.53,
    emoji: '♂',
    facts: [
      'Home to Olympus Mons, the tallest volcano in the solar system',
      'Has two small moons: Phobos and Deimos',
      'A Martian day is 24 hours and 37 minutes',
      'Evidence of ancient riverbeds on its surface',
    ],
  },
  {
    name: 'Jupiter',
    body: 'Jupiter',
    color: '#c88b3a',
    radius: 11.2,
    emoji: '♃',
    facts: [
      'Largest planet — 1,300 Earths could fit inside',
      'The Great Red Spot is a storm larger than Earth',
      'Has at least 95 known moons',
      'A day on Jupiter lasts only 10 hours',
    ],
  },
  {
    name: 'Saturn',
    body: 'Saturn',
    color: '#e4d191',
    radius: 9.45,
    emoji: '♄',
    rings: { innerMult: 1.2, outerMult: 2.2, color: '#c8b97a', tilt: 27 },
    facts: [
      'Its iconic rings are made of ice and rock',
      'Less dense than water — it would float!',
      'Has 146 known moons, including Titan with a thick atmosphere',
      'Winds can reach 1,800 km/h',
    ],
  },
  {
    name: 'Uranus',
    body: 'Uranus',
    color: '#7de8e8',
    radius: 4.0,
    emoji: '⛢',
    facts: [
      'Rotates on its side — axial tilt of 98°',
      'Has 13 known rings',
      'Coldest planetary atmosphere in the solar system (-224°C)',
      'A year on Uranus lasts 84 Earth years',
    ],
  },
  {
    name: 'Neptune',
    body: 'Neptune',
    color: '#3f54ba',
    radius: 3.88,
    emoji: '♆',
    facts: [
      'Winds reach 2,100 km/h — fastest in the solar system',
      'Takes 165 Earth years to orbit the Sun',
      'Has 16 known moons; Triton orbits backwards',
      'Was predicted mathematically before it was observed',
    ],
  },
]

export const SUN_DATA = {
  name: 'Sun',
  body: 'Sun',
  color: '#FDB813',
  emoji: '☀',
  facts: [
    'Contains 99.86% of the total mass of the entire Solar System',
    'Light takes ~8 minutes 20 seconds to travel from the Sun to Earth',
    'Surface temperature is ~5,500°C; the core reaches ~15 million°C',
    'The Sun will exhaust its hydrogen and become a red giant in ~5 billion years',
  ],
}

export const MOON_DATA = {
  name: 'Moon',
  body: 'Moon',
  color: '#c8c8c8',
  radius: 0.27, // relative to Earth
  emoji: '🌕',
  facts: [
    'Only natural satellite of Earth, at ~384,400 km away',
    'Causes ocean tides through its gravitational pull',
    'Always shows the same face — its rotation matches its orbital period',
    'The Moon is slowly drifting away from Earth at ~3.8 cm per year',
  ],
}

// Scale factors for display (not real scale — for readability)
// Orbital radii in AU → mapped to scene units (1 AU = 6 scene units)
export const AU_SCALE = 6

// Planet mesh radius in scene units (log scale for visibility)
export const planetDisplayRadius = (realRadius) =>
  Math.max(0.15, Math.log10(realRadius + 1) * 0.6)
