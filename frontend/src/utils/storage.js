import { INITIAL_MATERIALS, INITIAL_ARTWORKS, INITIAL_ACTIVITIES } from '../constants/seedData.js';
import { INITIAL_SUPPLIERS, INITIAL_ORDERS, DELIVERY_STATUS_STEPS, PICKUP_STATUS_STEPS } from '../constants/seedSuppliers.js';
import { INITIAL_CUSTOMERS } from '../constants/seedCustomers.js';
import { 
  fetchMaterialsFromFirestore, 
  saveMaterialToFirestore, 
  updateMaterialInFirestore, 
  deleteMaterialFromFirestore,
  fetchArtworksFromFirestore, 
  saveArtworkToFirestore, 
  fetchActivitiesFromFirestore, 
  saveActivityToFirestore,
  fetchSuppliersFromFirestore,
  saveSupplierToFirestore,
  fetchOrdersFromFirestore,
  saveOrderToFirestore,
  updateOrderInFirestore,
  fetchUsersFromFirestore,
  saveUserToFirestore,
  updateUserInFirestore,
  recordCustomerMaterialInFirestore,
  onOrdersSnapshot,
  reportFirebaseError 
} from '../firebase.js';

const STORAGE_KEYS = {
  MATERIALS: 'reform_materials_v1',
  ARTWORKS: 'reform_artworks_v1',
  ACTIVITIES: 'reform_activities_v1',
  ACTIVE_CHALLENGE: 'reform_active_challenge_v1',
  SUPPLIERS: 'reform_suppliers_v1',
  ORDERS: 'reform_orders_v1',
  CUSTOMERS: 'reform_customers_v1',
  CURRENT_USER: 'reform_current_user_v1'
};

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (err) {
    console.warn(`[Storage] Failed to read ${key}:`, err);
    return fallback;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn(`[Storage] Failed to write ${key}:`, err);
  }
}

// -------------------------------------------------------------
// Materials
// -------------------------------------------------------------

export function getMaterials() {
  return read(STORAGE_KEYS.MATERIALS, INITIAL_MATERIALS);
}

export function saveMaterials(materials) {
  write(STORAGE_KEYS.MATERIALS, materials);
}

export function addMaterials(newMaterials) {
  const current = getMaterials();
  // Prevent duplicate additions of materials with the exact same name
  const filteredNew = newMaterials.filter(
    newMat => !current.some(c => c.name.trim().toLowerCase() === newMat.name.trim().toLowerCase())
  );

  const materialsToCommit = filteredNew.length > 0 ? filteredNew : newMaterials.map((m, i) => ({
    ...m,
    id: `mat-${Date.now()}-${i + 1}`,
    name: `${m.name} (Batch #${Date.now().toString().slice(-4)})`
  }));

  const updated = [...materialsToCommit, ...current];
  saveMaterials(updated);

  // Sync each new material to Firestore
  materialsToCommit.forEach(async (mat) => {
    try {
      await saveMaterialToFirestore(mat);
    } catch (err) {
      // reportFirebaseError is called inside saveMaterialToFirestore
    }
  });

  const totalAddedWeight = materialsToCommit.reduce((acc, m) => acc + (Number(m.estimated_weight_kg) || 0), 0);
  const names = materialsToCommit.map(m => m.name).slice(0, 2).join(', ') + (materialsToCommit.length > 2 ? ` +${materialsToCommit.length - 2} more` : '');

  addActivity(
    'material_added',
    `Added ${materialsToCommit.length} new scrap material(s): ${names} (${totalAddedWeight.toFixed(1)} kg)`
  );

  return updated;
}

export function updateMaterial(id, updates) {
  const current = getMaterials();
  const updated = current.map(item => item.id === id ? { ...item, ...updates } : item);
  saveMaterials(updated);

  // Sync to Firestore
  updateMaterialInFirestore(id, updates).catch(() => {});

  return updated;
}

