import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from .env in project root or current dir
dotenv.config();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Flash model identifier (official current Flash model)
// Can be customized via GEMINI_MODEL in .env
const FLASH_MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
const API_TIMEOUT_MS = 25000;
const SYSTEM_INSTRUCTION = "You are Re:form's assistant. Respond only with valid JSON matching the schema. Be concise, practical and encouraging. Never claim certainty about weights; they are estimates.";

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration allowing local dev servers and configured frontend origins
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3001',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, same-origin)
    if (!origin) return callback(null, true);

    // Allow any localhost or 127.0.0.1 on any port (e.g., 5173, 5174, 5175)
    const isLocalDev = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
    if (isLocalDev || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

// Request body size limit (images up to ~5 MB)
app.use(express.json({ limit: '5mb' }));

// Simple in-memory rate limiting per IP (max 60 requests per minute)
const ipRequestCounts = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = 60;

function rateLimiter(req, res, next) {
  const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const entry = ipRequestCounts.get(ip);

  if (!entry || now - entry.startTime > RATE_LIMIT_WINDOW_MS) {
    ipRequestCounts.set(ip, { startTime: now, count: 1 });
  } else {
    entry.count += 1;
    if (entry.count > RATE_LIMIT_MAX) {
      return res.status(429).json({
        error: "Too many requests. Please wait a moment before trying again."
      });
    }
  }

  // Periodic cleanup of stale entries if map grows
  if (ipRequestCounts.size > 1000) {
    for (const [key, val] of ipRequestCounts.entries()) {
      if (now - val.startTime > RATE_LIMIT_WINDOW_MS) {
        ipRequestCounts.delete(key);
      }
    }
  }

  next();
}

app.use('/api', rateLimiter);

/**
 * Safely parse JSON text from Gemini responses, handling markdown code fences.
 */
function cleanAndParseJSON(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    throw new Error("Empty or non-string response received from AI");
  }
  let cleaned = rawText.trim();
  // Strip ```json and ``` code fences if present
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/i, '').replace(/```\s*$/i, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/i, '').replace(/```\s*$/i, '');
  }
  cleaned = cleaned.trim();
  return JSON.parse(cleaned);
}

/**
 * Call Gemini REST API with AbortController timeout and retry logic.
 */
async function callGemini(contents, systemInstruction = SYSTEM_INSTRUCTION, retryCount = 1) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    throw new Error("GEMINI_API_KEY is not configured in .env");
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${FLASH_MODEL}:generateContent?key=${apiKey}`;

  const body = {
    contents,
    systemInstruction: {
      parts: [{ text: systemInstruction }]
    },
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.4
    }
  };

  for (let attempt = 0; attempt <= retryCount; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API error [${response.status}]: ${errorText}`);
      }

      const data = await response.json();
      const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!candidateText) {
        throw new Error("No candidate content returned by Gemini API");
      }

      // Parse JSON safely
      const parsed = cleanAndParseJSON(candidateText);
      return parsed;

    } catch (err) {
      clearTimeout(timeoutId);
      console.warn(`[Gemini Call Attempt ${attempt + 1}/${retryCount + 1} Failed]:`, err.message);

      if (attempt === retryCount) {
        throw err;
      }
      // Short delay before retry
      await new Promise(r => setTimeout(r, 600));
    }
  }
}

// -------------------------------------------------------------
// Realistic Fallback Generators (Ensure demo never breaks)
// -------------------------------------------------------------

function getFallbackMatch(suppliers = [], materials = []) {
  const topSupplier = (suppliers && suppliers[0]) || { id: "sup-1", name: "Chotanagpur Handloom Collective" };
  const matNames = (materials || []).map(m => m.name || m).filter(Boolean);
  const matText = matNames.length > 0 ? `suitable for working with ${matNames.join(', ')}` : "for creative upcycling";

  return {
    best_supplier_id: topSupplier.id,
    reason: `${topSupplier.name} is your closest partner (${topSupplier.distance ? topSupplier.distance + ' km' : 'nearby'}) with verified offcuts ${matText}.`,
    pickup_tip: "Drop by during regular studio hours; offcuts are boxed and ready for immediate contactless creator pickup."
  };
}

