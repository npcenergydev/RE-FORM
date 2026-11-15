import React, { useState, useRef, useEffect } from 'react';
import { getMaterials, getOrders, getActiveChallenge, getSuppliers } from '../utils/storage.js';
import { calculateDistance } from '../utils/distance.js';
import { DEFAULT_MAP_CENTER } from '../constants/seedSuppliers.js';

const QUICK_CHIPS = [
  "Where is my order?",
  "Nearest supplier",
  "Give me an idea",
  "How is impact calculated?"
];

export default function ChatAssistant({ onNavigateTab }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'msg-welcome',
      role: 'assistant',
      content: "Hello! I'm Re:form's assistant. Ask me about nearby studio suppliers, tracking your material orders, getting creative ideas for your scraps, or calculating your eco-impact.",
      action: null
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastSendTime, setLastSendTime] = useState(0);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, loading]);

  // Construct compact context from current app state
  const buildCompactContext = () => {
    const materials = getMaterials().filter(m => !m.used);
    const orders = getOrders();
    const challenge = getActiveChallenge();
    const suppliers = getSuppliers();

    // Calculate proximity for nearest 3 suppliers
    const rankedSuppliers = suppliers.map(s => ({
      ...s,
      distance: calculateDistance(DEFAULT_MAP_CENTER.lat, DEFAULT_MAP_CENTER.lng, s.lat, s.lng)
    })).sort((a, b) => a.distance - b.distance).slice(0, 3);

    return {
      materials: materials.slice(0, 6).map(m => ({ id: m.id, name: m.name, type: m.type })),
      currentChallenge: challenge ? { title: challenge.title, materials: challenge.materials } : null,
      orders: orders.slice(0, 3).map(o => ({
        id: o.id,
        trackingCode: o.trackingCode,
        status: o.status,
        supplierName: o.supplierName,
        materialNames: o.materialNames,
        method: o.method,
        estimatedDelivery: o.estimatedDelivery
      })),
      nearestSuppliers: rankedSuppliers.map(s => ({
        id: s.id,
        name: s.name,
        distance: s.distance,
        businessType: s.businessType,
        city: s.city,
        materialsAvailable: s.materialsAvailable
      }))
    };
  };

  const handleSendMessage = async (userText) => {
    const text = (userText || inputValue).trim();
    if (!text || loading) return;

    // Rate-limit client sends to 1 per second
    const now = Date.now();
    if (now - lastSendTime < 1000) {
      return;
    }
    setLastSendTime(now);

    const userMsg = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputValue('');
    setLoading(true);

    try {
      const context = buildCompactContext();
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.slice(-10).map(m => ({ role: m.role, content: m.content })),
          context
        })
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      const assistantMsg = {
        id: `asst-${Date.now()}`,
        role: 'assistant',
        content: data.reply || "I'm here to support your creative practice with discarded materials.",
        action: data.action || null
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      console.warn("Chat assistant error:", err);
      setMessages(prev => [
        ...prev,
        {
          id: `asst-err-${Date.now()}`,
          role: 'assistant',
          content: "Sorry, I had trouble connecting. You can try asking again, or browse the tabs directly.",
          action: null
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: `msg-welcome-${Date.now()}`,
        role: 'assistant',
        content: "Chat cleared. What can I help you find or create today?",
        action: null
      }
    ]);
  };

  const handleActionClick = (action) => {
    if (!action || !action.tab) return;
    if (onNavigateTab) {
      onNavigateTab(action.tab);
    }
    // Optionally close panel on small screens
    if (window.innerWidth < 640) {
      setIsOpen(false);
    }
  };

  const getActionLabel = (tab) => {
    switch (tab) {
      case 'map': return 'Open Supplier Map →';
      case 'orders': return 'View Orders & Tracking →';
      case 'challenge': return 'Spin Challenge →';
      case 'ideas': return 'Explore Art Ideas →';
      case 'scan': return 'Scan Materials →';
      default: return `Go to ${tab} →`;
    }
  };

  return (
    <>
      {/* Floating Trigger Button (Collision-free above bottom bar) */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? "Close Re:form Assistant" : "Open Re:form Assistant"}
        className="floating-chat-trigger"
      >
        {isOpen ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        ) : (
          <div style={{ position: 'relative' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            <span 
              style={{
                position: 'absolute',
                top: -2,
                right: -3,
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: 'var(--accent)',
                boxShadow: '0 0 6px var(--accent)'
              }}
            />
          </div>
        )}
      </button>

      {/* Slide-out / Bottom Sheet Panel */}
      {isOpen && (
        <div 
          className="floating-chat-panel animate-slide-up"
        >
          {/* Panel Header */}
          <div 
            style={{
              padding: '0.85rem 1rem',
              borderBottom: '1px solid var(--border)',
              background: 'var(--surface-sunken)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', boxShadow: '0 0 6px var(--accent)' }}></div>
              <div>
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontFamily: 'var(--font-serif)', color: 'var(--text)' }}>
                  Re:form Assistant
                </h4>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  GenAI Studio Concierge
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <button
                type="button"
                onClick={handleClearChat}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  padding: '0.2rem 0.4rem',
                  borderRadius: 'var(--radius-sm)'
                }}
                title="Clear conversation"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '0.2rem'
                }}
                aria-label="Close assistant"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          </div>

          {/* Messages scroll area */}
          <div 
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.85rem'
            }}
          >
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  style={{
                    alignSelf: isUser ? 'flex-end' : 'flex-start',
                    maxWidth: '85%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isUser ? 'flex-end' : 'flex-start'
                  }}
                >
                  <div
                    style={{
                      padding: '0.65rem 0.85rem',
                      borderRadius: isUser ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                      background: isUser ? 'var(--accent)' : 'var(--surface-sunken)',
                      color: isUser ? '#0A0A0D' : 'var(--text)',
                      fontSize: '0.85rem',
                      lineHeight: '1.4',
                      border: isUser ? 'none' : '1px solid var(--border)',
                      fontWeight: isUser ? 500 : 400
                    }}
                  >
                    {msg.content}
                  </div>

                  {/* Structured Action Button */}
                  {msg.action && (
                    <button
                      type="button"
                      onClick={() => handleActionClick(msg.action)}
                      style={{
                        marginTop: '0.4rem',
                        fontSize: '0.775rem',
                        padding: '0.35rem 0.75rem',
                        background: 'rgba(212, 138, 148, 0.15)',
                        border: '1px solid var(--accent)',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--accent)',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem'
                      }}
                    >
                      {getActionLabel(msg.action.tab)}
                    </button>
                  )}
                </div>
              );
            })}

            {/* Typing indicator */}
            {loading && (
              <div
                style={{
                  alignSelf: 'flex-start',
                  padding: '0.65rem 0.9rem',
                  borderRadius: '14px 14px 14px 2px',
                  background: 'var(--surface-sunken)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  gap: '4px',
                  alignItems: 'center'
                }}
              >
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', animation: 'pulseUser 1s infinite alternate' }}></div>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', animation: 'pulseUser 1s infinite alternate 0.2s' }}></div>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', animation: 'pulseUser 1s infinite alternate 0.4s' }}></div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick-action chips */}
          <div 
            style={{
              padding: '0.4rem 0.75rem',
              borderTop: '1px solid var(--border)',
              background: 'var(--surface-sunken)',
              display: 'flex',
              gap: '0.4rem',
              overflowX: 'auto',
              whiteSpace: 'nowrap'
            }}
          >
            {QUICK_CHIPS.map(chip => (
              <button
                key={chip}
                type="button"
                onClick={() => handleSendMessage(chip)}
                disabled={loading}
                style={{
                  fontSize: '0.725rem',
                  padding: '0.25rem 0.6rem',
                  borderRadius: '999px',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  flexShrink: 0
                }}
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Input Form */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            style={{
              padding: '0.6rem 0.75rem',
              borderTop: '1px solid var(--border)',
              display: 'flex',
              gap: '0.4rem',
              background: 'var(--surface)'
            }}
          >
            <input 
              type="text"
              className="input-field"
              placeholder="Ask Re:form..."
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              disabled={loading}
              style={{
                flex: 1,
                fontSize: '0.85rem',
                padding: '0.45rem 0.75rem'
              }}
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!inputValue.trim() || loading}
              style={{
                padding: '0.45rem 0.75rem',
                fontSize: '0.85rem'
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </form>
        </div>
      )}
    </>
  );
}
