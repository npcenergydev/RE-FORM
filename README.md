# Re:form 🌿✂️

> **"Give scraps a new form."**  
> *Millions of creative materials are discarded before they ever become art.*

**Re:form** (re:create) connects discarded materials from fashion ateliers, print shops, photography studios, and craft workshops with independent artists and creators. Built for the **GenAI Hackathon (Open Track: GenAI that supports creative artists)**, Re:form pairs Google Gemini with live Firebase Firestore/Storage and Leaflet OpenStreetMap geospatial matching to eliminate both the financial barrier and the creative block.

---

## ⚡ Quick Start (Run Both Frontend & Backend)

### Prerequisites
- Node.js (v18.0.0 or later)
- npm (v9.0.0 or later)

### 1. Install Dependencies
```bash
git clone https://github.com/npcenergydev/RE-FORM.git
cd RE-FORM
npm install
```
*(Running `npm install` automatically installs dependencies for root, backend, and frontend via npm postinstall).*

### 2. Configure Environment Variables
Create `.env` in the root directory (backend) and `frontend/.env` (frontend):

#### Root `.env` (Express Backend):
```env
PORT=3001
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-3.5-flash-lite
FRONTEND_URL=http://localhost:5173
```
*(Get a free key from [Google AI Studio](https://aistudio.google.com/app/apikey). If missing or quota-exhausted, the backend automatically serves realistic demo fallbacks so the app never fails during live judging).*

#### `frontend/.env` (Vite Frontend):
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=1:your_app_id:web:your_hash
VITE_FIREBASE_MEASUREMENT_ID=G-YOURMEASUREMENTID
```

### 3. Launch Development Servers
```bash
npm run dev
```
- **Web App**: [http://localhost:5173](http://localhost:5173) (Vite HMR frontend, proxied to API)
- **Backend API**: [http://localhost:3001](http://localhost:3001)

### 4. Run Automated Test Verification
```bash
npm test
# Or run individual verification suites:
node test/flows.test.js   # 8 full E2E user journeys
node test/auth.test.js    # Authentication & role protection
node test/e2e.test.js     # Responsive viewport & accessibility
```

---

## 🔥 Firebase Setup Guide

Follow these steps in your [Firebase Console](https://console.firebase.google.com/):

### 1. Enable Firestore Database
1. Go to **Build > Firestore Database** and click **Create database**.
2. Select your region and choose **Start in test mode** (or production mode).
3. Under the **Rules** tab, paste the contents of [`firestore.rules`](file:///Users/npcenergydev/Projects/RE-FORM/firestore.rules) and click **Publish**:
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       function isAuthenticated() { return request.auth != null; }
       match /materials/{document=**} { allow read: if true; allow write: if isAuthenticated(); }
       match /suppliers/{document=**} { allow read: if true; allow write: if isAuthenticated(); }
       match /artworks/{document=**}  { allow read: if true; allow write: if isAuthenticated(); }
       match /users/{userId}          { allow read: if true; allow write: if isAuthenticated() && request.auth.uid == userId; }
       match /orders/{orderId}        { allow read, create: if isAuthenticated(); allow update: if isAuthenticated(); }
       match /activity/{document=**}  { allow read: if true; allow create: if isAuthenticated(); }
     }
   }
   ```

### 2. Enable Firebase Storage
1. Go to **Build > Storage** and click **Get started**.
2. Under the **Rules** tab, paste the contents of [`storage.rules`](file:///Users/npcenergydev/Projects/RE-FORM/storage.rules) and click **Publish**:
   ```javascript
   rules_version = '2';
   service firebase.storage {
     match /b/{bucket}/o {
       match /artworks/{allPaths=**} {
         allow read: if true;
         allow write: if request.auth != null && request.resource.size < 5 * 1024 * 1024 && request.resource.contentType.matches('image/.*');
       }
       match /materials/{allPaths=**} {
         allow read: if true;
         allow write: if request.auth != null && request.resource.size < 5 * 1024 * 1024 && request.resource.contentType.matches('image/.*');
       }
     }
   }
   ```
*(Note: If Storage is unconfigured or blocked, Re:form automatically falls back to storing compressed base64 images in Firestore).*

### 3. Enable Authentication Sign-In Methods
1. Go to **Build > Authentication** and click **Get started**.
2. Under the **Sign-in method** tab, enable:
   - **Email/Password**: Toggle ON and click Save.
   - **Google**: Toggle ON, select your project support email, and click Save.
3. For hackathon evaluation without sign-up friction, the app includes a 1-click **"⚡ Continue as Demo User"** button that logs into a verified creator persona instantly.

---

## 🎭 2-Minute Live Demo Script for Judges

| Time | Screen | Actions & Voiceover |
| :--- | :--- | :--- |
| **0:00 - 0:20** | **Dashboard** | *"Welcome to Re:form. Millions of kilograms of high-grade silk, hardwood offcuts, and studio remnants end up in landfills. Re:form redirects these materials to artists while quantifying environmental impact. Notice our live counters: 9 materials rescued, 18.2 kg of CO2e avoided calculated using published DEFRA emission factors."* |
| **0:20 - 0:40** | **Map Tab** | *"How does an artist get scraps? On our Map tab, OpenStreetMap and Haversine geospatial calculations pair you with the closest suppliers in your city. Our Gemini AI analyzes your current creative focus and delivers an 'AI Best Match' card explaining why Lucite Atelier is optimal, along with pickup advice. Click 'Request Materials' and order with one tap."* |
| **0:40 - 0:65** | **Orders Tab** | *"On the Orders tab, we track material custody from studio dispatch to delivery via live Firestore `onSnapshot` listeners. As a judge, click 'Simulate Next Status ⚡' to watch it advance through Packing, Dispatch, to Delivered. The moment it arrives, the system unlocks: 'Turn this into art →'."* |
| **0:65 - 0:95** | **Challenge Tab** | *"Clicking that brings us to our core GenAI mechanic: The Material Roulette. Spin the reel to draw 2 to 4 random studio remnants. Gemini Flash crafts a bespoke challenge with an intentional creative constraint—like joining only with friction notches, no glue. Complete the piece, upload a snapshot, and Gemini generates a warm curatorial gallery statement, publishing it directly to our Atelier Gallery."* |
| **0:95 - 1:20** | **Chat Assistant** | *"Finally, click the floating Re:form Assistant in the bottom corner. Ask 'Where is my order?'—Gemini reads our live app state and returns the tracking code and current status, along with an interactive action button 'View Orders & Tracking →' that takes you straight there. Re:form turns industrial waste into artistic inspiration."* |

---

## 📁 Project Structure

```
RE-FORM/
├── package.json              # Monorepo build, dev, and test scripts
├── firestore.rules           # Production-ready Firestore database rules
├── storage.rules             # Production-ready Cloud Storage rules
├── .env.example              # Environment variables template
├── backend/
│   ├── package.json          # Express server dependencies
│   └── server.js             # Hardened Express API with Gemini Flash-Lite & rate limiting
├── frontend/
│   ├── index.html            # Dark luxury typography & meta tags
│   ├── vite.config.js        # Vite config with manual chunk code-splitting & proxy
│   └── src/
│       ├── main.jsx          # React 18 root with ErrorBoundary
│       ├── App.jsx           # State coordinator & route protection gate
│       ├── firebase.js       # Firebase Auth, Firestore onSnapshot, & Storage fallback
│       ├── index.css         # Minimalist dark luxury atelier design system
│       ├── constants/
│       │   ├── impactFactors.js # DEFRA emission conversion factors & formulas
│       │   ├── seedData.js      # Curated starter materials & artworks
│       │   ├── seedSuppliers.js # 8 realistic verified suppliers around Ranchi
│       │   └── seedCustomers.js # Demo creator & supplier customer personas
│       ├── components/
│       │   ├── AuthModal.jsx    # Google & Email/Password login with role choice
│       │   ├── ChatAssistant.jsx# Floating concierge with context chips & actions
│       │   ├── Navigation.jsx   # Responsive sidebar & mobile bottom bar
│       │   └── Icons.jsx        # Lightweight inline SVG icons
│       ├── pages/
│       │   ├── Dashboard.jsx    # Live metrics, trend chart, & recent activities
│       │   ├── ScanMaterials.jsx# Gemini vision material scanner & editable cards
│       │   ├── Challenge.jsx    # Slot reel constraint challenge & curatorial story
│       │   ├── Ideas.jsx        # 3 generative craft ideas with nearest supplier button
│       │   ├── Map.jsx          # Leaflet OpenStreetMap nearest supplier matching
│       │   ├── Orders.jsx       # Vertical delivery timeline & supplier control desk
│       │   ├── CustomerMaterials.jsx # Material chain of custody & user allocation
│       │   └── Gallery.jsx      # Curated exhibition with environmental impact tags
│       └── utils/
│           ├── distance.js      # Haversine formula calculation
│           ├── imageCompressor.js # Client-side 1024px canvas compression
│           └── storage.js       # In-memory + LocalStorage atomic double-check sync
└── test/
    ├── flows.test.js         # 8 complete end-to-end user journeys (Puppeteer)
    ├── auth.test.js          # Authentication & role protection test suite
    └── e2e.test.js           # Responsive viewport & accessibility audit
```

---

## 🎨 Visual System & Architecture Highlights

- **Aesthetic**: Dark luxury atelier palette (`#0A0A0D` background, `#D48A94` warm rose accents, `#181822` elevated cards, and Cormorant Garamond headings).
- **Code Splitting**: Route-level lazy loading (`React.lazy` + `Suspense`) reduces initial bundle size by 90% (from 1,258 kB to 126 kB).
- **Security & Privacy**: `GEMINI_API_KEY` is completely isolated to the Express server; CORS is restricted to frontend origins; JSON body parser is limited to 5 MB; and sliding-window rate limiters prevent API abuse.
- **Fail-Safe Architecture**: Every API endpoint has strict timeouts (25s), automatic retry logic, and high-fidelity demo fallbacks. If Firebase Storage is unavailable, images are stored in Firestore with base64 Data URLs.

---

## 📜 License
MIT License. Built with passion for the Google Gemini GenAI Hackathon.
