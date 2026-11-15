import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Navbar } from './components/Navbar.jsx';
import { Navigation } from './components/Navigation.jsx';
import { FirebaseErrorBanner } from './components/FirebaseErrorBanner.jsx';
import { Dashboard } from './pages/Dashboard.jsx';
import ChatAssistant from './components/ChatAssistant.jsx';
import Toast from './components/Toast.jsx';
import AuthModal from './components/AuthModal.jsx';

// Lazy-loaded pages with proper named/default export adapters for optimal code-splitting
const MapPage = lazy(() => import('./pages/Map.jsx'));
const OrdersPage = lazy(() => import('./pages/Orders.jsx'));
const CustomerMaterials = lazy(() => import('./pages/CustomerMaterials.jsx'));
const ScanMaterials = lazy(() => import('./pages/ScanMaterials.jsx').then(m => ({ default: m.ScanMaterials })));
const Challenge = lazy(() => import('./pages/Challenge.jsx').then(m => ({ default: m.Challenge })));
const Ideas = lazy(() => import('./pages/Ideas.jsx').then(m => ({ default: m.Ideas })));
const Gallery = lazy(() => import('./pages/Gallery.jsx').then(m => ({ default: m.Gallery })));

function StudioLoadingFallback() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '360px', flexDirection: 'column', gap: 12 }}>
      <div className="spinner"></div>
      <div style={{ fontSize: 13, color: 'var(--text-tertiary)', fontFamily: 'var(--font-serif)', letterSpacing: '0.04em' }}>
        Opening Atelier View...
      </div>
    </div>
  );
}

import { 
  getMaterials, 
  addMaterials, 
  getArtworks, 
  addArtwork, 
  getActivities, 
  getActiveChallenge, 
  setActiveChallenge, 
  clearActiveChallenge, 
  resetToDefaults, 
  getLiveStats,
  getCurrentUser,
  setCurrentUser as setStoredUser,
  syncWithFirestore 
} from './utils/storage.js';
import { INITIAL_CUSTOMERS } from './constants/seedCustomers.js';
import { IconRibbonBow } from './components/Icons.jsx';

