// Seed data for Suppliers and Orders in Re:form / re:create
// Default center: Ranchi, Jharkhand, India

export const DEFAULT_MAP_CENTER = {
  lat: 23.3441,
  lng: 85.3096,
  city: "Ranchi, Jharkhand, India",
  zoom: 13
};

export const INITIAL_SUPPLIERS = [
  {
    id: "sup-1",
    name: "Atelier Indigo Haute Couturière",
    businessType: "fashion studio",
    lat: 23.3490,
    lng: 85.3150,
    address: "74 Main Road, Hindpiri",
    city: "Ranchi",
    contact: "+91 651 220 4811",
    openingHours: "Mon-Sat: 10:00 - 19:30",
    materialsAvailable: 4,
    rating: 4.9,
    linkedMaterialIds: ["mat-1", "mat-wool-1"],
    materialTypes: ["fabric", "buttons_trims"],
    notes: "Specializes in Japanese selvage denim, bespoke suiting offcuts, and raw organic linen."
  },
  {
    id: "sup-2",
    name: "Forma Architectural Model Works",
    businessType: "craft business",
    lat: 23.3850,
    lng: 85.3180,
    address: "12 Kanke Road, near Rock Garden",
    city: "Ranchi",
    contact: "+91 651 245 9022",
    openingHours: "Mon-Fri: 09:00 - 18:00",
    materialsAvailable: 5,
    rating: 4.8,
    linkedMaterialIds: ["mat-2", "mat-wood-2"],
    materialTypes: ["wood", "plastic"],
    notes: "Precision architectural offcuts, blonde birch battens, and basswood laser cuts."
  },
  {
    id: "sup-3",
    name: "Apex Litho & Rag Paper House",
    businessType: "print shop",
    lat: 23.3610,
    lng: 85.3280,
    address: "18 Circular Road, Lalpur",
    city: "Ranchi",
    contact: "+91 651 253 1184",
    openingHours: "Mon-Sat: 10:00 - 20:00",
    materialsAvailable: 6,
    rating: 4.9,
    linkedMaterialIds: ["mat-3", "mat-paper-2"],
    materialTypes: ["paper"],
    notes: "Archival cotton rag test proofs, deckle-edge watercolor sheets, and litho misprints."
  },
  {
    id: "sup-4",
    name: "Lucite & Amber Signage Studio",
    businessType: "photo studio",
    lat: 23.3550,
    lng: 85.2950,
    address: "41 Ratu Road, Pandra",
    city: "Ranchi",
    contact: "+91 651 261 4055",
    openingHours: "Mon-Sat: 10:30 - 19:00",
    materialsAvailable: 3,
    rating: 4.7,
    linkedMaterialIds: ["mat-4"],
    materialTypes: ["plastic"],
    notes: "High-grade cast acrylic remnants, smoked plexiglass, and translucent amber plates."
  },
  {
    id: "sup-5",
    name: "Mayfair Vintage Wardrobe Archive",
    businessType: "fashion studio",
    lat: 23.3250,
    lng: 85.3200,
    address: "5 North Office Para, Doranda",
    city: "Ranchi",
    contact: "+91 651 228 3910",
    openingHours: "Tue-Sun: 11:00 - 20:00",
    materialsAvailable: 4,
    rating: 4.8,
    linkedMaterialIds: ["mat-5"],
    materialTypes: ["buttons_trims", "fabric"],
    notes: "Deadstock brass zippers, antique horn buttons, and heavy military canvas scraps."
  },
  {
    id: "sup-6",
    name: "Sanctuary Cathedral Glass & Mosaics",
    businessType: "craft business",
    lat: 23.3150,
    lng: 85.3100,
    address: "88 Airport Road, Hinoo",
    city: "Ranchi",
    contact: "+91 651 250 8290",
    openingHours: "Mon-Sat: 09:30 - 18:30",
    materialsAvailable: 3,
    rating: 4.9,
    linkedMaterialIds: ["mat-6"],
    materialTypes: ["glass"],
    notes: "Cathedral stained glass fragments, beveled mirror shards, and cobalt glass offcuts."
  },
  {
    id: "sup-7",
    name: "Prism Darkroom & Matting Lab",
    businessType: "photo studio",
    lat: 23.3780,
    lng: 85.3360,
    address: "29 Morabadi Hill Avenue",
    city: "Ranchi",
    contact: "+91 651 254 7733",
    openingHours: "Mon-Sat: 10:00 - 19:00",
    materialsAvailable: 4,
    rating: 4.6,
    linkedMaterialIds: [],
    materialTypes: ["paper", "plastic"],
    notes: "Archival matting boards, photography gelatin print offcuts, and negative sleeve acetates."
  },
  {
    id: "sup-8",
    name: "Tribal Artisans Brass & Metal Guild",
    businessType: "craft business",
    lat: 23.3320,
    lng: 85.3720,
    address: "Plot 14 Namkum Industrial Area",
    city: "Ranchi",
    contact: "+91 651 226 6100",
    openingHours: "Mon-Fri: 08:30 - 17:30",
    materialsAvailable: 5,
    rating: 4.9,
    linkedMaterialIds: [],
    materialTypes: ["metal", "buttons_trims"],
    notes: "Dhokra lost-wax casting brass residues, raw copper wire spools, and spun sheet offcuts."
  }
];