export function deleteMaterial(id) {
  const current = getMaterials();
  const updated = current.filter(item => item.id !== id);
  saveMaterials(updated);

  // Sync to Firestore
  deleteMaterialFromFirestore(id).catch(() => {});

  return updated;
}

// -------------------------------------------------------------
// Artworks
// -------------------------------------------------------------

export function getArtworks() {
  return read(STORAGE_KEYS.ARTWORKS, INITIAL_ARTWORKS);
}

export function saveArtworks(artworks) {
  write(STORAGE_KEYS.ARTWORKS, artworks);
}

export function addArtwork(artwork) {
  const current = getArtworks();
  const updated = [artwork, ...current];
  saveArtworks(updated);

  // Sync artwork to Firestore
  saveArtworkToFirestore(artwork).catch(() => {});

  // Mark used materials
  if (artwork.materialsUsed && Array.isArray(artwork.materialsUsed)) {
    const currentMaterials = getMaterials();
    const usedNames = artwork.materialsUsed.map(m => (m.name || m).toLowerCase().trim());
    const updatedMats = currentMaterials.map(m => {
      if (usedNames.includes(m.name.toLowerCase().trim()) || artwork.usedMaterialIds?.includes(m.id)) {
        // Sync used status to Firestore
        updateMaterialInFirestore(m.id, { used: true }).catch(() => {});
        return { ...m, used: true };
      }
      return m;
    });
    saveMaterials(updatedMats);
  }

  // Clear in-progress challenge
  clearActiveChallenge();

  // Log activity
  addActivity(
    'artwork_completed',
    `Completed artwork '${artwork.title}' (${artwork.divertedWeightKg} kg diverted)`
  );

  return updated;
}

// -------------------------------------------------------------
// Activities
// -------------------------------------------------------------

export function getActivities() {
  return read(STORAGE_KEYS.ACTIVITIES, INITIAL_ACTIVITIES);
}

export function addActivity(type, text) {
  const current = getActivities();
  const newActivity = {
    id: `act-${Date.now()}`,
    type,
    text,
    timestamp: 'Just now'
  };
  const updated = [newActivity, ...current].slice(0, 10);
  write(STORAGE_KEYS.ACTIVITIES, updated);

  // Sync activity to Firestore
  saveActivityToFirestore(newActivity).catch(() => {});

  return updated;
}

// -------------------------------------------------------------
// Active Challenge
// -------------------------------------------------------------

export function getActiveChallenge() {
  return read(STORAGE_KEYS.ACTIVE_CHALLENGE, null);
}

export function setActiveChallenge(challenge) {
  write(STORAGE_KEYS.ACTIVE_CHALLENGE, challenge);
  if (challenge) {
    addActivity('challenge_generated', `Accepted challenge: '${challenge.title}'`);
  }
}

export function clearActiveChallenge() {
  try {
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_CHALLENGE);
  } catch (err) {
    console.warn(err);
  }
}

// -------------------------------------------------------------
// Suppliers
// -------------------------------------------------------------

export function getSuppliers() {
  return read(STORAGE_KEYS.SUPPLIERS, INITIAL_SUPPLIERS);
}

export function saveSuppliers(suppliers) {
  write(STORAGE_KEYS.SUPPLIERS, suppliers);
}

// -------------------------------------------------------------
// Orders & Tracking
// -------------------------------------------------------------

export function getOrders() {
  return read(STORAGE_KEYS.ORDERS, INITIAL_ORDERS);
}

export function saveOrders(orders) {
  write(STORAGE_KEYS.ORDERS, orders);
}

