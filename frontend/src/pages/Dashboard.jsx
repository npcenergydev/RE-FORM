import React, { useState } from 'react';
import { IconLeaf, IconChallenge, IconScan, IconInfo, IconSparkles, IconRibbonBow } from '../components/Icons.jsx';
import { ImpactPopover } from '../components/ImpactPopover.jsx';
import { WEEKLY_DIVERTED_DATA } from '../constants/seedData.js';

export function Dashboard({ stats, activities, onNavigate }) {
  const [showImpactPopover, setShowImpactPopover] = useState(false);

  // Maximum kg for scaling the chart
  const maxWeeklyKg = Math.max(...WEEKLY_DIVERTED_DATA.map(d => d.kg), stats.wasteDivertedKg, 6);

  return (
    <div>
      {/* Hero / Hook Card with Dark Luxury Aesthetic */}
      <div className="card card-hero" style={{ marginBottom: 24, padding: '28px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ flex: 1, minWidth: 260 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
              <span className="badge badge-accent">
                <span className="ribbon-animated">
                  <IconRibbonBow size={13} />
                </span>
                re:create atelier
              </span>
              <span className="badge" style={{ fontSize: 11 }}>
                GenAI Creative Track
              </span>
            </div>

            <h2 style={{ 
              fontFamily: 'var(--font-serif)', 
              fontSize: 32, 
              fontWeight: 700, 
              letterSpacing: '0.01em', 
              color: 'var(--text-primary)', 
              marginBottom: 8,
              lineHeight: 1.15
            }}>
              Give the unwanted a new story.
            </h2>

            <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', maxWidth: 540, lineHeight: 1.6, marginBottom: 12 }}>
              <em>"Millions of creative materials are thrown away before they ever become art."</em> re:create connects discarded fashion textiles, printshop proofs, and workshop offcuts with independent creators. GenAI removes the cost barrier and creative blocks.
            </p>

            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--accent)', fontWeight: 600 }}>
              Waste. Create. Inspire.
            </div>
          </div>

          {/* Ribbon Bow Hero Graphic */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px 16px' }}>
            <div 
              className="ribbon-animated"
              style={{ 
                color: 'var(--accent)', 
                filter: 'drop-shadow(0 0 20px rgba(212, 138, 148, 0.45))' 
              }}
            >
              <IconRibbonBow size={78} />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 10, marginTop: 22, flexWrap: 'wrap' }}>
          <button 
            onClick={() => onNavigate('challenge')} 
            className="btn btn-primary"
            style={{ flex: '1 1 160px' }}
          >
            <IconChallenge size={18} />
            <span>Spin a Challenge</span>
          </button>
          <button 
            onClick={() => onNavigate('scan')} 
            className="btn btn-secondary"
            style={{ flex: '1 1 160px' }}
          >
            <IconScan size={18} />
            <span>Scan new materials</span>
          </button>
          <button 
            onClick={() => onNavigate('map')} 
            className="btn btn-secondary"
            style={{ flex: '1 1 160px' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
              <line x1="8" y1="2" x2="8" y2="18" />
              <line x1="16" y1="6" x2="16" y2="22" />
            </svg>
            <span>Find Suppliers</span>
          </button>
        </div>
      </div>

      {/* Live Impact & Inventory Stats */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, letterSpacing: '0.02em', color: 'var(--text-secondary)' }}>
          Platform Live Impact & Logistics
        </h3>
        <button 
          onClick={() => setShowImpactPopover(true)} 
          className="btn btn-subtle btn-sm"
          style={{ gap: 4, fontSize: 11, padding: '4px 10px' }}
          aria-label="How we calculate impact metrics"
        >
          <IconInfo size={13} />
          <span>How we calculate this</span>
        </button>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
        <div className="stat-card">
          <span className="stat-label">Materials Available</span>
          <span className="stat-value">{stats.materialsAvailable}</span>
          <span style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 6 }}>Active workshop scraps</span>
        </div>

        <div className="stat-card">
          <span className="stat-label">Challenges Completed</span>
          <span className="stat-value" style={{ color: 'var(--accent-hover)' }}>{stats.challengesCompleted}</span>
          <span style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 6 }}>Finished artworks</span>
        </div>

        <div className="stat-card">
          <span className="stat-label">
            <IconLeaf size={14} style={{ color: 'var(--accent)' }} />
            Waste Diverted
          </span>
          <span className="stat-value">
            {stats.wasteDivertedKg}
            <span className="stat-unit">kg</span>
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 6 }}>Rescued from disposal</span>
        </div>

        <div className="stat-card">
          <span className="stat-label">CO2e Avoided</span>
          <span className="stat-value" style={{ color: 'var(--accent-hover)' }}>
            {stats.co2eAvoidedKg}
            <span className="stat-unit">kg</span>
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 6 }}>Estimated savings</span>
        </div>

        {/* Active Orders Stat Card - Links to Orders */}
        <div 
          className="stat-card" 
          onClick={() => onNavigate('orders')} 
          style={{ cursor: 'pointer', transition: 'transform 0.15s ease' }}
          title="Click to view all active orders"
        >
          <span className="stat-label" style={{ color: 'var(--accent)' }}>
            Active Orders →
          </span>
          <span className="stat-value" style={{ color: 'var(--accent)' }}>
            {stats.activeOrdersCount ?? 2}
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 6 }}>In fulfillment pipeline</span>
        </div>

        {/* Latest Order Status - Links to Orders */}
        <div 
          className="stat-card" 
          onClick={() => onNavigate('orders')} 
          style={{ cursor: 'pointer', transition: 'transform 0.15s ease' }}
          title="Click to track latest order"
        >
          <span className="stat-label">
            Latest Order Status →
          </span>
          <span className="stat-value" style={{ fontSize: 18, color: 'var(--text-primary)', textTransform: 'capitalize' }}>
            {stats.latestOrderStatus || 'Dispatched'}
          </span>
          <span style={{ fontSize: 11, color: 'var(--accent)', marginTop: 6 }}>
            {stats.latestOrderTracking ? `#${stats.latestOrderTracking}` : 'View details'}
          </span>
        </div>
      </div>

      {/* Waste Diversion Trend Progress Visual */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h4 style={{ fontSize: 15, fontWeight: 600 }}>Waste Diversion Trajectory</h4>
            <p style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Cumulative workshop remnants repurposed across studio cycles</p>
          </div>
          <span className="badge badge-accent">
            +{stats.wasteDivertedKg} kg diverted
          </span>
        </div>

        {/* SVG Visual Chart with Rose Glow */}
        <div style={{ width: '100%', height: 130, position: 'relative' }}>
          <svg viewBox="0 0 400 110" width="100%" height="100%" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
            <defs>
              <linearGradient id="barGlow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#E59DA8" />
                <stop offset="100%" stopColor="#C4727F" />
              </linearGradient>
            </defs>
            {/* Horizontal Grid lines */}
            <line x1="0" y1="20" x2="400" y2="20" stroke="var(--border-subtle)" strokeWidth="1" strokeDasharray="4 4" />
            <line x1="0" y1="60" x2="400" y2="60" stroke="var(--border-subtle)" strokeWidth="1" strokeDasharray="4 4" />
            <line x1="0" y1="100" x2="400" y2="100" stroke="var(--border-light)" strokeWidth="1" />

            {/* Bars for demo weeks */}
            {WEEKLY_DIVERTED_DATA.map((item, idx) => {
              const x = 30 + idx * 95;
              const barHeight = Math.max(14, (item.kg / maxWeeklyKg) * 80);
              const y = 100 - barHeight;
              const isLatest = idx === WEEKLY_DIVERTED_DATA.length - 1;
              return (
                <g key={item.week}>
                  {/* Background Track */}
                  <rect x={x} y="20" width="38" height="80" rx="6" fill="var(--bg-subtle)" />
                  {/* Active Bar */}
                  <rect 
                    x={x} 
                    y={y} 
                    width="38" 
                    height={barHeight} 
                    rx="6" 
                    fill="url(#barGlow)" 
                    opacity={isLatest ? 1 : 0.7}
                    filter={isLatest ? "drop-shadow(0 0 8px rgba(212, 138, 148, 0.4))" : undefined}
                  />
                  {/* Weight label */}
                  <text x={x + 19} y={y - 6} textAnchor="middle" fontSize="10" fontWeight="600" fill="var(--text-primary)">
                    {item.kg}kg
                  </text>
                  {/* Week label */}
                  <text x={x + 19} y="112" textAnchor="middle" fontSize="11" fill="var(--text-tertiary)">
                    {item.week}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Recent Activity List with Staggered Entrance */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h4 style={{ fontSize: 15, fontWeight: 600, marginBottom: 14 }}>Recent Studio Activity</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {activities.slice(0, 5).map((activity, aIdx) => (
            <div 
              key={activity.id} 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                padding: '10px 12px', 
                background: 'var(--bg-subtle)', 
                borderRadius: 'var(--radius-sm)',
                gap: 8,
                border: '1px solid var(--border-subtle)',
                animation: `fadeInDown 0.3s ease-out ${aIdx * 0.06}s both`
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
                <span 
                  style={{ 
                    width: 8, 
                    height: 8, 
                    borderRadius: '50%', 
                    background: activity.type === 'artwork_completed' ? 'var(--accent)' : activity.type === 'material_added' ? '#60A5FA' : '#FBBF24',
                    boxShadow: activity.type === 'artwork_completed' ? '0 0 8px rgba(212, 138, 148, 0.8)' : 'none',
                    flexShrink: 0
                  }}
                />
                <span style={{ fontSize: 13, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {activity.text}
                </span>
              </div>
              <span style={{ fontSize: 11, color: 'var(--text-tertiary)', flexShrink: 0 }}>
                {activity.timestamp}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Small footer note */}
      <p style={{ fontSize: 11, color: 'var(--text-tertiary)', textAlign: 'center', fontStyle: 'italic', marginBottom: 12 }}>
        Impact figures are estimates based on typical material emission factors.
      </p>

      {/* Modal */}
      <ImpactPopover isOpen={showImpactPopover} onClose={() => setShowImpactPopover(false)} />
    </div>
  );
}
