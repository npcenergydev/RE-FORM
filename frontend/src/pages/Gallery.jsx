import React, { useState } from 'react';
import { IconGallery, IconLeaf, IconClose, IconSparkles, IconRibbonBow } from '../components/Icons.jsx';

export function Gallery({ artworks = [] }) {
  const [selectedArtwork, setSelectedArtwork] = useState(null);

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Curated Exhibition Gallery</h2>
        <p className="page-subtitle">
          Every piece in this exhibition was once discarded studio waste. Curated and narrated by Gemini Flash with verified waste diversion metrics.
        </p>
      </div>

      {artworks.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px 20px' }}>
          <div style={{ color: 'var(--accent)', marginBottom: 14 }}>
            <IconRibbonBow size={36} />
          </div>
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 20, fontWeight: 700, marginBottom: 6 }}>
            No completed pieces yet
          </h3>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            Accept a material challenge or turn your studio scraps into art to see them exhibited here.
          </p>
        </div>
      ) : (
        /* Responsive Artwork Grid */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 18 }}>
          {artworks.map((art, idx) => (
            <div 
              key={art.id} 
              className="card"
              onClick={() => setSelectedArtwork(art)}
              style={{ 
                padding: 0, 
                overflow: 'hidden', 
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                animation: `fadeInDown 0.4s ease-out ${idx * 0.08}s both`,
                border: '1px solid var(--border-light)'
              }}
            >
              {/* Artwork Media with Subtle Zoom Effect */}
              <div style={{ width: '100%', height: 190, background: '#0D0D12', position: 'relative', overflow: 'hidden' }}>
                <img 
                  src={art.imageUrl} 
                  alt={art.title} 
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'cover',
                    transition: 'transform 0.4s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.04)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                />
                <span 
                  className="badge badge-accent"
                  style={{ 
                    position: 'absolute', 
                    top: 10, 
                    right: 10, 
                    boxShadow: '0 2px 8px rgba(0,0,0,0.6)',
                    fontSize: 11
                  }}
                >
                  <IconLeaf size={12} />
                  {art.divertedWeightKg} kg diverted
                </span>
              </div>

              {/* Content Summary */}
              <div style={{ padding: 18, flex: 1, display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                  {art.title}
                </h3>

                <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 10 }}>
                  By {art.creator || "Atelier Artist"} · {art.completedAt || "Recently"}
                </p>

                <p style={{ 
                  fontSize: 12.5, 
                  color: 'var(--text-secondary)', 
                  lineHeight: 1.6,
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  marginBottom: 14
                }}>
                  {art.story}
                </p>

                {/* Materials used chips */}
                <div style={{ marginTop: 'auto', display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {(art.materialsUsed || []).map((m, i) => (
                    <span 
                      key={i} 
                      style={{ 
                        fontSize: 10.5, 
                        background: 'var(--bg-subtle)', 
                        color: 'var(--accent-hover)', 
                        padding: '3px 8px', 
                        borderRadius: 6,
                        border: '1px solid var(--border-subtle)'
                      }}
                    >
                      {m.name || m}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Detail View */}
      {selectedArtwork && (
        <div 
          className="modal-backdrop" 
          onClick={() => setSelectedArtwork(null)} 
          role="dialog" 
          aria-modal="true"
        >
          <div 
            className="modal-content" 
            onClick={(e) => e.stopPropagation()} 
            style={{ maxWidth: 620, padding: 0, overflow: 'hidden' }}
          >
            {/* Modal Image */}
            <div style={{ position: 'relative', width: '100%', maxHeight: 340, background: '#0D0D12' }}>
              <img 
                src={selectedArtwork.imageUrl} 
                alt={selectedArtwork.title} 
                style={{ width: '100%', maxHeight: 340, objectFit: 'contain' }}
              />
              <button 
                onClick={() => setSelectedArtwork(null)}
                style={{ 
                  position: 'absolute', 
                  top: 14, 
                  right: 14, 
                  background: 'rgba(0,0,0,0.7)', 
                  color: 'var(--text-primary)', 
                  border: '1px solid var(--border-light)', 
                  borderRadius: '50%', 
                  width: 34, 
                  height: 34, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  cursor: 'pointer',
                  transition: 'transform 0.2s ease'
                }}
                aria-label="Close"
              >
                <IconClose size={18} />
              </button>
            </div>

            {/* Modal Details */}
            <div style={{ padding: 26 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
                <div>
                  <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>
                    {selectedArtwork.title}
                  </h2>
                  <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>
                    Created by {selectedArtwork.creator || "Artist"} · {selectedArtwork.completedAt}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <span className="badge badge-accent">
                    <IconLeaf size={12} />
                    {selectedArtwork.divertedWeightKg} kg diverted
                  </span>
                  <span className="badge" style={{ background: 'var(--accent-light)', color: 'var(--accent-hover)' }}>
                    {selectedArtwork.co2eAvoidedKg} kg CO2e (est.)
                  </span>
                </div>
              </div>

              {/* Story */}
              <div style={{ 
                background: 'var(--bg-subtle)', 
                borderRadius: 'var(--radius-md)', 
                padding: 18, 
                margin: '18px 0',
                border: '1px solid var(--border-light)',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, color: 'var(--accent)' }}>
                  <span className="ribbon-animated">
                    <IconRibbonBow size={15} />
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Curatorial Story
                  </span>
                </div>
                <p style={{ fontSize: 13.5, color: 'var(--text-primary)', lineHeight: 1.7, fontStyle: 'italic' }}>
                  "{selectedArtwork.story}"
                </p>
              </div>

              {/* Original Materials Rescued */}
              <div style={{ marginBottom: 18 }}>
                <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--text-secondary)' }}>
                  Original Discarded Scraps Rescued:
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {(selectedArtwork.materialsUsed || []).map((m, idx) => (
                    <div 
                      key={idx}
                      style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        fontSize: 12.5, 
                        padding: '8px 12px', 
                        background: 'var(--bg-card)', 
                        border: '1px solid var(--border-light)', 
                        borderRadius: 'var(--radius-sm)' 
                      }}
                    >
                      <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                        {m.name || m}
                      </span>
                      <span style={{ color: 'var(--accent-hover)', textTransform: 'capitalize' }}>
                        {m.type ? `${m.type} · ` : ''}{m.weight_kg ? `${m.weight_kg} kg` : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tags */}
              {selectedArtwork.tags && selectedArtwork.tags.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {selectedArtwork.tags.map((tag, tIdx) => (
                    <span key={tIdx} className="badge" style={{ fontSize: 11 }}>
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