export function addOrder(orderData) {
  const current = getOrders();
  const currentMaterials = getMaterials();

  // Data consistency check: verify none of the requested materials are already used or reserved
  if (orderData.materialIds && orderData.materialIds.length > 0) {
    const conflictMats = currentMaterials.filter(
      m => orderData.materialIds.includes(m.id) && (m.used || m.reserved)
    );
    if (conflictMats.length > 0) {
      const names = conflictMats.map(m => m.name).join(', ');
      throw new Error(`Cannot request materials: "${names}" are already claimed or reserved.`);
    }
  }

  const currentUser = getCurrentUser();
  const id = `ord-${Date.now()}`;
  const trackingCode = `RF-2026-${Math.floor(10000 + Math.random() * 90000)}`;
  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const newOrder = {
    id,
    trackingCode,
    creatorId: orderData.creatorId || currentUser?.id || "cust-aanya",
    creatorEmail: orderData.creatorEmail || currentUser?.email || "aanya.artist@reform.studio",
    creatorName: orderData.creatorName || currentUser?.name || "Aanya Sharma",
    supplierId: orderData.supplierId,
    supplierName: orderData.supplierName || "Studio Supplier",
    method: orderData.method || "pickup",
    deliveryAddress: orderData.deliveryAddress || (orderData.method === 'pickup' ? 'Studio Collection Point' : 'Studio Atelier, Ranchi'),
    materialIds: orderData.materialIds || [],
    materialNames: orderData.materialNames || ["Assorted Studio Scraps"],
    notes: orderData.notes || "",
    status: "Requested",
    createdAt: now.toISOString(),
    estimatedDelivery: orderData.method === 'pickup' ? 'Today, 4:00 PM' : 'Tomorrow by 2:00 PM',
    statusHistory: [
      {
        status: "Requested",
        timestamp: timeStr,
        note: orderData.method === 'pickup' ? "Pickup reservation placed" : "Delivery request submitted"
      }
    ]
  };

  const updatedOrders = [newOrder, ...current];
  saveOrders(updatedOrders);

  // Sync order to Firestore
  saveOrderToFirestore(newOrder).catch(() => {});

  // Mark reserved materials in inventory
  if (newOrder.materialIds && newOrder.materialIds.length > 0) {
    const currentMaterials = getMaterials();
    const updatedMats = currentMaterials.map(m => {
      if (newOrder.materialIds.includes(m.id)) {
        updateMaterialInFirestore(m.id, { used: true, reserved: true, orderId: id }).catch(() => {});
        return { ...m, used: true, reserved: true, orderId: id };
      }
      return m;
    });
    saveMaterials(updatedMats);
  }

  // Log activity
  addActivity(
    'material_added',
    `Placed request #${trackingCode} with ${newOrder.supplierName} (${newOrder.materialNames.join(', ')})`
  );

  return { newOrder, updatedOrders };
}