function getFallbackChat(userMsg = "", context = {}) {
  const lower = (userMsg || "").toLowerCase();

  if (lower.includes("order") || lower.includes("delivery") || lower.includes("track")) {
    const orders = context?.orders || [];
    if (orders.length > 0) {
      const latest = orders[0];
      const matStr = Array.isArray(latest.materialNames) ? latest.materialNames.join(', ') : 'materials';
      return {
        reply: `Your order #${latest.trackingCode || latest.id} (${matStr}) from ${latest.supplierName || 'supplier'} is currently ${latest.status}. Estimated: ${latest.estimatedDelivery || 'In transit'}.`,
        action: { type: "open_tab", tab: "orders" }
      };
    }
    return {
      reply: "You don't have any active orders right now. Explore available studio scraps on the Map tab to request your first batch!",
      action: { type: "open_tab", tab: "map" }
    };
  }

  if (lower.includes("supplier") || lower.includes("nearest") || lower.includes("where can i get") || lower.includes("shop")) {
    const suppliers = context?.nearestSuppliers || [];
    if (suppliers.length > 0) {
      const nearest = suppliers[0];
      return {
        reply: `The nearest supplier is ${nearest.name} (${nearest.distance ? nearest.distance + ' km away' : 'nearby'} in ${nearest.city || 'Ranchi'}). They currently have ${nearest.materialsAvailable || 'several'} scrap items available.`,
        action: { type: "open_tab", tab: "map" }
      };
    }
    return {
      reply: "Check out the Map tab to discover zero-waste textile studios, print houses, and woodworking ateliers near you.",
      action: { type: "open_tab", tab: "map" }
    };
  }

  if (lower.includes("idea") || lower.includes("technique") || lower.includes("inspire")) {
    return {
      reply: "Ready to create? Explore fresh generative prompts, joining techniques, and medium guides tailored to your collected scraps in the Ideas tab.",
      action: { type: "open_tab", tab: "ideas" }
    };
  }

  if (lower.includes("challenge") || lower.includes("spin")) {
    return {
      reply: "Spin the Material-to-Art wheel to get a curated creative brief with a surprising constraint (like 'no glue' or 'origami folds only')!",
      action: { type: "open_tab", tab: "challenge" }
    };
  }

  if (lower.includes("impact") || lower.includes("calculate") || lower.includes("co2") || lower.includes("waste")) {
    return {
      reply: "Impact is calculated using standard cradle-to-gate carbon emission factors for salvaged materials (e.g., ~4.5 kg CO2e/kg for textiles, ~1.2 kg for timber offcuts). Every kilogram diverted preserves virgin raw resources!",
      action: { type: "open_tab", tab: "dashboard" }
    };
  }

  if (lower.includes("scan") || lower.includes("photo") || lower.includes("upload")) {
    return {
      reply: "You can snap a photo of discarded textiles, wood, card, or trims in the Scan tab, and our vision model will identify scrap types and weights automatically.",
      action: { type: "open_tab", tab: "scan" }
    };
  }

  return {
    reply: "I'm here to help you turn discarded scraps into finished artwork! Ask me about nearby suppliers, tracking orders, creative challenge ideas, or calculating your eco-impact.",
    action: null
  };
}

