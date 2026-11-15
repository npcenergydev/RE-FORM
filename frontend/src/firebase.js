// Firebase configuration and Firestore service for Re:form / re:create
import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { 
  getFirestore, 
  collection, 
  getDocs, 
  doc, 
  getDoc,
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  orderBy, 
  limit,
  onSnapshot
} from "firebase/firestore";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";
import {
  getStorage,
  ref as storageRef,
  uploadString,
  getDownloadURL
} from "firebase/storage";

// Web app's Firebase configuration with safe project fallbacks for cloud hosting
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDNd8Fs6RSxM93GFHv9FgrKj92UOhkh0qw",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "reform-e169c.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "reform-e169c",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "reform-e169c.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "976500647226",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:976500647226:web:c6d38593e5d6f8b451dc03",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-RCRFBLW5FY"
};

// Initialize Firebase safely
let appInstance = null;
let dbInstance = null;
let authInstance = null;
let storageInstance = null;

try {
  appInstance = initializeApp(firebaseConfig);
  dbInstance = getFirestore(appInstance);
  authInstance = getAuth(appInstance);
  storageInstance = getStorage(appInstance);
} catch (initErr) {
  console.warn("[Firebase] Initialization warning, using fallback mode:", initErr);
  reportFirebaseError("Initialization", initErr);
}

export const app = appInstance;
export const db = dbInstance;
export const auth = authInstance;
export const storage = storageInstance;

// Initialize Analytics (guarded with isSupported for environment safety)
export let analytics = null;
if (typeof window !== "undefined" && app) {
  isSupported().then((supported) => {
    if (supported && app) {
      analytics = getAnalytics(app);
    }
  }).catch(() => {
    // Analytics optional in test environments
  });
}

// -------------------------------------------------------------
// Global Error Dispatcher (Displays exact errors in the UI)
// -------------------------------------------------------------
const errorListeners = new Set();

export function onFirebaseError(listener) {
  errorListeners.add(listener);
  return () => errorListeners.delete(listener);
}

export function reportFirebaseError(actionDescription, error) {
  const code = error?.code || "unknown-error";
  const rawMessage = error?.message || String(error);
  const fullErrorString = `[Firebase/Firestore] ${actionDescription} failed: ${code} - ${rawMessage}`;
  
  console.error(fullErrorString, error);

  // Dispatch to all active UI listeners with structured details
  const payload = {
    action: actionDescription,
    code: code,
    message: rawMessage,
    full: fullErrorString,
    timestamp: new Date().toLocaleTimeString()
  };

  errorListeners.forEach((listener) => {
    try {
      listener(payload);
    } catch (e) {
      console.warn("Error listener failed:", e);
    }
  });

  return payload;
}

// -------------------------------------------------------------
// Firebase Storage Image Service with Base64 Fallback
// -------------------------------------------------------------

/**
 * Uploads a base64 Data URL to Firebase Storage.
 * If Storage is not enabled or fails, returns original base64 Data URL so
 * the app continues to operate without breaking the artist's workflow.
 */
export async function uploadImageWithFallback(dataUrl, storagePath) {
  if (!dataUrl || !dataUrl.startsWith('data:image/')) {
    return dataUrl;
  }

  try {
    const fileRef = storageRef(storage, storagePath);
    await uploadString(fileRef, dataUrl, 'data_url');
    const downloadUrl = await getDownloadURL(fileRef);
    return downloadUrl;
  } catch (err) {
    console.warn(`[Firebase Storage] Upload to '${storagePath}' failed, using base64 fallback:`, err.message);
    reportFirebaseError(`Storage Upload (${storagePath})`, err);
    return dataUrl;
  }
}

// -------------------------------------------------------------
// Firestore Materials Services
// -------------------------------------------------------------