export function advanceOrderStatus(orderId, targetStatus = null, customNote = null) {
  const currentOrders = getOrders();
  const orderIndex = currentOrders.findIndex(o => o.id === orderId);
  if (orderIndex === -1) return currentOrders;

  const order = currentOrders[orderIndex];
  const steps = order.method === 'pickup' ? PICKUP_STATUS_STEPS : DELIVERY_STATUS_STEPS;
  
  let nextStatus = targetStatus;
  if (!nextStatus) {
    const currentIndex = steps.indexOf(order.status);
    if (currentIndex >= 0 && currentIndex < steps.length - 1) {
      nextStatus = steps[currentIndex + 1];
    } else {
      nextStatus = steps[0]; // loop back for demo flexibility
    }
  }

  const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const note = customNote || (
    nextStatus === 'Confirmed' ? 'Supplier accepted material request' :
    nextStatus === 'Packed' ? 'Materials bundled in eco-wrap' :
    nextStatus === 'Dispatched' ? 'Courier in transit' :
    nextStatus === 'Ready for pickup' ? 'Package waiting at reception' :
    nextStatus === 'Out for delivery' ? 'Courier approaching delivery location' :
    nextStatus === 'Delivered' ? 'Delivered into artist studio' :
    nextStatus === 'Collected' ? 'Collected by creator' :
    `Status updated to ${nextStatus}`
  );

  const updatedHistory = [
    ...(order.statusHistory || []),
    { status: nextStatus, timestamp: timeStr, note }
  ];

  const updatedOrder = {
    ...order,
    status: nextStatus,
    statusHistory: updatedHistory
  };

  const updatedOrders = [...currentOrders];
  updatedOrders[orderIndex] = updatedOrder;
  saveOrders(updatedOrders);

  // Sync to Firestore
  updateOrderInFirestore(orderId, {
    status: nextStatus,
    statusHistory: updatedHistory
  }).catch(() => {});

  if (nextStatus === 'Delivered' || nextStatus === 'Collected') {
    addActivity(
      'material_added',
      `Order #${order.trackingCode} ${nextStatus.toLowerCase()}! Materials ready for challenge.`
    );

    // Record formal scrap material provision to the customer in Firestore
    try {
      const allMats = getMaterials();
      const orderMats = allMats.filter(m => order.materialIds?.includes(m.id));
      const targetUserId = order.creatorId || 'cust-aanya';

      if (orderMats.length > 0) {
        orderMats.forEach(m => {
          addCustomerMaterial(targetUserId, {
            materialId: m.id,
            name: m.name,
            type: m.type || 'scrap',
            quantity: m.quantity || '1 batch',
            weightKg: Number(m.estimated_weight_kg) || 0.5,
            supplierId: order.supplierId,
            supplierName: order.supplierName,
            orderId: order.id,
            trackingCode: order.trackingCode,
            providedAt: new Date().toISOString(),
            status: nextStatus,
            method: order.method,
            notes: `Supplied by ${order.supplierName} to ${order.creatorName}`
          });
        });
      } else {
        const matNames = Array.isArray(order.materialNames) ? order.materialNames : [order.materialNames || 'Assorted Scraps'];
        matNames.forEach(name => {
          addCustomerMaterial(targetUserId, {
            materialId: `mat-${Date.now()}`,
            name,
            type: 'fabric',
            quantity: '1 batch',
            weightKg: 1.0,
            supplierId: order.supplierId,
            supplierName: order.supplierName,
            orderId: order.id,
            trackingCode: order.trackingCode,
            providedAt: new Date().toISOString(),
            status: nextStatus,
            method: order.method,
            notes: `Supplied by ${order.supplierName} to ${order.creatorName}`
          });
        });
      }
    } catch (e) {
      console.warn("Could not record customer material provision:", e);
    }
  }

  return updatedOrders;
}

// -------------------------------------------------------------
// Customers & Provided Materials
// -------------------------------------------------------------