function getFallbackScan() {
  const sampleBatches = [
    [
      {
        name: "Linen Garment Offcuts",
        type: "fabric",
        colour: "Unbleached oat & sage",
        quantity: "6 irregular pieces",
        estimated_weight_kg: 0.6,
        condition: "good"
      },
      {
        name: "Solid Oak Trimming Strips",
        type: "wood",
        colour: "Warm golden brown",
        quantity: "4 slender battens",
        estimated_weight_kg: 1.1,
        condition: "good"
      },
      {
        name: "Antique Shell Buttons",
        type: "buttons_trims",
        colour: "Iridescent mother-of-pearl",
        quantity: "24 buttons",
        estimated_weight_kg: 0.2,
        condition: "good"
      }
    ],
    [
      {
        name: "Heavy Cardboard Box Corners",
        type: "paper",
        colour: "Kraft brown",
        quantity: "8 rigid angle pieces",
        estimated_weight_kg: 0.5,
        condition: "fair"
      },
      {
        name: "Copper Wire & Foil Offcuts",
        type: "metal",
        colour: "Burnished copper",
        quantity: "1 coil (approx 3m)",
        estimated_weight_kg: 0.4,
        condition: "good"
      }
    ]
  ];
  const choice = sampleBatches[Math.floor(Math.random() * sampleBatches.length)];
  return { materials: choice };
}

function getFallbackChallenge(materials) {
  const names = (materials || []).map(m => m.name || m).join(" and ");
  const titles = [
    "The Gravity-Defying Kinetic Mobile",
    "Tactile Topographic Collage",
    "Modular Minimalist Desk Luminaire",
    "The Interlocking Scrap Vessel"
  ];
  const twists = [
    "No glue allowed — join only using friction notches, string, or folding",
    "Monochrome composition — celebrate texture and shadows over surface color",
    "Must incorporate a functional storage or lighting element",
    "No power tools — use only hand scissors, hand sanding, and knotting"
  ];
  const pickedTitle = titles[Math.floor(Math.random() * titles.length)];
  const pickedTwist = twists[Math.floor(Math.random() * twists.length)];

  return {
    title: pickedTitle,
    brief: `Transform your discarded ${names || 'studio scraps'} into a striking three-dimensional art object. This challenge explores tactile contrast between structural rigidity and soft organic textures.`,
    twist: pickedTwist,
    difficulty: "medium",
    estimated_time: "45-60 mins",
    steps: [
      "Sort and measure your material offcuts, arranging them by weight and visual rhythm.",
      "Score or notch the firmer materials to create clean connection anchor points.",
      "Weave or bind the softer elements through the primary structure to create depth.",
      "Test structural balance and refine exposed edges for an intentional gallery finish."
    ],
    tips: [
      "Work with the existing grain or fray of the materials rather than fighting it.",
      "A dry assembly trial before finalizing joins prevents unnecessary material stress."
    ]
  };
}

function getFallbackIdeas(materials) {
  const names = (materials || []).map(m => m.name || m).join(", ");
  return {
    ideas: [
      {
        title: "Layered Architectural Relief",
        what_you_will_make: "A framed geometric wall relief with shadow-box depth",
        description: `Combine ${names || 'your scraps'} into rhythmic overlapping strata inspired by Bauhaus spatial exercises.`,
        difficulty: "easy",
        steps: [
          "Cut or tear materials into varying rectilinear strips.",
          "Layer by thickness on a backing board, creating stepped elevations.",
          "Secure using basic paper glue or thread stitches.",
          "Trim outer boundaries for a crisp contemporary border."
        ]
      },
      {
        title: "Woven Botanical Planter Sleeve",
        what_you_will_make: "A durable textured sleeve for indoor terracotta pots",
        description: "Interlace pliable offcuts around a cylindrical armature to produce a warm, earthy vessel jacket.",
        difficulty: "medium",
        steps: [
          "Create a vertical warp framework using the firmest material strips.",
          "Weave softer strips horizontally over and under in an alternating basket pattern.",
          "Secure the top and bottom rims with simple overcast hand stitches.",
          "Slip over an existing pot or glass container."
        ]
      },
      {
        title: "Kinetic Scrap Mobile",
        what_you_will_make: "A delicately balanced suspended kinetic sculpture",
        description: "Balance geometric fragments along lightweight crossbars to catch ambient room currents.",
        difficulty: "hard",
        steps: [
          "Punch pinholes at the calculated center of gravity of each fragment.",
          "Thread fine wire or sewing thread through each piece.",
          "Attach to stepped crossbeams, adjusting sliding pivot points until perfectly level.",
          "Suspend from a ceiling hook or shelf bracket."
        ]
      }
    ]
  };
}