export const INITIAL_ORDERS = [
  {
    id: "ord-101",
    trackingCode: "RF-2026-94812",
    creatorName: "Aarav Sharma",
    supplierId: "sup-1",
    supplierName: "Atelier Indigo Haute Couturière",
    materialIds: ["mat-1"],
    materialNames: ["Raw Selvage Denim Offcuts (1.2 kg)"],
    method: "delivery",
    deliveryAddress: "Studio 4B, Bariatu Road, Ranchi, Jharkhand",
    status: "Delivered",
    createdAt: "2026-11-13T10:15:00Z",
    estimatedDelivery: "2026-11-14 (Delivered)",
    note: "Please pack with waterproof wrapping.",
    statusHistory: [
      { status: "Requested", timestamp: "Nov 13, 10:15 AM", note: "Order submitted by creator" },
      { status: "Confirmed", timestamp: "Nov 13, 11:30 AM", note: "Supplier confirmed material availability" },
      { status: "Packed", timestamp: "Nov 13, 03:00 PM", note: "Packaged securely in recycled kraft bag" },
      { status: "Dispatched", timestamp: "Nov 14, 09:30 AM", note: "Coupled with eco-courier courier" },
      { status: "Out for delivery", timestamp: "Nov 14, 01:15 PM", note: "Rider on the way" },
      { status: "Delivered", timestamp: "Nov 14, 02:45 PM", note: "Delivered & signed by creator" }
    ]
  },
  {
    id: "ord-102",
    trackingCode: "RF-2026-38291",
    creatorName: "Priya Sen",
    supplierId: "sup-4",
    supplierName: "Lucite & Amber Signage Studio",
    materialIds: ["mat-4"],
    materialNames: ["Cast Amber Acrylic Remnants (0.7 kg)"],
    method: "delivery",
    deliveryAddress: "Flat 202, Harmu Housing Colony, Ranchi",
    status: "Out for delivery",
    createdAt: "2026-11-15T08:30:00Z",
    estimatedDelivery: "Today, 05:30 PM",
    note: "Fragile acrylic edges.",
    statusHistory: [
      { status: "Requested", timestamp: "Today, 08:30 AM", note: "Order placed" },
      { status: "Confirmed", timestamp: "Today, 09:15 AM", note: "Confirmed by Lucite Studio" },
      { status: "Packed", timestamp: "Today, 11:00 AM", note: "Protected with corner bubble pads" },
      { status: "Dispatched", timestamp: "Today, 01:20 PM", note: "Dispatched via local eco-van" },
      { status: "Out for delivery", timestamp: "Today, 03:45 PM", note: "Out for delivery — near Harmu Bypass" }
    ]
  }
];

export const DELIVERY_STATUS_STEPS = [
  "Requested",
  "Confirmed",
  "Packed",
  "Dispatched",
  "Out for delivery",
  "Delivered"
];

export const PICKUP_STATUS_STEPS = [
  "Requested",
  "Confirmed",
  "Ready for pickup",
  "Collected"
];