export function getCustomers() {
  return read(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
}

export function saveCustomers(customers) {
  write(STORAGE_KEYS.CUSTOMERS, customers);
}

export function getCurrentUser() {
  return read(STORAGE_KEYS.CURRENT_USER, INITIAL_CUSTOMERS[0]);
}

export function setCurrentUser(user) {
  write(STORAGE_KEYS.CURRENT_USER, user || null);
}

export function addCustomerMaterial(userId, materialRecord) {
  const currentCustomers = getCustomers();
  const custIndex = currentCustomers.findIndex(c => c.id === userId || c.email === userId);
  
  if (custIndex === -1) {
    const newCust = {
      id: userId || `cust-${Date.now()}`,
      name: materialRecord.customerName || "Independent Artist",
      email: materialRecord.customerEmail || "artist@reform.studio",
      role: "creator",
      providedMaterials: [materialRecord],
      totalWasteDivertedKg: Number(materialRecord.weightKg) || 0,
      totalMaterialsReceived: 1,
      createdAt: new Date().toISOString()
    };
    const updated = [newCust, ...currentCustomers];
    saveCustomers(updated);
    recordCustomerMaterialInFirestore(newCust.id, materialRecord).catch(() => {});
    return updated;
  }

  const customer = currentCustomers[custIndex];
  const existingProvided = Array.isArray(customer.providedMaterials) ? customer.providedMaterials : [];
  
  // Avoid duplicate record for same order & material
  const isDuplicate = existingProvided.some(
    p => p.orderId === materialRecord.orderId && p.materialId === materialRecord.materialId
  );
  if (isDuplicate) return currentCustomers;

  const updatedProvided = [materialRecord, ...existingProvided];
  const updatedWaste = Number(((Number(customer.totalWasteDivertedKg) || 0) + (Number(materialRecord.weightKg) || 0)).toFixed(1));
  const updatedCount = (Number(customer.totalMaterialsReceived) || 0) + 1;

  const updatedCustomer = {
    ...customer,
    providedMaterials: updatedProvided,
    totalWasteDivertedKg: updatedWaste,
    totalMaterialsReceived: updatedCount
  };

  const updatedList = [...currentCustomers];
  updatedList[custIndex] = updatedCustomer;
  saveCustomers(updatedList);

  const currentUser = getCurrentUser();
  if (currentUser && (currentUser.id === customer.id || currentUser.email === customer.email)) {
    setCurrentUser(updatedCustomer);
  }

  recordCustomerMaterialInFirestore(customer.id, materialRecord).catch(() => {});

  return updatedList;
}

export function resetToDefaults() {
  write(STORAGE_KEYS.MATERIALS, INITIAL_MATERIALS);
  write(STORAGE_KEYS.ARTWORKS, INITIAL_ARTWORKS);
  write(STORAGE_KEYS.ACTIVITIES, INITIAL_ACTIVITIES);
  write(STORAGE_KEYS.SUPPLIERS, INITIAL_SUPPLIERS);
  write(STORAGE_KEYS.ORDERS, INITIAL_ORDERS);
  write(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
  write(STORAGE_KEYS.CURRENT_USER, INITIAL_CUSTOMERS[0]);
  clearActiveChallenge();

  // Asynchronously clean up surplus remote demo materials from Firestore
  fetchMaterialsFromFirestore().then(remote => {
    if (Array.isArray(remote)) {
      const surplus = remote.filter(m => !INITIAL_MATERIALS.some(im => im.id === m.id));
      surplus.forEach(m => deleteMaterialFromFirestore(m.id).catch(() => {}));
    }
  }).catch(() => {});
}

export function getLiveStats() {
  const materials = getMaterials();
  const artworks = getArtworks();
  const orders = getOrders();

  const availableCount = materials.filter(m => !m.used).length;
  const completedCount = artworks.length;

  const totalDiverted = artworks.reduce((acc, art) => acc + (Number(art.divertedWeightKg) || 0), 0);
  const totalCO2e = artworks.reduce((acc, art) => acc + (Number(art.co2eAvoidedKg) || 0), 0);

  const activeOrders = orders.filter(o => !['Delivered', 'Collected', 'Cancelled'].includes(o.status));
  const latestOrder = orders[0] || null;

  return {
    materialsAvailable: availableCount,
    challengesCompleted: completedCount,
    wasteDivertedKg: Number(totalDiverted.toFixed(1)),
    co2eAvoidedKg: Number(totalCO2e.toFixed(1)),
    activeOrdersCount: activeOrders.length,
    latestOrderStatus: latestOrder ? latestOrder.status : 'None',
    latestOrderTracking: latestOrder ? latestOrder.trackingCode : null
  };
}

// -------------------------------------------------------------
// Firestore Initial Sync & Auto-Seed (Idempotent & Atomic)
// -------------------------------------------------------------

let isSyncing = false;

export async function syncWithFirestore(onUpdate) {
  if (isSyncing) return;
  isSyncing = true;

  try {
    // 1. Fetch materials - seed only if collection is empty, and automatically prune duplicates
    const remoteMaterials = await fetchMaterialsFromFirestore();
    if (remoteMaterials && remoteMaterials.length > 0) {
      // Deduplicate materials by clean name to prevent duplicate scrap piles
      const seenNames = new Set();
      const uniqueMaterials = [];
      const duplicateDocIds = [];

      for (const m of remoteMaterials) {
        const key = (m.name || '').trim().toLowerCase();
        if (!seenNames.has(key)) {
          seenNames.add(key);
          uniqueMaterials.push(m);
        } else {
          duplicateDocIds.push(m.id);
        }
      }

      // Automatically prune duplicate documents from Firestore in background
      if (duplicateDocIds.length > 0) {
        duplicateDocIds.forEach(id => {
          deleteMaterialFromFirestore(id).catch(() => {});
        });
      }

      saveMaterials(uniqueMaterials);
      onUpdate?.({ materials: uniqueMaterials });
    } else {
      await Promise.all(
        INITIAL_MATERIALS.map(mat => saveMaterialToFirestore(mat).catch(() => {}))
      );
      saveMaterials(INITIAL_MATERIALS);
      onUpdate?.({ materials: INITIAL_MATERIALS });
    }

    // 2. Fetch artworks - seed only if collection is empty
    const remoteArtworks = await fetchArtworksFromFirestore();
    if (remoteArtworks && remoteArtworks.length > 0) {
      saveArtworks(remoteArtworks);
      onUpdate?.({ artworks: remoteArtworks });
    } else {
      await Promise.all(
        INITIAL_ARTWORKS.map(art => saveArtworkToFirestore(art).catch(() => {}))
      );
      saveArtworks(INITIAL_ARTWORKS);
      onUpdate?.({ artworks: INITIAL_ARTWORKS });
    }

    // 3. Fetch activities - seed only if collection is empty
    const remoteActivities = await fetchActivitiesFromFirestore();
    if (remoteActivities && remoteActivities.length > 0) {
      write(STORAGE_KEYS.ACTIVITIES, remoteActivities);
      onUpdate?.({ activities: remoteActivities });
    } else {
      await Promise.all(
        INITIAL_ACTIVITIES.map(act => saveActivityToFirestore(act).catch(() => {}))
      );
      write(STORAGE_KEYS.ACTIVITIES, INITIAL_ACTIVITIES);
      onUpdate?.({ activities: INITIAL_ACTIVITIES });
    }

    // 4. Fetch suppliers - seed only if collection is empty
    const remoteSuppliers = await fetchSuppliersFromFirestore();
    if (remoteSuppliers && remoteSuppliers.length > 0) {
      saveSuppliers(remoteSuppliers);
      onUpdate?.({ suppliers: remoteSuppliers });
    } else {
      await Promise.all(
        INITIAL_SUPPLIERS.map(sup => saveSupplierToFirestore(sup).catch(() => {}))
      );
      saveSuppliers(INITIAL_SUPPLIERS);
      onUpdate?.({ suppliers: INITIAL_SUPPLIERS });
    }

    // 5. Fetch orders - seed only if collection is empty
    const remoteOrders = await fetchOrdersFromFirestore();
    if (remoteOrders && remoteOrders.length > 0) {
      saveOrders(remoteOrders);
      onUpdate?.({ orders: remoteOrders });
    } else {
      await Promise.all(
        INITIAL_ORDERS.map(ord => saveOrderToFirestore(ord).catch(() => {}))
      );
      saveOrders(INITIAL_ORDERS);
      onUpdate?.({ orders: INITIAL_ORDERS });
    }

    // 6. Fetch users & provided materials - seed only if collection is empty
    const remoteUsers = await fetchUsersFromFirestore();
    if (remoteUsers && remoteUsers.length > 0) {
      saveCustomers(remoteUsers);
      onUpdate?.({ customers: remoteUsers });
    } else {
      await Promise.all(
        INITIAL_CUSTOMERS.map(cust => saveUserToFirestore(cust).catch(() => {}))
      );
      saveCustomers(INITIAL_CUSTOMERS);
      onUpdate?.({ customers: INITIAL_CUSTOMERS });
    }
  } catch (err) {
    console.warn("[Firestore Sync Notice]: Local fallback active.", err.message);
  } finally {
    isSyncing = false;
  }
}