function getFallbackStory(materials, userNote) {
  const matsList = (materials || []).map(m => m.name || m).join(" and ");
  const noteSnippet = userNote ? ` Inspired by "${userNote}", ` : " ";
  return {
    title: "Metamorphosis in Scraps",
    story: `Constructed from discarded ${matsList || 'studio remnants'}, this piece interrogates the boundary between industrial detritus and intentional fine craft.${noteSnippet}By accentuating the natural patina and raw edges of each component, the completed artwork establishes a quiet dialogue on material circularity, resourcefulness, and the transformative power of the creative constraint.`,
    tags: ["Upcycling", "Studio Scraps", "Circular Art", "Eco-Design"]
  };
}

// -------------------------------------------------------------
// API Endpoints
// -------------------------------------------------------------

// Health check
app.get('/api/health', (req, res) => {
  const hasKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here');
  res.json({
    status: "ok",
    aiConfigured: hasKey,
    model: FLASH_MODEL
  });
});

// POST /api/scan
app.post('/api/scan', async (req, res) => {
  const { image } = req.body;
  if (!image) {
    return res.status(400).json({ error: "Missing image in request body" });
  }

  // Extract base64 and mime type
  let mimeType = "image/jpeg";
  let base64Data = image;

  const match = image.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
  if (match) {
    mimeType = match[1];
    base64Data = match[2];
  }

  const prompt = `Analyze this image of discarded creative studio scraps and materials. 
Identify the distinct scrap materials visible. For each material provide:
- name: concise descriptive material name
- type: exactly one of "fabric", "wood", "paper", "plastic", "metal", "glass", "buttons_trims", "other"
- colour: visible color
- quantity: count or estimate (e.g. "8 strips", "approx 500g bundle")
- estimated_weight_kg: numerical realistic weight estimate in kg (e.g. 0.4)
- condition: exactly one of "good", "fair", "poor"

Return STRICT JSON matching schema:
{
  "materials": [
    {
      "name": "string",
      "type": "fabric|wood|paper|plastic|metal|glass|buttons_trims|other",
      "colour": "string",
      "quantity": "string",
      "estimated_weight_kg": 0.5,
      "condition": "good|fair|poor"
    }
  ]
}`;

  try {
    const contents = [
      {
        parts: [
          {
            inlineData: {
              mimeType,
              data: base64Data
            }
          },
          { text: prompt }
        ]
      }
    ];

    const result = await callGemini(contents);

    // Validate schema
    if (!result || !Array.isArray(result.materials) || result.materials.length === 0) {
      throw new Error("AI returned no materials in expected schema");
    }

    // Clean numerical values and ensure fields exist
    const validMaterials = result.materials.map((m, idx) => ({
      id: `scan-${Date.now()}-${idx}`,
      name: m.name || `Studio Scrap #${idx + 1}`,
      type: ["fabric", "wood", "paper", "plastic", "metal", "glass", "buttons_trims", "other"].includes(m.type) ? m.type : "other",
      colour: m.colour || "Mixed",
      quantity: m.quantity || "1 unit",
      estimated_weight_kg: Number(m.estimated_weight_kg) || 0.5,
      condition: ["good", "fair", "poor"].includes(m.condition) ? m.condition : "good",
      dateAdded: new Date().toISOString().split('T')[0]
    }));

    return res.json({
      materials: validMaterials,
      source: "gemini",
      model: FLASH_MODEL
    });

  } catch (err) {
    console.error("[/api/scan Error]:", err.message);
    const fallback = getFallbackScan();
    return res.json({
      ...fallback,
      source: "demo_fallback",
      error: err.message,
      note: "Using realistic demo scan results."
    });
  }
});