export async function fetchMaterialsFromFirestore() {
  try {
    const colRef = collection(db, "materials");
    const snapshot = await getDocs(colRef);
    const materials = [];
    snapshot.forEach((d) => {
      materials.push({ id: d.id, ...d.data() });
    });
    return materials;
  } catch (err) {
    reportFirebaseError("Fetch Materials", err);
    throw err;
  }
}

export async function saveMaterialToFirestore(material) {
  try {
    const docRef = doc(db, "materials", material.id);
    await setDoc(docRef, material, { merge: true });
    return material;
  } catch (err) {
    reportFirebaseError(`Save Material '${material.name || material.id}'`, err);
    throw err;
  }
}

export async function updateMaterialInFirestore(id, updates) {
  try {
    const docRef = doc(db, "materials", id);
    await updateDoc(docRef, updates);
    return { id, ...updates };
  } catch (err) {
    reportFirebaseError(`Update Material '${id}'`, err);
    throw err;
  }
}

export async function deleteMaterialFromFirestore(id) {
  try {
    const docRef = doc(db, "materials", id);
    await deleteDoc(docRef);
    return id;
  } catch (err) {
    reportFirebaseError(`Delete Material '${id}'`, err);
    throw err;
  }
}

// -------------------------------------------------------------
// Firestore Artworks Services
// -------------------------------------------------------------

export async function fetchArtworksFromFirestore() {
  try {
    const colRef = collection(db, "artworks");
    const snapshot = await getDocs(colRef);
    const artworks = [];
    snapshot.forEach((d) => {
      artworks.push({ id: d.id, ...d.data() });
    });
    return artworks;
  } catch (err) {
    reportFirebaseError("Fetch Artworks", err);
    throw err;
  }
}

export async function saveArtworkToFirestore(artwork) {
  try {
    const docRef = doc(db, "artworks", artwork.id);
    await setDoc(docRef, artwork, { merge: true });
    return artwork;
  } catch (err) {
    reportFirebaseError(`Save Artwork '${artwork.title || artwork.id}'`, err);
    throw err;
  }
}

// -------------------------------------------------------------
// Firestore Activities Services
// -------------------------------------------------------------

export async function fetchActivitiesFromFirestore() {
  try {
    const colRef = collection(db, "activities");
    const snapshot = await getDocs(colRef);
    const activities = [];
    snapshot.forEach((d) => {
      activities.push({ id: d.id, ...d.data() });
    });
    return activities;
  } catch (err) {
    reportFirebaseError("Fetch Activities", err);
    throw err;
  }
}

export async function saveActivityToFirestore(activity) {
  try {
    const docRef = doc(db, "activities", activity.id);
    await setDoc(docRef, activity, { merge: true });
    return activity;
  } catch (err) {
    reportFirebaseError(`Save Activity`, err);
    throw err;
  }
}

// -------------------------------------------------------------
// Firestore Suppliers Services
// -------------------------------------------------------------

export async function fetchSuppliersFromFirestore() {
  try {
    const colRef = collection(db, "suppliers");
    const snapshot = await getDocs(colRef);
    const suppliers = [];
    snapshot.forEach((d) => {
      suppliers.push({ id: d.id, ...d.data() });
    });
    return suppliers;
  } catch (err) {
    reportFirebaseError("Fetch Suppliers", err);
    throw err;
  }
}

export async function saveSupplierToFirestore(supplier) {
  try {
    const docRef = doc(db, "suppliers", supplier.id);
    await setDoc(docRef, supplier, { merge: true });
    return supplier;
  } catch (err) {
    reportFirebaseError(`Save Supplier '${supplier.name || supplier.id}'`, err);
    throw err;
  }
}

// -------------------------------------------------------------
// Firestore Orders Services & Real-time Snapshot
// -------------------------------------------------------------

export async function fetchOrdersFromFirestore() {
  try {
    const colRef = collection(db, "orders");
    const snapshot = await getDocs(colRef);
    const orders = [];
    snapshot.forEach((d) => {
      orders.push({ id: d.id, ...d.data() });
    });
    return orders;
  } catch (err) {
    reportFirebaseError("Fetch Orders", err);
    throw err;
  }
}

