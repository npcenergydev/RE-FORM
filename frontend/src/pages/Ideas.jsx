import React, { useState, useEffect } from 'react';
import { IconIdeas, IconSparkles, IconChevronDown, IconCheck, IconRibbonBow, IconMap } from '../components/Icons.jsx';

export function Ideas({ materials = [], initialSelectedMaterials = [], onNavigateToMap }) {
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [ideas, setIdeas] = useState([]);
  const [expandedIndex, setExpandedIndex] = useState(0); // First card expanded by default
  const [errorMsg, setErrorMsg] = useState(null);

  // If initial materials passed from Challenge tab
  useEffect(() => {
    if (initialSelectedMaterials && initialSelectedMaterials.length > 0) {
      setSelectedIds(initialSelectedMaterials.map(m => m.id));
      generateIdeasFor(initialSelectedMaterials);
    } else {
      const available = materials.filter(m => !m.used);
      if (available.length > 0) {
        setSelectedIds(available.slice(0, 3).map(m => m.id));
      }
    }
  }, [initialSelectedMaterials]);

  // Toggle material selection
  const toggleMaterial = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    setSelectedIds(materials.filter(m => !m.used).map(m => m.id));
  };

  const clearSelection = () => {
    setSelectedIds([]);
  };

  const generateIdeasFor = async (targetMaterials) => {
    if (!targetMaterials || targetMaterials.length === 0) return;
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ materials: targetMaterials })
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      if (data.ideas && Array.isArray(data.ideas)) {
        setIdeas(data.ideas.slice(0, 3));
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err) {
      console.warn("Ideas error:", err);
      setErrorMsg("Failed to generate fresh ideas. Showing curated suggestions.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateClick = () => {
    const chosen = materials.filter(m => selectedIds.includes(m.id));
    if (chosen.length === 0) {
      setErrorMsg("Please select at least 1 material scrap to spark ideas.");
      return;
    }
    generateIdeasFor(chosen);
  };

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">AI Art Idea Generator</h2>
        <p className="page-subtitle">
          Select any workshop scraps on hand. Gemini Flash crafts 3 distinct project concepts using only your materials and common studio tools (scissors, needle & thread, glue).
        </p>
      </div>

      {/* Material Selection Card */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
            Choose Your Scraps ({selectedIds.length} selected)
          </h3>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={selectAll} className="btn btn-subtle btn-sm" style={{ fontSize: 11 }}>
              Select All
            </button>
            <button onClick={clearSelection} className="btn btn-subtle btn-sm" style={{ fontSize: 11 }}>
              Clear
            </button>
          </div>
        </div>

        {/* Checkbox grid with dark theme styling */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, marginBottom: 18 }}>
          {materials.map((mat) => {
            const isChecked = selectedIds.includes(mat.id);
            return (
              <label 
                key={mat.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  border: isChecked ? '1px solid var(--accent)' : '1px solid var(--border-light)',
                  background: isChecked ? 'var(--accent-light)' : 'var(--bg-subtle)',
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  transform: isChecked ? 'translateY(-1px)' : 'none'
                }}
              >
                <input 
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleMaterial(mat.id)}
                  style={{ accentColor: 'var(--accent)', width: 16, height: 16 }}
                />
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {mat.name}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>
                    {mat.type} · {mat.estimated_weight_kg || mat.weight_kg}kg
                  </div>
                </div>
              </label>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button 
            onClick={handleGenerateClick} 
            disabled={loading || selectedIds.length === 0} 
            className="btn btn-primary"
            style={{ flex: '2 1 200px' }}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                <span>Gemini Flash Generating 3 Concepts...</span>
              </>
            ) : (
              <>
                <IconSparkles size={18} />
                <span>Generate 3 Project Ideas</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => onNavigateToMap && onNavigateToMap()}
            className="btn btn-secondary"
            style={{ flex: '1 1 160px' }}
            title="Find nearest suppliers for these scraps"
          >
            <IconMap size={18} />
            <span>Nearest supplier</span>
          </button>
        </div>
      </div>

      {/* Error / Notice */}
      {errorMsg && (
        <div className="card" style={{ borderColor: 'rgba(239, 68, 68, 0.3)', background: 'rgba(239, 68, 68, 0.1)', marginBottom: 20 }}>
          <p style={{ fontSize: 13, color: 'var(--danger)' }}>{errorMsg}</p>
        </div>
      )}

      {/* Loading Skeletons */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="card skeleton" style={{ height: 130 }} />
          <div className="card skeleton" style={{ height: 130 }} />
          <div className="card skeleton" style={{ height: 130 }} />
        </div>
      )}

      {/* Exactly 3 Expandable Cards with Animated Transition */}
      {!loading && ideas.length > 0 && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>Generated Concepts (Select to View Steps)</h3>
            <span className="badge badge-accent">
              <span className="ribbon-animated">
                <IconRibbonBow size={12} />
              </span>
              3 Ideas Ready
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {ideas.map((idea, idx) => {
              const isExpanded = expandedIndex === idx;
              return (
                <div 
                  key={idx} 
                  className="card"
                  style={{ 
                    border: isExpanded ? '1px solid var(--accent-border)' : '1px solid var(--border-light)',
                    background: isExpanded ? 'linear-gradient(145deg, #181822 0%, #13131A 100%)' : 'var(--bg-card)',
                    boxShadow: isExpanded ? 'var(--shadow-rose)' : 'var(--shadow-sm)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    animation: `fadeInDown 0.4s ease-out ${idx * 0.1}s both`
                  }}
                >
                  {/* Card Header (Click to toggle) */}
                  <div 
                    onClick={() => setExpandedIndex(isExpanded ? -1 : idx)}
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'flex-start', 
                      cursor: 'pointer',
                      gap: 12
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span className="badge" style={{ textTransform: 'capitalize', fontSize: 11 }}>
                          Difficulty: {idea.difficulty || 'medium'}
                        </span>
                        <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                          Idea #{idx + 1}
                        </span>
                      </div>
                      <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: 19, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                        {idea.title}
                      </h4>
                      <p style={{ fontSize: 13, color: 'var(--accent-hover)' }}>
                        <strong>Output:</strong> {idea.what_you_will_make}
                      </p>
                    </div>

                    <button 
                      className="btn btn-subtle btn-sm"
                      style={{ 
                        width: 32, 
                        height: 32, 
                        padding: 0, 
                        borderRadius: '50%',
                        transform: isExpanded ? 'rotate(180deg)' : 'none',
                        transition: 'transform 0.25s ease'
                      }}
                      aria-label={isExpanded ? "Collapse idea" : "Expand idea"}
                    >
                      <IconChevronDown size={16} />
                    </button>
                  </div>

                  {/* Expanded Content with Smooth Animation */}
                  {isExpanded && (
                    <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border-light)', animation: 'fadeIn 0.25s ease-out' }}>
                      <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 14 }}>
                        {idea.description}
                      </p>

                      <div style={{ background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', padding: 14, marginBottom: 12, border: '1px solid var(--border-subtle)' }}>
                        <h5 style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent)', marginBottom: 10 }}>
                          Step-by-Step Instructions
                        </h5>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {(idea.steps || []).map((step, sIdx) => (
                            <div key={sIdx} style={{ display: 'flex', gap: 10, fontSize: 12.5, color: 'var(--text-primary)' }}>
                              <span style={{ fontWeight: 700, color: 'var(--accent)' }}>0{sIdx + 1}.</span>
                              <span>{step}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div style={{ fontSize: 11, color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>Required: Scraps + basic tools (scissors / needle & thread / glue). Extra items: Optional.</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
