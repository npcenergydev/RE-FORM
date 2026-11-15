import React, { useState, useEffect } from 'react';
import { compressImage } from '../utils/imageCompressor.js';
import { calculateTotalImpact } from '../constants/impactFactors.js';
import { uploadImageWithFallback } from '../firebase.js';
import { 
  IconChallenge, 
  IconSparkles, 
  IconRefresh, 
  IconCheck, 
  IconIdeas, 
  IconCamera, 
  IconUpload, 
  IconLeaf, 
  IconInfo,
  IconRibbonBow,
  IconMap
} from '../components/Icons.jsx';

export function Challenge({ 
  materials = [], 
  activeChallenge, 
  onAcceptChallenge, 
  onCompleteChallenge, 
  onCancelChallenge, 
  onNavigateToIdeas, 
  onNavigateToGallery,
  onNavigateToMap
}) {
  const [spinning, setSpinning] = useState(false);
  const [spinReelIndex, setSpinReelIndex] = useState(0);
  const [revealedMaterials, setRevealedMaterials] = useState([]);
  const [currentChallenge, setCurrentChallenge] = useState(activeChallenge);
  const [loadingChallenge, setLoadingChallenge] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Complete challenge flow states
  const [artworkPhoto, setArtworkPhoto] = useState(null);
  const [userNote, setUserNote] = useState('');
  const [completing, setCompleting] = useState(false);
  const [completedArtwork, setCompletedArtwork] = useState(null);

  // Keep synced if activeChallenge changed from storage
  useEffect(() => {
    if (activeChallenge) {
      setCurrentChallenge(activeChallenge);
      if (activeChallenge.selectedMaterials) {
        setRevealedMaterials(activeChallenge.selectedMaterials);
      }
    }
  }, [activeChallenge]);

  // Available unused materials
  const availableScraps = materials.filter(m => !m.used);

  // Spin slot machine & pick 2-4 materials with 3D reel animation
  const startSpinChallenge = async () => {
    if (availableScraps.length < 2) {
      setErrorMsg("You need at least 2 active materials in inventory to spin a challenge. Scan some new materials first!");
      return;
    }

    setErrorMsg(null);
    setSpinning(true);
    setRevealedMaterials([]);
    setCurrentChallenge(null);
    setCompletedArtwork(null);
    setArtworkPhoto(null);

    // Pick 2 to 4 distinct random materials (never draw duplicate items)
    const shuffled = [...availableScraps].sort(() => 0.5 - Math.random());
    const distinct = [];
    const seenNames = new Set();
    for (const scrap of shuffled) {
      const cleanName = (scrap.name || '').trim().toLowerCase();
      if (!seenNames.has(cleanName)) {
        distinct.push(scrap);
        seenNames.add(cleanName);
      }
    }
    const pickTarget = Math.min(distinct.length, Math.floor(Math.random() * 3) + 2); // 2, 3, or 4
    const picked = distinct.slice(0, Math.max(2, pickTarget));

    // Dynamic slot reel tick animation
    let tickCount = 0;
    const ticker = setInterval(() => {
      setSpinReelIndex(prev => (prev + 1) % availableScraps.length);
      tickCount++;
      if (tickCount > 15) clearInterval(ticker);
    }, 90);

    // Sequentially reveal items with 3D entrance
    for (let i = 0; i < picked.length; i++) {
      await new Promise(r => setTimeout(r, 500));
      setRevealedMaterials(prev => [...prev, picked[i]]);
    }

    clearInterval(ticker);
    setSpinning(false);
    setLoadingChallenge(true);

    // Fetch challenge from backend
    try {
      const res = await fetch('/api/challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ materials: picked })
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setCurrentChallenge({
        ...data,
        selectedMaterials: picked
      });
    } catch (err) {
      console.warn("Challenge fetch error:", err);
      setErrorMsg("Failed to generate challenge. Please try re-spinning.");
    } finally {
      setLoadingChallenge(false);
    }
  };

  // Accept challenge
  const handleAccept = () => {
    if (!currentChallenge) return;
    onAcceptChallenge(currentChallenge);
  };

  // Handle artwork photo upload
  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file, 1024, 0.85);
      setArtworkPhoto(compressed);
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to process photo.");
    }
  };

  // Complete challenge flow
  const handleCompleteSubmit = async () => {
    if (!currentChallenge) return;
    setCompleting(true);
    setErrorMsg(null);

    try {
      const usedMats = currentChallenge.selectedMaterials || [];
      const impact = calculateTotalImpact(usedMats);

      const res = await fetch('/api/story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artworkImage: artworkPhoto,
          materials: usedMats,
          userNote
        })
      });

      const storyData = await res.json();

      let finalImageUrl = artworkPhoto;
      if (artworkPhoto && artworkPhoto.startsWith('data:image/')) {
        try {
          finalImageUrl = await uploadImageWithFallback(artworkPhoto, `artworks/art-${Date.now()}.jpg`);
        } catch (uploadErr) {
          console.warn("Storage upload failed, retaining base64 data URL:", uploadErr);
          finalImageUrl = artworkPhoto;
        }
      }

      const newArtwork = {
        id: `art-${Date.now()}`,
        title: storyData.title || currentChallenge.title,
        imageUrl: finalImageUrl || "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 400' width='600' height='400'><rect width='600' height='400' fill='%23131318'/><text x='300' y='200' font-family='sans-serif' font-size='22' text-anchor='middle' fill='%23D48A94' font-weight='bold'>Completed Atelier Challenge</text></svg>",
        materialsUsed: usedMats,
        usedMaterialIds: usedMats.map(m => m.id),
        divertedWeightKg: impact.wasteDivertedKg,
        co2eAvoidedKg: impact.co2eAvoidedKg,
        story: storyData.story,
        tags: storyData.tags || ["Upcycling", "re:create"],
        completedAt: new Date().toISOString().split('T')[0],
        creator: "You (Atelier Artist)"
      };

      onCompleteChallenge(newArtwork);
      setCompletedArtwork(newArtwork);
    } catch (err) {
      console.error(err);
      setErrorMsg("Error generating gallery story. Artwork will still be saved.");
    } finally {
      setCompleting(false);
    }
  };

  // Nav to Ideas with selected materials
  const handleGetIdeas = () => {
    if (!currentChallenge || !currentChallenge.selectedMaterials) return;
    onNavigateToIdeas(currentChallenge.selectedMaterials);
  };

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Material-to-Art Challenge</h2>
        <p className="page-subtitle">
          Our core GenAI mechanic. Spin the slot reel to draw 2–4 random studio remnants. Gemini Flash crafts a bespoke challenge with an intentional creative constraint.
        </p>
      </div>

      {/* Primary Spin Trigger */}
      {!activeChallenge && !completedArtwork && (
        <div className="card card-hero" style={{ textAlign: 'center', padding: '36px 20px', marginBottom: 24 }}>
          <div style={{ display: 'inline-flex', padding: 16, background: 'var(--accent-light)', color: 'var(--accent)', borderRadius: '50%', marginBottom: 16 }}>
            <span className="ribbon-animated">
              <IconRibbonBow size={38} />
            </span>
          </div>

          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 26, fontWeight: 700, marginBottom: 8, color: 'var(--accent-hover)' }}>
            Spin the Material Roulette
          </h3>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', maxWidth: 460, margin: '0 auto 24px auto' }}>
            Draw random studio scraps from the platform bin. AI generates a unique creative brief with an intentional artistic constraint.
          </p>

          {/* Rolling Slot Reel Visual while spinning */}
          {spinning && (
            <div 
              className="spinning-reel-glow"
              style={{ 
                maxWidth: 320, 
                margin: '0 auto 20px auto', 
                padding: '12px 18px', 
                borderRadius: 'var(--radius-md)', 
                border: '1px solid var(--accent-border)',
                background: '#1A1A24'
              }}
            >
              <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent)', marginBottom: 4 }}>
                Rolling Scraps Reel...
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
                {availableScraps[spinReelIndex]?.name || "Searching inventory..."}
              </div>
            </div>
          )}

          <button 
            onClick={startSpinChallenge} 
            disabled={spinning || loadingChallenge} 
            className="btn btn-primary"
            style={{ fontSize: 16, padding: '14px 32px' }}
          >
            {spinning ? (
              <>
                <span className="spinner"></span>
                <span>Drawing Scraps...</span>
              </>
            ) : loadingChallenge ? (
              <>
                <span className="spinner"></span>
                <span>Gemini Flash Generating...</span>
              </>
            ) : (
              <>
                <IconChallenge size={20} />
                <span>Give Me a Challenge!</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Slot Machine Revealed Materials with 3D animation */}
      {(spinning || revealedMaterials.length > 0) && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent)' }}>
              Drawn Scraps ({revealedMaterials.length})
            </span>
            <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
              Slot Reels Locked
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
            {revealedMaterials.map((mat, idx) => (
              <div 
                key={mat.id || idx} 
                className="card slot-item-revealed" 
                style={{ 
                  padding: 14, 
                  borderLeft: '4px solid var(--accent)', 
                  background: 'linear-gradient(135deg, #181822 0%, #13131A 100%)',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.5), 0 0 12px rgba(212, 138, 148, 0.15)',
                  animationDelay: `${idx * 0.15}s`
                }}
              >
                <span className="badge badge-accent" style={{ fontSize: 10, textTransform: 'uppercase', marginBottom: 6 }}>
                  {mat.type}
                </span>
                <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {mat.name}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>
                  {mat.estimated_weight_kg || mat.weight_kg} kg · {mat.colour || mat.condition}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Loading Challenge State */}
      {loadingChallenge && (
        <div className="card skeleton" style={{ height: 260, marginBottom: 20 }} />
      )}

      {/* Error Message */}
      {errorMsg && (
        <div className="card" style={{ borderColor: 'rgba(239, 68, 68, 0.3)', background: 'rgba(239, 68, 68, 0.1)', marginBottom: 20 }}>
          <p style={{ fontSize: 13, color: 'var(--danger)' }}>{errorMsg}</p>
        </div>
      )}

      {/* Generated Challenge Card (Before Acceptance) */}
      {currentChallenge && !activeChallenge && !completedArtwork && (
        <div className="card" style={{ border: '1px solid var(--accent-border)', marginBottom: 24, boxShadow: 'var(--shadow-lg)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
            <span className="badge badge-accent" style={{ fontSize: 11 }}>
              <span className="ribbon-animated">
                <IconRibbonBow size={13} />
              </span>
              Challenge Curated
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <span className="badge" style={{ textTransform: 'capitalize' }}>
                Difficulty: {currentChallenge.difficulty || 'medium'}
              </span>
              <span className="badge">
                Est: {currentChallenge.estimated_time || '45m'}
              </span>
            </div>
          </div>

          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>
            {currentChallenge.title}
          </h3>

          <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 16 }}>
            {currentChallenge.brief}
          </p>

          {/* The Twist Constraint */}
          {currentChallenge.twist && (
            <div style={{ 
              background: 'rgba(212, 138, 148, 0.08)', 
              borderLeft: '4px solid var(--accent)', 
              padding: '12px 16px', 
              borderRadius: '0 var(--radius-sm) var(--radius-sm) 0', 
              marginBottom: 18,
              border: '1px solid var(--border-light)',
              borderLeftWidth: '4px'
            }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent-hover)', marginBottom: 3 }}>
                Creative Twist & Constraint
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>
                {currentChallenge.twist}
              </div>
            </div>
          )}

          {/* Steps */}
          {currentChallenge.steps && currentChallenge.steps.length > 0 && (
            <div style={{ marginBottom: 18 }}>
              <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, color: 'var(--text-primary)' }}>Suggested Process</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {currentChallenge.steps.map((st, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, fontSize: 12.5, color: 'var(--text-secondary)' }}>
                    <span style={{ fontWeight: 700, color: 'var(--accent)' }}>0{i + 1}.</span>
                    <span>{st}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons: Accept / Re-spin / Get Ideas / Nearest Supplier */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', borderTop: '1px solid var(--border-light)', paddingTop: 18 }}>
            <button onClick={handleAccept} className="btn btn-primary" style={{ flex: '2 1 180px' }}>
              <IconCheck size={18} />
              <span>Accept Challenge</span>
            </button>
            <button onClick={startSpinChallenge} className="btn btn-secondary" style={{ flex: '1 1 120px' }}>
              <IconRefresh size={16} />
              <span>Re-spin</span>
            </button>
            <button onClick={handleGetIdeas} className="btn btn-subtle" style={{ flex: '1 1 150px' }}>
              <IconIdeas size={16} />
              <span>Get ideas for these</span>
            </button>
            <button 
              onClick={() => onNavigateToMap && onNavigateToMap()} 
              className="btn btn-subtle" 
              style={{ flex: '1 1 150px' }}
              title="Find nearest supplier for these scraps"
            >
              <IconMap size={16} />
              <span>Nearest supplier</span>
            </button>
          </div>
        </div>
      )}

      {/* In-Progress Challenge & Completion Flow */}
      {activeChallenge && !completedArtwork && (
        <div>
          <div className="card" style={{ borderColor: 'var(--accent-border)', background: 'linear-gradient(135deg, #1A1A24 0%, #13131A 100%)', marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span className="badge badge-accent">
                <span className="ribbon-animated">
                  <IconRibbonBow size={13} />
                </span>
                Challenge In Progress
              </span>
              <button onClick={onCancelChallenge} className="btn btn-subtle btn-sm" style={{ fontSize: 11 }}>
                Abandon
              </button>
            </div>

            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
              {activeChallenge.title}
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
              {activeChallenge.brief}
            </p>

            {activeChallenge.twist && (
              <div style={{ fontSize: 12, color: 'var(--accent-hover)', background: 'var(--accent-light)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', marginBottom: 12, border: '1px solid var(--accent-border)' }}>
                <strong>Twist:</strong> {activeChallenge.twist}
              </div>
            )}

            <div style={{ fontSize: 11.5, color: 'var(--text-tertiary)' }}>
              Using: {(activeChallenge.selectedMaterials || []).map(m => m.name).join(', ')}
            </div>
          </div>

          {/* Completion Form */}
          <div className="card" style={{ marginBottom: 24 }}>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 20, fontWeight: 700, marginBottom: 4 }}>
              Complete Your Artwork
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 18 }}>
              Upload a snapshot of your creation. Gemini Flash will curate a warm 60–80 word gallery story and quantify your environmental impact.
            </p>

            {/* Photo upload */}
            <div style={{ marginBottom: 18 }}>
              <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6, color: 'var(--text-secondary)' }}>
                Artwork Photo
              </label>
              {!artworkPhoto ? (
                <div 
                  style={{ 
                    border: '2px dashed var(--border-light)', 
                    borderRadius: 'var(--radius-md)', 
                    padding: '28px 16px', 
                    textAlign: 'center',
                    cursor: 'pointer',
                    background: 'var(--bg-subtle)',
                    transition: 'border-color 0.2s ease'
                  }}
                  onClick={() => document.getElementById('artwork-file-input').click()}
                >
                  <input 
                    id="artwork-file-input" 
                    type="file" 
                    accept="image/*" 
                    onChange={handlePhotoUpload} 
                    style={{ display: 'none' }} 
                  />
                  <IconCamera size={26} style={{ color: 'var(--accent)', marginBottom: 8 }} />
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Upload finished piece photo</div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>PNG or JPG (auto-compressed to 1024px)</div>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                  <img 
                    src={artworkPhoto} 
                    alt="Finished piece" 
                    style={{ width: 100, height: 80, objectFit: 'cover', borderRadius: 'var(--radius-md)', border: '1px solid var(--accent-border)' }} 
                  />
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent-hover)' }}>Photo ready for curating!</div>
                    <button 
                      onClick={() => setArtworkPhoto(null)} 
                      className="btn btn-subtle btn-sm"
                      style={{ marginTop: 6 }}
                    >
                      Change Photo
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Artist Note */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6, color: 'var(--text-secondary)' }}>
                Artist Note (Optional)
              </label>
              <textarea 
                rows="3" 
                value={userNote}
                onChange={(e) => setUserNote(e.target.value)}
                placeholder="Share your inspiration, craftsmanship techniques, or how you solved the constraint..."
                style={{ 
                  width: '100%', 
                  padding: 12, 
                  borderRadius: 'var(--radius-md)', 
                  fontFamily: 'inherit',
                  fontSize: 13 
                }}
              />
            </div>

            <button 
              onClick={handleCompleteSubmit} 
              disabled={completing} 
              className="btn btn-primary btn-block"
            >
              {completing ? (
                <>
                  <span className="spinner"></span>
                  <span>Gemini Flash Curating Story...</span>
                </>
              ) : (
                <>
                  <IconCheck size={18} />
                  <span>Complete Challenge & Exhibit in Gallery</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Completion Celebration Modal / Card */}
      {completedArtwork && (
        <div className="card" style={{ borderColor: 'var(--accent-border)', background: 'linear-gradient(145deg, #1A1A24 0%, #121218 100%)', textAlign: 'center', padding: '32px 20px', marginBottom: 24, boxShadow: 'var(--shadow-lg)' }}>
          <div style={{ display: 'inline-flex', padding: 16, background: 'var(--accent-light)', color: 'var(--accent)', borderRadius: '50%', marginBottom: 14 }}>
            <span className="ribbon-animated">
              <IconRibbonBow size={36} />
            </span>
          </div>

          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 26, fontWeight: 700, marginBottom: 8, color: 'var(--accent-hover)' }}>
            Challenge Completed!
          </h3>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', maxWidth: 440, margin: '0 auto 18px auto' }}>
            "{completedArtwork.title}" has been curated into the permanent collection. Your workshop scraps have been diverted from waste streams.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
            <div className="badge badge-accent" style={{ padding: '8px 16px', fontSize: 13 }}>
              +{completedArtwork.divertedWeightKg} kg waste diverted
            </div>
            <div className="badge" style={{ padding: '8px 16px', fontSize: 13, background: 'var(--accent-light)', color: 'var(--accent-hover)' }}>
              +{completedArtwork.co2eAvoidedKg} kg CO2e avoided (est.)
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button onClick={onNavigateToGallery} className="btn btn-primary">
              View in Gallery
            </button>
            <button 
              onClick={() => {
                setCompletedArtwork(null);
                setCurrentChallenge(null);
                setRevealedMaterials([]);
              }} 
              className="btn btn-secondary"
            >
              Spin Another Challenge
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