export function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [materials, setMaterials] = useState(() => getMaterials());
  const [artworks, setArtworks] = useState(() => getArtworks());
  const [activities, setActivities] = useState(() => getActivities());
  const [activeChallengeState, setActiveChallengeState] = useState(() => getActiveChallenge());
  const [ideasSelectedMaterials, setIdeasSelectedMaterials] = useState([]);
  const [aiStatus, setAiStatus] = useState({ connected: false, model: 'gemini-3.5-flash' });
  const [toastMessage, setToastMessage] = useState(null);
  const [currentUser, setCurrentUser] = useState(() => getCurrentUser());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const showToast = (msg) => setToastMessage(msg);

  // Live stats computed from materials & artworks
  const [stats, setStats] = useState(() => getLiveStats());

  // Check health on mount to show AI connection status in footer/header
  useEffect(() => {
    fetch('/api/health')
      .then(res => res.json())
      .then(data => {
        setAiStatus({
          connected: Boolean(data.aiConfigured),
          model: data.model || 'gemini-3.5-flash'
        });
      })
      .catch(() => {
        setAiStatus({ connected: false, model: 'demo' });
      });

    // Synchronize with Firestore (and automatically show exact errors in UI if it fails)
    syncWithFirestore((updates) => {
      if (updates.materials) setMaterials(updates.materials);
      if (updates.artworks) setArtworks(updates.artworks);
      if (updates.activities) setActivities(updates.activities);
    });
  }, []);

  // Update live stats whenever materials or artworks change
  useEffect(() => {
    setStats(getLiveStats());
  }, [materials, artworks]);

  // Handler: materials added from scanner
  const handleMaterialsAdded = (newItems) => {
    const updated = addMaterials(newItems);
    setMaterials(updated);
    setActivities(getActivities());
  };

  // Handler: challenge accepted
  const handleAcceptChallenge = (challenge) => {
    setActiveChallenge(challenge);
    setActiveChallengeState(challenge);
    setActivities(getActivities());
  };

  // Handler: challenge abandoned
  const handleCancelChallenge = () => {
    clearActiveChallenge();
    setActiveChallengeState(null);
  };

  // Handler: artwork completed
  const handleCompleteChallenge = (artwork) => {
    const updatedArtworks = addArtwork(artwork);
    setArtworks(updatedArtworks);
    setMaterials(getMaterials());
    setActivities(getActivities());
    setActiveChallengeState(null);
  };

  // Handler: navigate to ideas with specific materials
  const handleNavigateToIdeas = (mats) => {
    setIdeasSelectedMaterials(mats);
    setActiveTab('ideas');
  };

  // Handler: reset demo data
  const handleResetDemo = () => {
    if (window.confirm("Reset materials and gallery back to the initial demo state?")) {
      resetToDefaults();
      setMaterials(getMaterials());
      setArtworks(getArtworks());
      setActivities(getActivities());
      setActiveChallengeState(null);
    }
  };

  const handleContinueAsDemo = () => {
    const demo = INITIAL_CUSTOMERS[0];
    setStoredUser(demo);
    setCurrentUser(demo);
    showToast(`Logged in as demo persona: ${demo.name}`);
  };

  const isProtectedTab = ['scan', 'challenge', 'ideas', 'orders', 'account'].includes(activeTab);
  const tabTitleMap = {
    scan: 'Material Scanner',
    challenge: 'Creative Challenge',
    ideas: 'Art Ideas Generator',
    orders: 'Orders & Tracking',
    account: 'Scrap Custody & Profile'
  };

  return (
    <div className="app-container">
      {/* Firebase Error Debugger Banner (shows exact errors if any Firebase call fails) */}
      <FirebaseErrorBanner />

      {/* Desktop Sidebar & Mobile Bottom Navigation */}
      <Navigation 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        aiStatus={aiStatus}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthModalOpen(true)}
      />

      {/* Main Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Mobile Top Navbar */}
        <Navbar 
          aiStatus={aiStatus} 
          currentUser={currentUser}
          onOpenAuth={() => setIsAuthModalOpen(true)}
          onNavigateAccount={() => setActiveTab('account')}
        />

        {/* Dynamic Page Views */}
        <main className="main-wrapper">
          <Suspense fallback={<StudioLoadingFallback />}>
            {activeTab === 'dashboard' && (
              <Dashboard 
                stats={stats} 
                activities={activities} 
                onNavigate={(tab) => {
                  if (!currentUser && ['scan', 'challenge', 'orders'].includes(tab)) {
                    setIsAuthModalOpen(true);
                  }
                  setActiveTab(tab);
                }} 
              />
            )}

            {activeTab === 'gallery' && (
              <Gallery 
                artworks={artworks} 
              />
            )}

            {activeTab === 'map' && (
              <MapPage 
                currentUser={currentUser}
                onOpenAuth={() => setIsAuthModalOpen(true)}
                onNavigateTab={setActiveTab} 
                onShowToast={showToast} 
              />
            )}

            {/* Protected Views: Gate if signed out */}
            {!currentUser && isProtectedTab ? (
              <div className="card" style={{ 
                maxWidth: 500, 
                margin: '40px auto', 
                textAlign: 'center', 
                padding: '36px 24px',
                border: '1px solid var(--accent-border)',
                background: 'linear-gradient(145deg, #1A1A24 0%, #121218 100%)',
                boxShadow: 'var(--shadow-lg)'
              }}>
                <div style={{ display: 'inline-flex', padding: 16, background: 'var(--accent-light)', color: 'var(--accent)', borderRadius: '50%', marginBottom: 14 }}>
                  <span className="ribbon-animated">
                    <IconRibbonBow size={36} />
                  </span>
                </div>

                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 24, marginBottom: 8, color: 'var(--text-primary)' }}>
                  Studio Sign-In Required
                </h3>

                <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', maxWidth: 420, margin: '0 auto 20px', lineHeight: 1.6 }}>
                  Access to <strong>{tabTitleMap[activeTab] || 'this feature'}</strong> is reserved for registered artists and studio suppliers. Sign in with Google, email, or explore immediately as a demo persona.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 300, margin: '0 auto' }}>
                  <button onClick={() => setIsAuthModalOpen(true)} className="btn btn-primary btn-block">
                    Sign In or Create Account
                  </button>
                  <button onClick={handleContinueAsDemo} className="btn btn-secondary btn-block">
                    ⚡ Continue as Demo User (Instant)
                  </button>
                </div>

                <div style={{ marginTop: 20, fontSize: 11.5, color: 'var(--text-tertiary)' }}>
                  Hackathon judges & evaluators can use instant demo access.
                </div>
              </div>
            ) : (
              <>
                {activeTab === 'scan' && (
                  <ScanMaterials 
                    onMaterialsAdded={handleMaterialsAdded} 
                    onNavigate={setActiveTab} 
                  />
                )}

                {activeTab === 'challenge' && (
                  <Challenge 
                    materials={materials} 
                    activeChallenge={activeChallengeState}
                    onAcceptChallenge={handleAcceptChallenge}
                    onCompleteChallenge={handleCompleteChallenge}
                    onCancelChallenge={handleCancelChallenge}
                    onNavigateToIdeas={handleNavigateToIdeas}
                    onNavigateToGallery={() => setActiveTab('gallery')}
                    onNavigateToMap={() => setActiveTab('map')}
                  />
                )}

                {activeTab === 'ideas' && (
                  <Ideas 
                    materials={materials} 
                    initialSelectedMaterials={ideasSelectedMaterials} 
                    onNavigateToMap={() => setActiveTab('map')}
                  />
                )}

                {activeTab === 'orders' && (
                  <OrdersPage 
                    currentUser={currentUser}
                    onNavigateTab={setActiveTab} 
                    onShowToast={showToast} 
                  />
                )}

                {activeTab === 'account' && (
                  <CustomerMaterials 
                    currentUser={currentUser}
                    onUserChange={setCurrentUser}
                    onNavigateTab={setActiveTab} 
                    onOpenAuth={() => setIsAuthModalOpen(true)} 
                  />
                )}
              </>
            )}
          </Suspense>

          {/* Unified Footer */}
          <footer className="app-footer">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
              <div className="ai-status-pill">
                <span className={`ai-status-dot ${aiStatus.connected ? 'connected' : 'demo'}`}></span>
                <span>
                  {aiStatus.connected 
                    ? `AI: Connected (${aiStatus.model})` 
                    : 'AI: Demo Fallback Active'}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center' }}>
              <span>Waste. Create. Inspire.</span>
              <span>·</span>
              <button 
                onClick={handleResetDemo} 
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: 'var(--text-tertiary)', 
                  fontSize: 11, 
                  cursor: 'pointer',
                  textDecoration: 'underline' 
                }}
              >
                Reset Demo Data
              </button>
            </div>
          </footer>
        </main>
      </div>

      {/* Floating AI Chat Assistant */}
      <ChatAssistant onNavigateTab={setActiveTab} />

      {/* In-app Toast Notifications */}
      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />

      {/* Sign In & Sign Up Modal (Firebase Authentication) */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        onAuthSuccess={(user) => {
          setCurrentUser(user);
          showToast(`Welcome to Re:form, ${user.name}!`);
        }} 
      />
    </div>
  );
}
