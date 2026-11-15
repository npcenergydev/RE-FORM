/**
 * Seed customer data with detailed tracking of which customer has been provided with what materials.
 * Stored and synchronized with Firebase Firestore under the "users" collection.
 */

export const INITIAL_CUSTOMERS = [
  {
    id: "cust-aanya",
    name: "Aanya Sharma",
    email: "aanya.artist@reform.studio",
    role: "creator",
    studio: "Aanya Ceramic & Fiber Atelier",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
    city: "Ranchi, Jharkhand",
    createdAt: "2026-10-12T08:00:00.000Z",
    totalWasteDivertedKg: 5.4,
    totalMaterialsReceived: 2,
    providedMaterials: [
      {
        materialId: "mat-1",
        name: "Linen & Khadi Fabric Offcuts",
        type: "fabric",
        quantity: "2.4 kg (8 bundles)",
        weightKg: 2.4,
        supplierId: "sup-1",
        supplierName: "Chotanagpur Handloom Collective",
        orderId: "ord-1",
        trackingCode: "RF-2026-94821",
        providedAt: "2026-11-10T14:30:00.000Z",
        status: "Delivered",
        method: "delivery",
        notes: "Salvaged coarse weave khadi for wall tapestry project"
      },
      {
        materialId: "mat-4",
        name: "Natural Raw Clay Slurry & Shards",
        type: "clay",
        quantity: "3.0 kg (5 dry blocks)",
        weightKg: 3.0,
        supplierId: "sup-4",
        supplierName: "Jharcraft Terracotta Works",
        orderId: "ord-102",
        trackingCode: "RF-2026-88124",
        providedAt: "2026-11-12T16:15:00.000Z",
        status: "Delivered",
        method: "pickup",
        notes: "Unglazed kiln offcuts for mosaic sculpting"
      }
    ]
  },
  {
    id: "cust-rohan",
    name: "Rohan Verma",
    email: "rohan.sculptor@reform.studio",
    role: "creator",
    studio: "Rohan Timber & Kinetic Art",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
    city: "Ranchi, Jharkhand",
    createdAt: "2026-10-20T10:15:00.000Z",
    totalWasteDivertedKg: 2.2,
    totalMaterialsReceived: 2,
    providedMaterials: [
      {
        materialId: "mat-2",
        name: "Solid Teak & Sal Wood Battens",
        type: "wood",
        quantity: "1.8 kg (4 slender battens)",
        weightKg: 1.8,
        supplierId: "sup-2",
        supplierName: "Tribal Woodcrafts & Framing",
        orderId: "ord-2",
        trackingCode: "RF-2026-77319",
        providedAt: "2026-11-11T11:00:00.000Z",
        status: "Delivered",
        method: "pickup",
        notes: "Framing offcuts repurposed for tabletop kinetic sculpture"
      },
      {
        materialId: "mat-6",
        name: "Discarded Silk Screen Mesh Pieces",
        type: "fabric",
        quantity: "0.4 kg (3 tensioned offcuts)",
        weightKg: 0.4,
        supplierId: "sup-6",
        supplierName: "Kanke Print & Litho Press",
        orderId: "ord-103",
        trackingCode: "RF-2026-61205",
        providedAt: "2026-11-13T09:45:00.000Z",
        status: "Delivered",
        method: "delivery",
        notes: "Nylon monofilament mesh for shadow layering"
      }
    ]
  },
  {
    id: "cust-priya",
    name: "Priya Das",
    email: "priya.textiles@reform.studio",
    role: "creator",
    studio: "Das Paper & Collage Lab",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80",
    city: "Ranchi, Jharkhand",
    createdAt: "2026-11-01T12:00:00.000Z",
    totalWasteDivertedKg: 0.9,
    totalMaterialsReceived: 1,
    providedMaterials: [
      {
        materialId: "mat-5",
        name: "Heavy Handmade Lokta & Cotton Rag Paper",
        type: "paper",
        quantity: "0.9 kg (14 trimmed sheets)",
        weightKg: 0.9,
        supplierId: "sup-5",
        supplierName: "Ranchi Art College Scraps Pool",
        orderId: "ord-104",
        trackingCode: "RF-2026-55410",
        providedAt: "2026-11-14T13:20:00.000Z",
        status: "Delivered",
        method: "pickup",
        notes: "Deckle edge scraps for botanical monoprints"
      }
    ]
  },
  {
    id: "cust-kabir",
    name: "Kabir Singh",
    email: "kabir.handloom@reform.studio",
    role: "supplier",
    studio: "Chotanagpur Handloom Collective",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80",
    city: "Ranchi, Jharkhand",
    createdAt: "2026-09-15T09:00:00.000Z",
    totalWasteDivertedKg: 8.6,
    totalMaterialsReceived: 0,
    providedMaterials: []
  }
];
