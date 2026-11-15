import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { DEFAULT_MAP_CENTER } from '../constants/seedSuppliers.js';
import { calculateDistance, sortSuppliersByDistance, formatDistance } from '../utils/distance.js';
import { getSuppliers, getMaterials, getActiveChallenge } from '../utils/storage.js';
import RequestMaterialModal from '../components/RequestMaterialModal.jsx';

// Custom Map View Re-center Controller
function ChangeView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.flyTo(center, zoom || 13, { duration: 1.2 });
    }
  }, [center, zoom, map]);
  return null;
}

// Map Click Handler to drop custom user pin
function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      if (onMapClick) {
        onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng });
      }
    }
  });
  return null;
}

// Custom Leaflet DivIcons to avoid Vite asset bundler 404 bugs
const userLocationIcon = L.divIcon({
  className: 'custom-user-marker',
  html: `
    <div style="
      position: relative;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: #60A5FA;
      border: 3px solid #0A0A0D;
      box-shadow: 0 0 14px rgba(96, 165, 250, 0.85);
      animation: pulseUser 2s infinite ease-in-out;
    "></div>
  `,
  iconSize: [22, 22],
  iconAnchor: [11, 11]
});

const createSupplierIcon = (isSelected, isBestMatch) => {
  const size = isSelected ? 34 : (isBestMatch ? 30 : 26);
  const bg = isSelected ? '#D48A94' : (isBestMatch ? '#E8B4B8' : '#1E1E26');
  const color = isSelected || isBestMatch ? '#0A0A0D' : '#D48A94';
  const border = isSelected ? '#FFFFFF' : 'var(--accent)';

  return L.divIcon({
    className: 'custom-supplier-marker',
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        background: ${bg};
        border: 2px solid ${border};
        display: flex;
        align-items: center;
        justify-content: center;
        color: ${color};
        box-shadow: 0 4px 14px rgba(212, 138, 148, ${isSelected ? '0.7' : '0.3'});
        cursor: pointer;
        transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      ">
        <svg width="${size * 0.5}" height="${size * 0.5}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
          <circle cx="12" cy="10" r="3"></circle>
        </svg>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2]
  });
};

