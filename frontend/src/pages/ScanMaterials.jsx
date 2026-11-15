import React, { useState, useRef } from 'react';
import { compressImage } from '../utils/imageCompressor.js';
import { IconCamera, IconUpload, IconTrash, IconCheck, IconRefresh, IconInfo, IconLeaf, IconRibbonBow } from '../components/Icons.jsx';

const MATERIAL_TYPES = [
  'fabric',
  'wood',
  'paper',
  'plastic',
  'metal',
  'glass',
  'buttons_trims',
  'other'
];

export function ScanMaterials({ onMaterialsAdded, onNavigate }) {
  const fileInputRef = useRef(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [detectedItems, setDetectedItems] = useState([]);
  const [errorMsg, setErrorMsg] = useState(null);
  const [statusNote, setStatusNote] = useState(null);
  const [addedSuccess, setAddedSuccess] = useState(false);

  // Handle file select & client-side compression
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setErrorMsg(null);
      setStatusNote(null);
      setAddedSuccess(false);

      // Compress client-side to max 1024px
      const compressedDataUrl = await compressImage(file, 1024, 0.85);
      setSelectedImage(compressedDataUrl);

      // Automatically trigger scan
      runScan(compressedDataUrl);
    } catch (err) {
      console.error(err);
      setErrorMsg("Could not process image. Please try another file.");
    }
  };

  // Call POST /api/scan
  const runScan = async (imageDataUrl) => {
    setIsScanning(true);
    setErrorMsg(null);
    setStatusNote(null);
    setAddedSuccess(false);

    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageDataUrl })
      });

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const data = await res.json();
      if (!data.materials || data.materials.length === 0) {
        throw new Error("No materials clearly recognized in this image.");
      }

      setDetectedItems(data.materials);
      if (data.source === 'demo_fallback') {
        setStatusNote("Using demo scan results.");
      }
    } catch (err) {
      console.warn("Scan failed, offering demo scan:", err.message);
      setErrorMsg("We couldn't analyze that photo (image might be blurry or AI service is busy).");
    } finally {
      setIsScanning(false);
    }
  };

  // Load sample demo scan
  const loadDemoScan = () => {
    setErrorMsg(null);
    setStatusNote("Loaded sample studio scraps scan.");
    setDetectedItems([
      {
        id: `demo-${Date.now()}-1`,
        name: "Italian Wool Suiting Offcuts",
        type: "fabric",
        colour: "Charcoal & pinstripe",
        quantity: "8 tailored cuts",
        estimated_weight_kg: 0.8,
        condition: "good"
      },
      {
        id: `demo-${Date.now()}-2`,
        name: "Reclaimed Cedar Lath Strips",
        type: "wood",
        colour: "Aromatic red cedar",
        quantity: "6 thin laths (45cm)",
        estimated_weight_kg: 1.2,
        condition: "good"
      },
      {
        id: `demo-${Date.now()}-3`,
        name: "Solid Brass Screw Washers",
        type: "buttons_trims",
        colour: "Aged brass",
        quantity: "30 pieces",
        estimated_weight_kg: 0.3,
        condition: "good"
      }
    ]);
  };

  // Update item fields
  const handleItemChange = (idx, field, value) => {
    setDetectedItems(prev => {
      const clone = [...prev];
      clone[idx] = { ...clone[idx], [field]: value };
      return clone;
    });
  };

  // Remove item
  const handleRemoveItem = (idx) => {
    setDetectedItems(prev => prev.filter((_, i) => i !== idx));
  };

  // Save detected items to platform
  const handleSaveToPlatform = () => {
    if (detectedItems.length === 0) return;
    onMaterialsAdded(detectedItems);
    setAddedSuccess(true);
  };

  const resetForm = () => {
    setSelectedImage(null);
    setDetectedItems([]);
    setErrorMsg(null);
    setStatusNote(null);
    setAddedSuccess(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">AI Material Scanner</h2>
        <p className="page-subtitle">
          Photograph scrap offcuts from your workspace or donation bin. Gemini Flash identifies material classes, conditions, and estimates waste weights.
        </p>
      </div>

      {/* Upload & Capture Card */}
      {!selectedImage ? (
        <div 
          className="card" 
          style={{ 
            border: '2px dashed var(--border-light)', 
            textAlign: 'center', 
            padding: '40px 20px',
            marginBottom: 24,
            cursor: 'pointer',
            backgroundColor: 'var(--bg-card)',
            transition: 'all 0.25s ease'
          }}
          onClick={() => fileInputRef.current?.click()}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            capture="environment"
            style={{ display: 'none' }} 
          />
          <div style={{ display: 'inline-flex', padding: 16, background: 'var(--accent-light)', color: 'var(--accent)', borderRadius: '50%', marginBottom: 14 }}>
            <span className="ribbon-animated">
              <IconCamera size={30} />
            </span>
          </div>
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 20, fontWeight: 700, marginBottom: 6, color: 'var(--text-primary)' }}>
            Snap or Upload Studio Scraps
          </h3>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
            Take a photo or choose an image. Compressed client-side to 1024px before sending.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button type="button" className="btn btn-primary btn-sm">
              <IconCamera size={16} />
              Take Photo
            </button>
            <button type="button" className="btn btn-secondary btn-sm">
              <IconUpload size={16} />
              Browse Files
            </button>
            <button 
              type="button" 
              onClick={(e) => { e.stopPropagation(); loadDemoScan(); }} 
              className="btn btn-subtle btn-sm"
            >
              Use Demo Scan
            </button>
          </div>
        </div>
      ) : (
        /* Image Preview & Scan Progress */
        <div className="card" style={{ marginBottom: 20, padding: 16, background: 'var(--bg-card)' }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <img 
              src={selectedImage} 
              alt="Scrap Preview" 
              style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 'var(--radius-md)', border: '1px solid var(--accent-border)' }} 
            />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Scanned Studio Photo</span>
                {isScanning && <span className="spinner" style={{ width: 14, height: 14 }}></span>}
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                {isScanning ? 'Gemini Flash analyzing textures & weights...' : `${detectedItems.length} material(s) identified`}
              </p>
            </div>
            <button onClick={resetForm} className="btn btn-subtle btn-sm" title="Upload a different photo">
              <IconRefresh size={14} />
              <span>Retake</span>
            </button>
          </div>
        </div>
      )}

      {/* Loading Skeleton */}
      {isScanning && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
          <div className="card skeleton" style={{ height: 110 }} />
          <div className="card skeleton" style={{ height: 110 }} />
        </div>
      )}

      {/* Error State with Fallback Demo Button */}
      {errorMsg && (
        <div className="card" style={{ borderColor: 'rgba(239, 68, 68, 0.3)', background: 'rgba(239, 68, 68, 0.1)', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, color: 'var(--danger)' }}>
            <IconInfo size={18} />
            <span style={{ fontWeight: 600, fontSize: 14 }}>Image Analysis Notice</span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
            {errorMsg}
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={loadDemoScan} className="btn btn-primary btn-sm">
              Use Demo Scan Results
            </button>
            <button onClick={resetForm} className="btn btn-secondary btn-sm">
              Try Another Photo
            </button>
          </div>
        </div>
      )}

      {/* Status Note */}
      {statusNote && !errorMsg && (
        <div style={{ fontSize: 12, color: 'var(--accent-hover)', background: 'var(--accent-light)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', marginBottom: 16, border: '1px solid var(--accent-border)' }}>
          {statusNote}
        </div>
      )}

      {/* Success Notification after adding to platform */}
      {addedSuccess && (
        <div className="card" style={{ borderColor: 'var(--accent-border)', background: 'linear-gradient(135deg, #1A1A24 0%, #13131A 100%)', marginBottom: 20, boxShadow: 'var(--shadow-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--accent-hover)', marginBottom: 6 }}>
            <span className="ribbon-animated">
              <IconCheck size={18} />
            </span>
            <span style={{ fontWeight: 600, fontSize: 15 }}>Materials added to re:create inventory!</span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
            The materials are now ready in your inventory for spinning challenges or generating craft ideas.
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => onNavigate('challenge')} className="btn btn-primary btn-sm">
              Spin a Challenge
            </button>
            <button onClick={() => onNavigate('dashboard')} className="btn btn-secondary btn-sm">
              View Dashboard
            </button>
          </div>
        </div>
      )}

      {/* Editable Material Cards */}
      {detectedItems.length > 0 && !addedSuccess && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>Detected Scraps (Review & Edit)</h3>
            <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Weights are estimated</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 }}>
            {detectedItems.map((item, idx) => (
              <div 
                key={item.id || idx} 
                className="card" 
                style={{ 
                  animation: `fadeInDown 0.35s ease-out ${idx * 0.08}s both`,
                  borderLeft: '4px solid var(--accent)' 
                }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10 }}>
                  {/* Material Name & Delete */}
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input 
                      type="text" 
                      value={item.name} 
                      onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                      placeholder="Material Name"
                      style={{ 
                        flex: 1, 
                        fontWeight: 600, 
                        fontSize: 14, 
                        padding: '10px 12px', 
                        fontFamily: 'inherit'
                      }} 
                    />
                    <button 
                      onClick={() => handleRemoveItem(idx)} 
                      className="btn btn-danger btn-sm"
                      style={{ padding: '8px 12px' }}
                      title="Delete item"
                    >
                      <IconTrash size={15} />
                    </button>
                  </div>

                  {/* Attributes row: Type, Quantity, Weight, Condition */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
                    <div>
                      <label style={{ fontSize: 11, color: 'var(--text-tertiary)', display: 'block', marginBottom: 4 }}>Material Type</label>
                      <select 
                        value={item.type} 
                        onChange={(e) => handleItemChange(idx, 'type', e.target.value)}
                        style={{ width: '100%', padding: '8px 10px', fontSize: 13 }}
                      >
                        {MATERIAL_TYPES.map(t => (
                          <option key={t} value={t}>{t.replace('_', ' & ')}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: 11, color: 'var(--text-tertiary)', display: 'block', marginBottom: 4 }}>Quantity / Unit</label>
                      <input 
                        type="text" 
                        value={item.quantity} 
                        onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                        placeholder="e.g. 5 pieces"
                        style={{ width: '100%', padding: '8px 10px', fontSize: 13 }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: 11, color: 'var(--text-tertiary)', display: 'block', marginBottom: 4 }}>Est. Weight (kg)</label>
                      <input 
                        type="number" 
                        step="0.1" 
                        min="0.1"
                        value={item.estimated_weight_kg} 
                        onChange={(e) => handleItemChange(idx, 'estimated_weight_kg', parseFloat(e.target.value) || 0.1)}
                        style={{ width: '100%', padding: '8px 10px', fontSize: 13 }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: 11, color: 'var(--text-tertiary)', display: 'block', marginBottom: 4 }}>Condition</label>
                      <select 
                        value={item.condition} 
                        onChange={(e) => handleItemChange(idx, 'condition', e.target.value)}
                        style={{ width: '100%', padding: '8px 10px', fontSize: 13 }}
                      >
                        <option value="good">Good (Clean / reusable)</option>
                        <option value="fair">Fair (Minor marks / worn)</option>
                        <option value="poor">Poor (Requires sorting)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button onClick={handleSaveToPlatform} className="btn btn-primary btn-block" style={{ fontSize: 15 }}>
            <IconCheck size={18} />
            <span>Add {detectedItems.length} Scraps to Platform</span>
          </button>
        </div>
      )}
    </div>
  );
}