// POST /api/challenge
app.post('/api/challenge', async (req, res) => {
  const { materials } = req.body;
  if (!materials || !Array.isArray(materials) || materials.length === 0) {
    return res.status(400).json({ error: "Please provide an array of materials" });
  }

  const matDescriptions = materials.map(m => `- ${m.name} (${m.type}, ${m.colour || 'color'}, approx ${m.estimated_weight_kg || 0.5}kg)`).join("\n");

  const prompt = `Generate a compelling artistic challenge for a creator using only these discarded scraps:
${matDescriptions}

Return STRICT JSON matching schema:
{
  "title": "Inspiring challenge title",
  "brief": "2 to 3 sentences explaining the creative vision and purpose",
  "twist": "A clever constraint or unexpected rule (e.g. 'no synthetic glue', 'must cast a shadow')",
  "difficulty": "easy|medium|hard",
  "estimated_time": "e.g. 45 mins",
  "steps": ["Step 1...", "Step 2...", "Step 3...", "Step 4..."],
  "tips": ["Tip 1...", "Tip 2..."]
}`;

  try {
    const contents = [{ parts: [{ text: prompt }] }];
    const result = await callGemini(contents);

    // Validate required fields
    if (!result.title || !result.brief || !Array.isArray(result.steps)) {
      throw new Error("Missing required fields in challenge JSON");
    }

    return res.json({
      ...result,
      source: "gemini"
    });
  } catch (err) {
    console.error("[/api/challenge Error]:", err.message);
    const fallback = getFallbackChallenge(materials);
    return res.json({
      ...fallback,
      source: "demo_fallback",
      error: err.message
    });
  }
});

// POST /api/ideas
app.post('/api/ideas', async (req, res) => {
  const { materials } = req.body;
  if (!materials || !Array.isArray(materials) || materials.length === 0) {
    return res.status(400).json({ error: "Please provide an array of materials" });
  }

  const matDescriptions = materials.map(m => `- ${m.name} (${m.type})`).join("\n");

  const prompt = `Generate EXACTLY 3 distinct, practical creative art/craft project ideas using ONLY these materials:
${matDescriptions}

Constraints:
- Only use the materials provided plus common basic tools (scissors, needle and thread, glue).
- Explicitly state any optional extra items if applicable.
- Return EXACTLY 3 ideas in the "ideas" array.

Return STRICT JSON:
{
  "ideas": [
    {
      "title": "Creative project title",
      "description": "Engaging description of what the piece explores",
      "what_you_will_make": "Clear description of the finished physical object",
      "difficulty": "easy|medium|hard",
      "steps": [
        "Concise step 1",
        "Concise step 2",
        "Concise step 3"
      ]
    }
  ]
}`;

  try {
    const contents = [{ parts: [{ text: prompt }] }];
    const result = await callGemini(contents);

    if (!result.ideas || !Array.isArray(result.ideas) || result.ideas.length < 3) {
      throw new Error("Response did not contain at least 3 ideas");
    }

    return res.json({
      ideas: result.ideas.slice(0, 3),
      source: "gemini"
    });
  } catch (err) {
    console.error("[/api/ideas Error]:", err.message);
    const fallback = getFallbackIdeas(materials);
    return res.json({
      ...fallback,
      source: "demo_fallback",
      error: err.message
    });
  }
});

// POST /api/story
app.post('/api/story', async (req, res) => {
  const { artworkImage, materials, userNote } = req.body || {};
  if (!materials && !artworkImage) {
    return res.status(400).json({ error: "Missing required 'materials' or 'artworkImage' in request body" });
  }
  const matSummary = (materials || []).map(m => m.name || m).join(", ");

  const prompt = `Write a warm, concise gallery curatorial story for a completed artwork created from discarded scraps.
Materials used: ${matSummary || "discarded studio scraps"}
Artist note: ${userNote || "None provided"}

Requirements:
- Warm, appreciative, artistic tone.
- Length: strictly 60 to 80 words.
- Highlight the beauty found in discarded scraps and sustainable circular creativity.
- 3 to 4 relevant tags.

Return STRICT JSON:
{
  "title": "Evocative artwork title",
  "story": "Warm story between 60 and 80 words...",
  "tags": ["Tag1", "Tag2", "Tag3"]
}`;

  try {
    let contents;
    if (artworkImage && artworkImage.startsWith("data:image/")) {
      const match = artworkImage.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
      if (match) {
        contents = [
          {
            parts: [
              {
                inlineData: {
                  mimeType: match[1],
                  data: match[2]
                }
              },
              { text: prompt }
            ]
          }
        ];
      }
    }

    if (!contents) {
      contents = [{ parts: [{ text: prompt }] }];
    }

    const result = await callGemini(contents);

    if (!result.story || !result.title) {
      throw new Error("Missing title or story in story response");
    }

    return res.json({
      ...result,
      source: "gemini"
    });
  } catch (err) {
    console.error("[/api/story Error]:", err.message);
    const fallback = getFallbackStory(materials, userNote);
    return res.json({
      ...fallback,
      source: "demo_fallback",
      error: err.message
    });
  }
});