export default function MapPage({ currentUser, onOpenAuth, onNavigateTab, onShowToast }) {
  const [suppliers, setSuppliers] = useState(getSuppliers);
  const [materials, setMaterials] = useState(getMaterials);
  const [activeChallenge] = useState(getActiveChallenge);

  const handleRequestClick = (supplier) => {
    if (!currentUser) {
      if (onOpenAuth) onOpenAuth();
      if (onShowToast) onShowToast("Please sign in or continue as a demo user to request materials.");
      return;
    }
    setModalSupplier(supplier);
  };

  // User location state
  const [userLocation, setUserLocation] = useState(DEFAULT_MAP_CENTER);
  const [locationSource, setLocationSource] = useState('Default: Ranchi, JH');
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState(null);

  // Filters
  const [selectedType, setSelectedType] = useState('all');
  const [maxDistance, setMaxDistance] = useState(25); // km
  const [searchCity, setSearchCity] = useState('');

  // Selected supplier & modal
  const [selectedSupplierId, setSelectedSupplierId] = useState(null);
  const [modalSupplier, setModalSupplier] = useState(null);

  // AI Matching state
  const [bestMatchAi, setBestMatchAi] = useState(null);
  const [loadingAiMatch, setLoadingAiMatch] = useState(false);

  // Request browser geolocation on mount
  useEffect(() => {
    requestGeolocation();
  }, []);

  const requestGeolocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      return;
    }
    setLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(coords);
        setLocationSource('Your Live Location');
        setLocating(false);
      },
      (err) => {
        console.warn("Geolocation denied or unavailable:", err.message);
        setLocationError("Location access denied or unavailable. Showing Ranchi default.");
        setLocating(false);
      },
      { timeout: 8000, enableHighAccuracy: false }
    );
  };

  // Calculate distance for all suppliers from current userLocation
  const suppliersWithDistance = useMemo(() => {
    const calculated = suppliers.map(sup => {
      const dist = calculateDistance(userLocation.lat, userLocation.lng, sup.lat, sup.lng);
      return {
        ...sup,
        distance: dist
      };
    });
    return sortSuppliersByDistance(calculated);
  }, [suppliers, userLocation]);

  // Filtered suppliers
  const filteredSuppliers = useMemo(() => {
    return suppliersWithDistance.filter(sup => {
      // Distance filter
      if (sup.distance > maxDistance) return false;

      // Material type filter
      if (selectedType !== 'all') {
        const supMaterials = materials.filter(m => m.supplierId === sup.id && !m.used);
        const hasMatchingMaterial = supMaterials.some(m => m.type === selectedType);
        const typeMatch = (sup.businessType || '').toLowerCase().includes(selectedType);
        if (!hasMatchingMaterial && !typeMatch) return false;
      }

      return true;
    });
  }, [suppliersWithDistance, materials, selectedType, maxDistance]);

  // Top/Best Match
  const topSupplier = filteredSuppliers[0] || suppliersWithDistance[0];

  // Fetch AI Match explanation when top supplier or active challenge changes
  useEffect(() => {
    if (!topSupplier) return;

    let isMounted = true;
    setLoadingAiMatch(true);

    const neededMaterials = activeChallenge ? activeChallenge.materials : materials.filter(m => !m.used).slice(0, 3);

    fetch('/api/match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        materials: neededMaterials,
        suppliers: suppliersWithDistance.slice(0, 5),
        challengeTitle: activeChallenge?.title || 'Studio Upcycling'
      })
    })
      .then(res => res.json())
      .then(data => {
        if (isMounted) {
          setBestMatchAi(data);
          setLoadingAiMatch(false);
        }
      })
      .catch(err => {
        console.warn("AI match call error:", err);
        if (isMounted) {
          setLoadingAiMatch(false);
        }
      });

    return () => { isMounted = false; };
  }, [topSupplier?.id, activeChallenge?.title]);

  const handleCitySearch = (e) => {
    e.preventDefault();
    if (!searchCity.trim()) return;
    // Simple city lookup heuristic for demo
    const city = searchCity.toLowerCase();
    if (city.includes('ranchi')) {
      setUserLocation(DEFAULT_MAP_CENTER);
      setLocationSource('Ranchi Center');
    } else if (city.includes('jamshedpur')) {
      setUserLocation({ lat: 22.8046, lng: 86.2029 });
      setLocationSource('Jamshedpur');
    } else if (city.includes('dhanbad')) {
      setUserLocation({ lat: 23.7957, lng: 86.4304 });
      setLocationSource('Dhanbad');
    } else {
      // Default nearby simulated search point
      setUserLocation({ lat: DEFAULT_MAP_CENTER.lat + 0.015, lng: DEFAULT_MAP_CENTER.lng + 0.012 });
      setLocationSource(`Searched: ${searchCity}`);
    }
  };

  const selectedSupplier = suppliersWithDistance.find(s => s.id === selectedSupplierId) || topSupplier;

  return (
    <div className="tab-pane active animate-fade-in" style={{ paddingBottom: '3rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.25rem' }}>
        <span className="badge badge-accent" style={{ marginBottom: '0.4rem' }}>
          Sustainable Logistics
        </span>
        <h2 style={{ fontSize: '1.8rem', margin: 0, fontFamily: 'var(--font-serif)' }}>
          Supplier Map & Nearest Matching
        </h2>
        <p style={{ margin: '0.35rem 0 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Connect with local design ateliers, print shops, and craft businesses diverting high-grade offcuts.
        </p>
      </div>

      {/* Geolocation bar & City Search */}
      <div 
        className="card card-compact"
        style={{ 
          marginBottom: '1rem', 
          display: 'flex', 
          flexWrap: 'wrap', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          gap: '0.75rem',
          padding: '0.75rem 1rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#60A5FA' }}></div>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Your Pin: <strong style={{ color: 'var(--text)' }}>{locationSource}</strong>
          </span>
          <button 
            type="button" 
            className="btn btn-ghost" 
            onClick={requestGeolocation}
            disabled={locating}
            style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', border: '1px solid var(--border)' }}
          >
            {locating ? 'Locating...' : 'Update GPS'}
          </button>
        </div>

        <form onSubmit={handleCitySearch} style={{ display: 'flex', gap: '0.4rem', flex: '1 1 240px', maxWidth: '340px' }}>
          <input 
            type="text"
            className="input-field"
            style={{ padding: '0.35rem 0.65rem', fontSize: '0.825rem' }}
            placeholder="Type city or area (e.g. Ranchi)"
            value={searchCity}
            onChange={e => setSearchCity(e.target.value)}
          />
          <button type="submit" className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.825rem' }}>
            Find
          </button>
        </form>
      </div>

      {locationError && (
        <div style={{ padding: '0.5rem 0.85rem', marginBottom: '1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', color: '#F87171' }}>
          {locationError} Tip: You can click anywhere on the map to drop your creator location pin!
        </div>
      )}

      {/* BEST MATCH CARD */}
      {topSupplier && (
        <div 
          className="card"
          style={{
            marginBottom: '1.25rem',
            border: '1px solid var(--accent)',
            background: 'linear-gradient(135deg, rgba(212, 138, 148, 0.1) 0%, rgba(18, 18, 22, 0.85) 100%)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <span className="badge badge-accent" style={{ marginBottom: '0.35rem' }}>
                AI Best Match
              </span>
              <h3 style={{ margin: 0, fontSize: '1.3rem', fontFamily: 'var(--font-serif)' }}>
                {topSupplier.name}
              </h3>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                {topSupplier.address}, {topSupplier.city} • <strong style={{ color: 'var(--accent)' }}>{formatDistance(topSupplier.distance)} away</strong>
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                type="button" 
                className="btn btn-primary"
                style={{ fontSize: '0.825rem', padding: '0.4rem 0.9rem' }}
                onClick={() => handleRequestClick(topSupplier)}
              >
                Request materials
              </button>
              <a 
                href={`https://www.google.com/maps/dir/?api=1&destination=${topSupplier.lat},${topSupplier.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary"
                style={{ fontSize: '0.825rem', padding: '0.4rem 0.8rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
              >
                Directions
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                  <polyline points="15 3 21 3 21 9"></polyline>
                  <line x1="10" y1="14" x2="21" y2="3"></line>
                </svg>
              </a>
            </div>
          </div>

          {/* AI Match Explanation */}
          <div style={{ marginTop: '0.85rem', padding: '0.75rem 0.9rem', background: 'rgba(0,0,0,0.3)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.825rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
              <span style={{ color: 'var(--accent)', fontWeight: 600 }}>Reason:</span>
              <span style={{ color: 'var(--text)', flex: 1 }}>
                {loadingAiMatch ? "Analyzing nearest studio inventories & materials..." : (bestMatchAi?.reason || "Closest certified upcycling partner with studio offcuts available for collection.")}
              </span>
            </div>
            {bestMatchAi?.pickup_tip && (
              <div style={{ marginTop: '0.4rem', fontSize: '0.775rem', color: 'var(--text-muted)', display: 'flex', gap: '0.4rem' }}>
                <strong style={{ color: 'var(--text-secondary)' }}>Tip:</strong>
                <span>{bestMatchAi.pickup_tip}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* FILTER BAR & SLIDER */}
      <div 
        className="card card-compact" 
        style={{ 
          marginBottom: '1.25rem', 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: '1rem', 
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.85rem 1rem'
        }}
      >
        {/* Material Type Pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginRight: '0.3rem' }}>Type:</span>
          {['all', 'fabric', 'wood', 'paper', 'plastic', 'metal'].map(type => (
            <button
              key={type}
              type="button"
              onClick={() => setSelectedType(type)}
              style={{
                fontSize: '0.775rem',
                padding: '0.25rem 0.65rem',
                borderRadius: '999px',
                border: selectedType === type ? '1px solid var(--accent)' : '1px solid var(--border)',
                background: selectedType === type ? 'var(--accent)' : 'var(--surface-sunken)',
                color: selectedType === type ? '#0A0A0D' : 'var(--text)',
                cursor: 'pointer',
                fontWeight: selectedType === type ? 600 : 400,
                textTransform: 'capitalize'
              }}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Max Distance Slider (2, 5, 10, 25 km) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: '220px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Within:</span>
          <input 
            type="range"
            min="2"
            max="25"
            step="1"
            value={maxDistance}
            onChange={e => setMaxDistance(Number(e.target.value))}
            style={{ flex: 1, accentColor: 'var(--accent)', cursor: 'pointer' }}
          />
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)', minWidth: '42px', textAlign: 'right' }}>
            {maxDistance} km
          </span>
        </div>
      </div>

      {/* MAP + LIST SPLIT LAYOUT */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: '1.25rem' }}>
        {/* Interactive Leaflet Map */}
        <div 
          className="card"
          style={{ 
            padding: '0.5rem', 
            borderRadius: 'var(--radius)', 
            overflow: 'hidden', 
            border: '1px solid var(--border)',
            position: 'relative'
          }}
        >
          <div style={{ height: '380px', width: '100%', borderRadius: 'calc(var(--radius) - 4px)', overflow: 'hidden' }}>
            <MapContainer
              center={[userLocation.lat, userLocation.lng]}
              zoom={13}
              scrollWheelZoom={false}
              style={{ height: '100%', width: '100%' }}
            >
              <ChangeView center={[userLocation.lat, userLocation.lng]} zoom={13} />
              <MapClickHandler 
                onMapClick={(coords) => {
                  setUserLocation(coords);
                  setLocationSource('Custom Map Pin');
                }} 
              />
              
              {/* OpenStreetMap standard tiles */}
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                className="osm-tiles-atelier"
              />

              {/* Creator user marker */}
              <Marker position={[userLocation.lat, userLocation.lng]} icon={userLocationIcon}>
                <Popup>
                  <div style={{ color: '#0A0A0D', fontSize: '0.85rem' }}>
                    <strong>Your Location</strong>
                    <div style={{ fontSize: '0.75rem', color: '#555' }}>Click map anytime to reposition</div>
                  </div>
                </Popup>
              </Marker>

              {/* Suppliers markers */}
              {filteredSuppliers.map(sup => {
                const isSelected = selectedSupplierId === sup.id;
                const isBest = topSupplier?.id === sup.id;
                return (
                  <Marker
                    key={sup.id}
                    position={[sup.lat, sup.lng]}
                    icon={createSupplierIcon(isSelected, isBest)}
                    eventHandlers={{
                      click: () => {
                        setSelectedSupplierId(sup.id);
                      }
                    }}
                  >
                    <Popup>
                      <div style={{ color: '#0A0A0D', fontSize: '0.85rem', minWidth: '160px' }}>
                        <strong>{sup.name}</strong>
                        <div style={{ fontSize: '0.75rem', color: '#666' }}>{sup.businessType} • {formatDistance(sup.distance)}</div>
                        <div style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>{sup.address}</div>
                        <button
                          type="button"
                          onClick={() => setModalSupplier(sup)}
                          style={{
                            marginTop: '0.5rem',
                            width: '100%',
                            padding: '0.35rem 0.5rem',
                            background: '#D48A94',
                            color: '#0A0A0D',
                            border: 'none',
                            borderRadius: '4px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            fontSize: '0.75rem'
                          }}
                        >
                          Request Scraps
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          </div>
          <div style={{ padding: '0.5rem 0.5rem 0', display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <span>Showing {filteredSuppliers.length} suppliers within {maxDistance} km</span>
            <span>Tap any pin to inspect & request</span>
          </div>
        </div>

        {/* Selected Supplier Detailed Card */}
        {selectedSupplier && (
          <div className="card animate-fade-in" style={{ border: '1px solid var(--accent)', background: 'var(--surface-sunken)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <span className="badge badge-accent" style={{ textTransform: 'capitalize', marginBottom: '0.3rem' }}>
                  {selectedSupplier.businessType}
                </span>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontFamily: 'var(--font-serif)' }}>
                  {selectedSupplier.name}
                </h3>
                <p style={{ margin: '0.2rem 0', fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                  {selectedSupplier.address}, {selectedSupplier.city} • <strong style={{ color: 'var(--accent)' }}>{formatDistance(selectedSupplier.distance)}</strong>
                </p>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
                  Hours: {selectedSupplier.openingHours || '10:00 AM – 6:00 PM'} • Contact: {selectedSupplier.contact}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => handleRequestClick(selectedSupplier)}
                  style={{ fontSize: '0.85rem' }}
                >
                  Request materials
                </button>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${selectedSupplier.lat},${selectedSupplier.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary"
                  style={{ fontSize: '0.85rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                >
                  Get directions
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                    <polyline points="15 3 21 3 21 9"></polyline>
                    <line x1="10" y1="14" x2="21" y2="3"></line>
                  </svg>
                </a>
              </div>
            </div>

            {/* Available Materials at this Supplier */}
            <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                CURRENT AVAILABLE SCRAPS:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {materials.filter(m => m.supplierId === selectedSupplier.id && !m.used && !m.reserved).map(m => (
                  <span 
                    key={m.id}
                    style={{
                      fontSize: '0.8rem',
                      padding: '0.3rem 0.65rem',
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--text)'
                    }}
                  >
                    {m.name} ({m.quantity})
                  </span>
                ))}
                {materials.filter(m => m.supplierId === selectedSupplier.id && !m.used && !m.reserved).length === 0 && (
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Standard studio trimmings and offcuts available on demand.
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Nearest Suppliers List (Sorted by proximity) */}
        <div>
          <h3 style={{ fontSize: '1.15rem', fontFamily: 'var(--font-serif)', margin: '0 0 0.75rem' }}>
            All Verified Suppliers ({filteredSuppliers.length})
          </h3>
          <div style={{ display: 'grid', gap: '0.65rem' }}>
            {filteredSuppliers.map(sup => {
              const isSelected = selectedSupplierId === sup.id;
              const supMats = materials.filter(m => m.supplierId === sup.id && !m.used);

              return (
                <div 
                  key={sup.id}
                  onClick={() => setSelectedSupplierId(sup.id)}
                  style={{
                    padding: '0.85rem 1rem',
                    background: isSelected ? 'rgba(212, 138, 148, 0.08)' : 'var(--surface)',
                    border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
                    borderRadius: 'var(--radius)',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '0.75rem',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <strong style={{ fontSize: '0.95rem' }}>{sup.name}</strong>
                      <span className="badge" style={{ fontSize: '0.7rem', textTransform: 'capitalize' }}>
                        {sup.businessType}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      {sup.address} • {supMats.length} scrap types ready
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.35rem' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--accent)' }}>
                      {formatDistance(sup.distance)}
                    </span>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', border: '1px solid var(--border)' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRequestClick(sup);
                      }}
                    >
                      Request
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Request Material Modal */}
      {modalSupplier && (
        <RequestMaterialModal
          supplier={modalSupplier}
          materials={materials}
          onClose={() => setModalSupplier(null)}
          onOrderCreated={(newOrder) => {
            if (onShowToast) {
              onShowToast(`Order #${newOrder.trackingCode} requested from ${modalSupplier.name}!`);
            }
            if (onNavigateTab) {
              onNavigateTab('orders');
            }
          }}
        />
      )}
    </div>
  );
}