export async function saveOrderToFirestore(order) {
  try {
    const docRef = doc(db, "orders", order.id);
    await setDoc(docRef, order, { merge: true });
    return order;
  } catch (err) {
    reportFirebaseError(`Save Order '${order.trackingCode || order.id}'`, err);
    throw err;
  }
}

export async function updateOrderInFirestore(id, updates) {
  try {
    const docRef = doc(db, "orders", id);
    await updateDoc(docRef, updates);
    return { id, ...updates };
  } catch (err) {
    reportFirebaseError(`Update Order '${id}'`, err);
    throw err;
  }
}

/**
 * Real-time listener for orders collection.
 * Invokes callback with updated list of orders.
 */
export function onOrdersSnapshot(callback) {
  try {
    const colRef = collection(db, "orders");
    return onSnapshot(colRef, (snapshot) => {
      const orders = [];
      snapshot.forEach((d) => {
        orders.push({ id: d.id, ...d.data() });
      });
      callback(orders);
    }, (err) => {
      reportFirebaseError("Orders Realtime Snapshot", err);
    });
  } catch (err) {
    reportFirebaseError("Setup Orders Realtime Snapshot", err);
    return () => {};
  }
}

// -------------------------------------------------------------
// Firebase Authentication & Customer Management Services
// (Stores customer profiles & tracks provided materials)
// -------------------------------------------------------------

export async function fetchUsersFromFirestore() {
  try {
    const colRef = collection(db, "users");
    const snapshot = await getDocs(colRef);
    const users = [];
    snapshot.forEach((d) => {
      users.push({ id: d.id, ...d.data() });
    });
    return users;
  } catch (err) {
    reportFirebaseError("Fetch Customers", err);
    throw err;
  }
}

export async function saveUserToFirestore(user) {
  try {
    const docRef = doc(db, "users", user.id);
    await setDoc(docRef, user, { merge: true });
    return user;
  } catch (err) {
    reportFirebaseError(`Save Customer Profile '${user.name || user.id}'`, err);
    throw err;
  }
}

export async function updateUserInFirestore(userId, updates) {
  try {
    const docRef = doc(db, "users", userId);
    await updateDoc(docRef, updates);
    return { id: userId, ...updates };
  } catch (err) {
    reportFirebaseError(`Update Customer Profile '${userId}'`, err);
    throw err;
  }
}

/**
 * Record that a customer has been provided with a specific material in Firestore.
 */
export async function recordCustomerMaterialInFirestore(userId, materialRecord) {
  try {
    const docRef = doc(db, "users", userId);
    const docSnap = await getDoc(docRef);
    
    let currentProvided = [];
    let currentWaste = 0;
    let currentCount = 0;

    if (docSnap.exists()) {
      const data = docSnap.data();
      currentProvided = Array.isArray(data.providedMaterials) ? data.providedMaterials : [];
      currentWaste = Number(data.totalWasteDivertedKg) || 0;
      currentCount = Number(data.totalMaterialsReceived) || 0;
    }

    const updatedProvided = [materialRecord, ...currentProvided];
    const updatedWaste = Number((currentWaste + (Number(materialRecord.weightKg) || 0)).toFixed(1));
    const updatedCount = currentCount + 1;

    const updates = {
      providedMaterials: updatedProvided,
      totalWasteDivertedKg: updatedWaste,
      totalMaterialsReceived: updatedCount,
      lastMaterialProvidedAt: new Date().toISOString()
    };

    await setDoc(docRef, updates, { merge: true });
    return updates;
  } catch (err) {
    reportFirebaseError(`Record Customer Material Allocation '${userId}'`, err);
    throw err;
  }
}

/**
 * Register a new user with Firebase Authentication and record profile in Firestore.
 */