// POST /api/match - AI match explanation for nearest/best supplier
app.post('/api/match', async (req, res) => {
  const { materials = [], suppliers = [], challengeTitle = "" } = req.body || {};

  if (!req.body || !Array.isArray(suppliers)) {
    return res.status(400).json({ error: "Missing or invalid 'suppliers' array in request body" });
  }

  if (suppliers.length === 0) {
    const fallback = getFallbackMatch([], materials);
    return res.json({ ...fallback, source: "demo_fallback" });
  }

  const matSummary = materials.map(m => (typeof m === 'string' ? m : `${m.name} (${m.type || 'scrap'})`)).join(", ") || "General creative scraps";
  const supList = suppliers.slice(0, 6).map(s => (
    `- ID: ${s.id} | Name: ${s.name} | Type: ${s.businessType || 'Studio'} | Distance: ${s.distance ? s.distance + ' km' : 'nearby'} | City/Area: ${s.address || s.city || 'Ranchi'} | Materials: ${s.materialsAvailable || 0}`
  )).join("\n");

  const prompt = `You are Re:form's logistics & match optimizer for artists and eco-conscious creative studios.
Select the single best supplier from the candidates to supply materials for the artist's project.

ARTIST'S PROJECT / CHALLENGE:
Challenge: ${challengeTitle || "Material-to-Art Challenge"}
Materials Needed: ${matSummary}

CANDIDATE SUPPLIERS (ranked by proximity):
${supList}

Requirements:
- Pick the best supplier by considering proximity (km), relevance of materials/business type, and practicality.
- "reason": strictly 1 to 2 concise sentences explaining why this specific supplier is recommended.
- "pickup_tip": a brief, practical tip for collection or packaging.
- "best_supplier_id" MUST match one of the candidate IDs listed above.

Return STRICT JSON:
{
  "best_supplier_id": "string",
  "reason": "1-2 sentences...",
  "pickup_tip": "short tip..."
}`;

  try {
    const contents = [{ parts: [{ text: prompt }] }];
    const result = await callGemini(contents);

    // Validate supplier id
    const candidateIds = suppliers.map(s => s.id);
    if (!result.best_supplier_id || !candidateIds.includes(result.best_supplier_id)) {
      result.best_supplier_id = suppliers[0].id;
    }
    if (!result.reason) {
      result.reason = `${suppliers[0].name} offers the closest pickup route and ready inventory.`;
    }
    if (!result.pickup_tip) {
      result.pickup_tip = "Check opening hours and bring reusable totes for scrap collection.";
    }

    return res.json({
      ...result,
      source: "gemini"
    });
  } catch (err) {
    console.error("[/api/match Error]:", err.message);
    const fallback = getFallbackMatch(suppliers, materials);
    return res.json({
      ...fallback,
      source: "demo_fallback",
      error: err.message
    });
  }
});

