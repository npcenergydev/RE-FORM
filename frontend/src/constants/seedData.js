// Seed data for Re:form demo platform
// Provides 6 realistic demo materials and 3 completed artworks so the dashboard and gallery never look empty.

// Inline SVG Data URIs for demo artwork images so they display reliably offline and on any device
const ARTWORK_SVG_1 = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 450" width="600" height="450">
  <defs>
    <linearGradient id="denimGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="%231E3A8A"/>
      <stop offset="50%" stop-color="%231E293B"/>
      <stop offset="100%" stop-color="%230F172A"/>
    </linearGradient>
    <pattern id="stitch" width="20" height="20" patternUnits="userSpaceOnUse">
      <line x1="0" y1="10" x2="12" y2="10" stroke="%23D97706" stroke-width="2" stroke-dasharray="4 4"/>
    </pattern>
  </defs>
  <rect width="600" height="450" fill="%230B1120"/>
  <rect x="40" y="40" width="520" height="370" rx="16" fill="url(%23denimGrad)"/>
  <path d="M40 280 Q 180 180 320 260 T 560 220 L 560 410 L 40 410 Z" fill="%232563EB" opacity="0.6"/>
  <path d="M40 330 Q 200 240 360 310 T 560 290 L 560 410 L 40 410 Z" fill="%231D4ED8" opacity="0.8"/>
  <path d="M60 120 C 140 180, 240 80, 360 140 C 440 180, 500 120, 540 160" stroke="%23F59E0B" stroke-width="4" stroke-linecap="round" fill="none"/>
  <circle cx="160" cy="150" r="8" fill="%23F59E0B"/>
  <circle cx="280" cy="110" r="10" fill="%23D97706"/>
  <circle cx="440" cy="155" r="7" fill="%23FCD34D"/>
  <rect x="40" y="40" width="520" height="370" fill="url(%23stitch)" opacity="0.3"/>
  <text x="70" y="90" fill="%2393C5FD" font-family="sans-serif" font-weight="700" font-size="20" letter-spacing="1">TEXTILE WALL RELIEF</text>
  <text x="70" y="115" fill="%23E2E8F0" font-family="sans-serif" font-size="14">Selvage Denim %26 Antique Brass Teeth</text>
</svg>`;

const ARTWORK_SVG_2 = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 450" width="600" height="450">
  <defs>
    <radialGradient id="lampGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="%23FBBF24" stop-opacity="0.9"/>
      <stop offset="40%" stop-color="%23D97706" stop-opacity="0.4"/>
      <stop offset="100%" stop-color="%2318181B" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="600" height="450" fill="%2318181B"/>
  <circle cx="300" cy="225" r="190" fill="url(%23lampGlow)"/>
  <!-- Wooden frame batons -->
  <rect x="180" y="90" width="24" height="270" rx="4" fill="%23D4A373"/>
  <rect x="396" y="90" width="24" height="270" rx="4" fill="%23D4A373"/>
  <rect x="180" y="90" width="240" height="24" rx="4" fill="%23B08968"/>
  <rect x="180" y="336" width="240" height="24" rx="4" fill="%23B08968"/>
  <!-- Acrylic panels -->
  <polygon points="214,124 386,124 360,326 240,326" fill="%23F59E0B" opacity="0.75"/>
  <line x1="220" y1="180" x2="380" y2="180" stroke="%23FEF3C7" stroke-width="2" opacity="0.6"/>
  <line x1="225" y1="230" x2="375" y2="230" stroke="%23FEF3C7" stroke-width="2" opacity="0.6"/>
  <line x1="235" y1="280" x2="365" y2="280" stroke="%23FEF3C7" stroke-width="2" opacity="0.6"/>
  <text x="60" y="80" fill="%23FDE68A" font-family="sans-serif" font-weight="700" font-size="20">AMBIENT SCULPTURE</text>
  <text x="60" y="105" fill="%23A1A1AA" font-family="sans-serif" font-size="14">Birch Plywood %26 Cast Amber Acrylic</text>
</svg>`;