export async function registerWithFirebase(name, email, password, role = "creator") {
  let uid = null;
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    uid = userCredential.user.uid;
  } catch (authErr) {
    reportFirebaseError(`Sign Up Auth (${email})`, authErr);
    // If Firebase Auth is disabled or restricted in Firebase Console, fallback to Firestore ID
    uid = `cust-${Date.now()}`;
  }

  const userProfile = {
    id: uid,
    name: name.trim(),
    displayName: name.trim(),
    email: email.trim().toLowerCase(),
    role: role || "creator",
    studio: `${name.trim()}'s Atelier`,
    avatar: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80`,
    city: "Ranchi, Jharkhand",
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
    providedMaterials: [],
    totalWasteDivertedKg: 0,
    totalMaterialsReceived: 0
  };

  try {
    await saveUserToFirestore(userProfile);
  } catch (err) {
    // Already reported via saveUserToFirestore
  }

  return userProfile;
}

/**
 * Sign in an existing user with Firebase Authentication.
 */
export async function signInWithFirebase(email, password) {
  let user = null;
  const cleanEmail = email.trim().toLowerCase();

  try {
    const cred = await signInWithEmailAndPassword(auth, cleanEmail, password);
    user = {
      id: cred.user.uid,
      email: cred.user.email
    };
  } catch (authErr) {
    reportFirebaseError(`Sign In Auth (${cleanEmail})`, authErr);
  }

  // Lookup customer details from Firestore
  try {
    const users = await fetchUsersFromFirestore();
    const existing = users.find(u => u.email?.toLowerCase() === cleanEmail);
    if (existing) {
      user = { ...existing, ...(user || {}) };
      // Update lastLogin
      updateUserInFirestore(existing.id, { lastLogin: new Date().toISOString() }).catch(() => {});
      return user;
    }
  } catch (e) {}

  if (user) {
    return {
      id: user.id,
      name: cleanEmail.split('@')[0],
      email: cleanEmail,
      role: 'creator',
      providedMaterials: []
    };
  }

  throw new Error("Unable to sign in. Please verify your email and password or use a 1-click demo account.");
}

/**
 * Sign in using Google popup via Firebase Authentication.
 */
export async function signInWithGoogle(role = "creator") {
  const provider = new GoogleAuthProvider();
  let user = null;

  try {
    const cred = await signInWithPopup(auth, provider);
    const authUser = cred.user;
    const cleanEmail = (authUser.email || "").toLowerCase();
    const displayName = authUser.displayName || cleanEmail.split('@')[0] || "Artist Creator";

    user = {
      id: authUser.uid,
      name: displayName,
      displayName: displayName,
      email: cleanEmail,
      role: role || 'creator',
      studio: `${displayName}'s Atelier`,
      avatar: authUser.photoURL || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80`,
      city: "Ranchi, Jharkhand",
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      providedMaterials: [],
      totalWasteDivertedKg: 0,
      totalMaterialsReceived: 0
    };
  } catch (authErr) {
    reportFirebaseError("Google Sign-In", authErr);
    throw authErr;
  }

  // Lookup existing profile or create in Firestore
  try {
    const users = await fetchUsersFromFirestore();
    const existing = users.find(u => u.email?.toLowerCase() === user.email);
    if (existing) {
      user = { ...existing, lastLogin: user.lastLogin, avatar: user.avatar || existing.avatar };
      await updateUserInFirestore(existing.id, { lastLogin: user.lastLogin });
      return user;
    } else {
      await saveUserToFirestore(user);
    }
  } catch (err) {
    console.warn("Could not sync Google user profile with Firestore:", err);
  }

  return user;
}

/**
 * Sign out from Firebase Authentication.
 */
export async function signOutFromFirebase() {
  try {
    await firebaseSignOut(auth);
  } catch (err) {
    reportFirebaseError("Sign Out", err);
  }
}

/**
 * Listen to Firebase Auth state changes.
 */
export function onAuthStateListener(callback) {
  try {
    return onAuthStateChanged(auth, callback);
  } catch (e) {
    return () => {};
  }
}