// POST /api/chat - AI Chat Assistant for creators and suppliers
app.post('/api/chat', async (req, res) => {
  const { messages = [], context = {} } = req.body || {};

  if (!req.body || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Missing or invalid 'messages' array in request body" });
  }

  const recentMessages = messages.slice(-10);
  const lastUserMsg = [...recentMessages].reverse().find(m => m.role === 'user')?.content || "";

  const CHAT_SYSTEM_INSTRUCTION = `You are Re:form's friendly assistant for creators and suppliers. Help with: finding materials, understanding the Material-to-Art Challenge, art ideas and techniques, checking order and delivery status, finding the nearest supplier, and how the platform and impact numbers work. Use only the provided context for facts about orders, materials and suppliers; if information is missing, say so and never invent order details. Keep answers short, practical and encouraging. Support the artist; never replace their creativity.

Always respond with STRICT JSON in this exact schema:
{
  "reply": "string (friendly, concise answer in markdown or plain text, 2-4 sentences max)",
  "action": null | {
    "type": "open_tab",
    "tab": "map" | "challenge" | "orders" | "ideas" | "scan"
  }
}`;

  // Format context cleanly
  const compactContext = {
    availableMaterials: (context.materials || []).slice(0, 8).map(m => ({ id: m.id, name: m.name, type: m.type })),
    currentChallenge: context.currentChallenge ? { title: context.currentChallenge.title, materials: context.currentChallenge.materials } : null,
    orders: (context.orders || []).slice(0, 5).map(o => ({
      id: o.id,
      trackingCode: o.trackingCode,
      status: o.status,
      supplierName: o.supplierName,
      materialNames: o.materialNames,
      method: o.method,
      estimatedDelivery: o.estimatedDelivery
    })),
    nearestSuppliers: (context.nearestSuppliers || []).slice(0, 3).map(s => ({
      id: s.id,
      name: s.name,
      distanceKm: s.distance,
      businessType: s.businessType,
      city: s.city,
      materialsAvailable: s.materialsAvailable
    }))
  };

  const historyText = recentMessages.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join("\n");

  const prompt = `APP CONTEXT (use this for all facts regarding orders, suppliers, challenges, and materials):
${JSON.stringify(compactContext, null, 2)}

CONVERSATION HISTORY:
${historyText || "User: Hello"}

LATEST USER MESSAGE:
"${lastUserMsg}"

Respond as Re:form Assistant in STRICT JSON matching the required schema. If the user is asking to find suppliers or see the map, set action to {"type": "open_tab", "tab": "map"}. If asking about an order or tracking, set action to {"type": "open_tab", "tab": "orders"}. If asking about challenges, set action to {"type": "open_tab", "tab": "challenge"}. If asking for art ideas, set action to {"type": "open_tab", "tab": "ideas"}. If asking to scan scraps, set action to {"type": "open_tab", "tab": "scan"}. Otherwise set action to null.`;

  try {
    const contents = [{ parts: [{ text: prompt }] }];
    const result = await callGemini(contents, CHAT_SYSTEM_INSTRUCTION);

    if (!result.reply) {
      throw new Error("Missing reply in chat response");
    }

    return res.json({
      ...result,
      source: "gemini"
    });
  } catch (err) {
    console.error("[/api/chat Error]:", err.message);
    const fallback = getFallbackChat(lastUserMsg, context);
    return res.json({
      ...fallback,
      source: "demo_fallback",
      error: err.message
    });
  }
});

// Serve static frontend files if production build exists
const distPath = path.resolve(__dirname, '../frontend/dist');
app.use(express.static(distPath));

// For all non-API GET requests, serve index.html
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(distPath, 'index.html'), (err) => {
    if (err) {
      res.status(200).send("Re:form API server is running. Start frontend dev server on port 5173 or run 'npm run build'.");
    }
  });
});

// Global error handler - never leaks internal stack traces to the client
app.use((err, req, res, next) => {
  console.error(`[Server Error] ${req.method} ${req.path}:`, err.message);
  res.status(err.status || 500).json({
    error: err.message || "An unexpected internal server error occurred"
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`[Re:form Backend] Running on http://localhost:${PORT}`);
  console.log(`[Re:form Backend] Gemini Flash Model: ${FLASH_MODEL}`);
  console.log(`[Re:form Backend] AI configured: ${Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here')}`);
});