const ARTWORK_SVG_3 = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 450" width="600" height="450">
  <rect width="600" height="450" fill="%231C1917"/>
  <!-- Open journal pages -->
  <rect x="70" y="80" width="220" height="290" rx="8" fill="%23F5F5F4"/>
  <rect x="310" y="80" width="220" height="290" rx="8" fill="%23E7E5E4"/>
  <!-- Spine -->
  <rect x="286" y="70" width="28" height="310" rx="6" fill="%231E3A8A"/>
  <!-- Kettle stitch marks -->
  <circle cx="300" cy="110" r="4" fill="%23D97706"/>
  <circle cx="300" cy="160" r="4" fill="%23D97706"/>
  <circle cx="300" cy="210" r="4" fill="%23D97706"/>
  <circle cx="300" cy="260" r="4" fill="%23D97706"/>
  <circle cx="300" cy="310" r="4" fill="%23D97706"/>
  <circle cx="300" cy="350" r="4" fill="%23D97706"/>
  <!-- Litho print splatters on page -->
  <circle cx="160" cy="170" r="35" fill="%230284C7" opacity="0.4"/>
  <path d="M120 250 Q 180 210 240 270" stroke="%23DC2626" stroke-width="4" fill="none" opacity="0.7"/>
  <circle cx="420" cy="210" r="45" fill="%23EA580C" opacity="0.35"/>
  <line x1="340" y1="130" x2="490" y2="130" stroke="%2378716C" stroke-width="2"/>
  <line x1="340" y1="160" x2="470" y2="160" stroke="%23A8A29E" stroke-width="2"/>
  <line x1="340" y1="190" x2="450" y2="190" stroke="%23A8A29E" stroke-width="2"/>
  <text x="60" y="55" fill="%23F5F5F4" font-family="sans-serif" font-weight="700" font-size="20">ARTISANAL CODEX</text>
  <text x="60" y="75" fill="%23A8A29E" font-family="sans-serif" font-size="13">Cotton Rag Proofs %26 Indigo Denim</text>
</svg>`;

export const INITIAL_MATERIALS = [
  {
    id: "mat-1",
    name: "Raw Selvage Denim Offcuts",
    type: "fabric",
    colour: "Indigo blue",
    quantity: "14 cut strips",
    estimated_weight_kg: 1.2,
    condition: "good",
    donor: "Atelier Indigo Tailoring",
    supplierId: "sup-1",
    supplierName: "Atelier Indigo Haute Couturière",
    dateAdded: "2026-11-10",
    used: false
  },
  {
    id: "mat-2",
    name: "Birch Plywood Framing Battens",
    type: "wood",
    colour: "Natural pale blonde",
    quantity: "8 batons (60cm)",
    estimated_weight_kg: 2.4,
    condition: "good",
    donor: "Forma Architecture Studio",
    supplierId: "sup-2",
    supplierName: "Forma Architectural Model Works",
    dateAdded: "2026-11-11",
    used: false
  },
  {
    id: "mat-3",
    name: "Arches Rag Litho Proof Sheets",
    type: "paper",
    colour: "Warm ivory & ink",
    quantity: "22 large sheets",
    estimated_weight_kg: 0.9,
    condition: "fair",
    donor: "Apex Printmaking Press",
    supplierId: "sup-3",
    supplierName: "Apex Litho & Rag Paper House",
    dateAdded: "2026-11-12",
    used: false
  },
  {
    id: "mat-4",
    name: "Cast Amber Acrylic Remnants",
    type: "plastic",
    colour: "Translucent amber",
    quantity: "12 laser fragments",
    estimated_weight_kg: 0.7,
    condition: "good",
    donor: "Lucite Sign & Display",
    supplierId: "sup-4",
    supplierName: "Lucite & Amber Signage Studio",
    dateAdded: "2026-11-13",
    used: false
  },
  {
    id: "mat-5",
    name: "Vintage Brass Zippers & Pulls",
    type: "buttons_trims",
    colour: "Antique burnished gold",
    quantity: "35 assorted units",
    estimated_weight_kg: 0.5,
    condition: "good",
    donor: "Mayfair Wardrobe Dept.",
    supplierId: "sup-5",
    supplierName: "Mayfair Vintage Wardrobe Archive",
    dateAdded: "2026-11-14",
    used: false
  },
  {
    id: "mat-6",
    name: "Stained Cathedral Glass Offcuts",
    type: "glass",
    colour: "Cobalt blue & olive",
    quantity: "1 box (approx 35 shards)",
    estimated_weight_kg: 1.5,
    condition: "fair",
    donor: "Sanctuary Glassworks",
    supplierId: "sup-6",
    supplierName: "Sanctuary Cathedral Glass & Mosaics",
    dateAdded: "2026-11-15",
    used: false
  }
];

export const INITIAL_ARTWORKS = [
  {
    id: "art-1",
    title: "The Indigo Topography",
    imageUrl: ARTWORK_SVG_1,
    materialsUsed: [
      { name: "Raw Selvage Denim Offcuts", type: "fabric", weight_kg: 1.2 },
      { name: "Vintage Brass Zippers & Pulls", type: "buttons_trims", weight_kg: 0.5 }
    ],
    divertedWeightKg: 1.7,
    co2eAvoidedKg: 11.1,
    story: "Layering raw indigo denim remnants over discarded framing battens, this tactile textile relief echoes aerial topographical maps. Unpicked antique brass zipper teeth shimmer as miniature contour ridges across the heavy cotton weave. Created during an afternoon studio sprint, the composition elevates throwaway garment cuttings into a contemplative artwork celebrating circular craftsmanship, texture, and sustainable studio practice.",
    tags: ["Textile Art", "Denim", "Assemblage", "Zero Waste"],
    completedAt: "2026-11-12",
    creator: "Elena Vance"
  },
  {
    id: "art-2",
    title: "Amber Twilight Lantern",
    imageUrl: ARTWORK_SVG_2,
    materialsUsed: [
      { name: "Birch Plywood Framing Battens", type: "wood", weight_kg: 1.4 },
      { name: "Cast Amber Acrylic Remnants", type: "plastic", weight_kg: 0.7 }
    ],
    divertedWeightKg: 2.1,
    co2eAvoidedKg: 2.8,
    story: "Constructed without toxic glues using interlocking friction joints, this ambient geometric luminaire pairs raw blonde birch batons with amber acrylic remnants. When illuminated, warm honey tones spill through the angular laser-cut slats, casting soothing shadows that evoke mid-century modern design while rescuing precious workshop plastics from municipal incineration.",
    tags: ["Lighting Design", "Sculpture", "Woodcraft", "Interlocking"],
    completedAt: "2026-11-13",
    creator: "Kaito Tanaka"
  },
  {
    id: "art-3",
    title: "The Archivist's Grimoire",
    imageUrl: ARTWORK_SVG_3,
    materialsUsed: [
      { name: "Arches Rag Litho Proof Sheets", type: "paper", weight_kg: 0.9 },
      { name: "Raw Selvage Denim Offcuts", type: "fabric", weight_kg: 0.4 }
    ],
    divertedWeightKg: 1.3,
    co2eAvoidedKg: 4.1,
    story: "Reclaiming misprinted lithographic proofs and heavy cotton rag, this hand-stitched artist book binds forty pages of vibrant accidental color overlays beneath a raw denim hardcover. Exposed Japanese kettle stitching along the spine honors the materials' printshop origins, demonstrating how flawed studio trials can find second life as an exquisite heirloom journal for poets and sketch artists.",
    tags: ["Bookbinding", "Printmaking", "Papercraft", "Upcycling"],
    completedAt: "2026-11-14",
    creator: "Maya Lin-Cross"
  }
];

export const INITIAL_ACTIVITIES = [
  {
    id: "act-1",
    type: "artwork_completed",
    text: "Completed artwork 'The Archivist's Grimoire' (1.3 kg diverted)",
    timestamp: "2 hours ago"
  },
  {
    id: "act-2",
    type: "challenge_generated",
    text: "Generated Challenge: 'Minimalist Friction Lamp'",
    timestamp: "1 day ago"
  },
  {
    id: "act-3",
    type: "material_added",
    text: "Sanctuary Glassworks added Stained Cathedral Glass Offcuts (1.5 kg)",
    timestamp: "1 day ago"
  },
  {
    id: "act-4",
    type: "artwork_completed",
    text: "Completed artwork 'Amber Twilight Lantern' (2.1 kg diverted)",
    timestamp: "2 days ago"
  },
  {
    id: "act-5",
    type: "material_added",
    text: "Atelier Indigo donated Raw Selvage Denim Offcuts (1.2 kg)",
    timestamp: "3 days ago"
  }
];

export const WEEKLY_DIVERTED_DATA = [
  { week: "W1", kg: 1.2, co2: 6.8 },
  { week: "W2", kg: 2.5, co2: 12.4 },
  { week: "W3", kg: 3.8, co2: 15.6 },
  { week: "W4", kg: 5.1, co2: 18.0 }
];
