import { useState, useEffect, useMemo, useCallback } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import Specialties from './components/Specialties';
import ProviderCard from './components/ProviderCard';
import HowItWorks from './components/HowItWorks';
import Footer from './components/Footer';
import BookingModal from './components/BookingModal';
import AuthModal from './components/AuthModal';
import Dashboard from './components/Dashboard';
import ChatbotModal from './components/ChatbotModal';
import { DEMO_PROVIDERS } from './data/demoData';
import { checkHealth, fetchDoctors, fetchHospitals, fetchMe, logoutUser } from './config/api';
import { SearchIcon, SparklesIcon } from './components/Icons';
import { useLanguage } from './context/LanguageContext';

export default function App() {
  const { t, language } = useLanguage();
  const [currentView, setCurrentView] = useState('home'); // 'home' | 'dashboard'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocality, setSelectedLocality] = useState('All Localities');
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [providerTypeFilter, setProviderTypeFilter] = useState('all'); // 'all' | 'doctor' | 'hospital'
  const [modalData, setModalData] = useState(null);
  const [authModalMode, setAuthModalMode] = useState(null); // 'login' | 'register' | null
  const [currentUser, setCurrentUser] = useState(null);
  const [apiHealth, setApiHealth] = useState(null);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);

  // Live API data state
  const [liveDoctors, setLiveDoctors] = useState([]);
  const [liveHospitals, setLiveHospitals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dbError, setDbError] = useState(null);
  const [viewDemoFallback, setViewDemoFallback] = useState(false);

  // Check health and authenticated user session on load
  useEffect(() => {
    checkHealth()
      .then((data) => setApiHealth(data))
      .catch(() => setApiHealth(null));

    fetchMe()
      .then((user) => setCurrentUser(user))
      .catch(() => setCurrentUser(null));
  }, []);

  // Fetch live doctors and hospitals from backend APIs
  const loadProviders = useCallback(async () => {
    setIsLoading(true);
    setDbError(null);

    try {
      const [doctorsRes, hospitalsRes] = await Promise.all([
        fetchDoctors({
          search: searchQuery,
          locality: selectedLocality,
          specialty: selectedSpecialty,
        }),
        fetchHospitals({
          search: searchQuery,
          locality: selectedLocality,
          specialty: selectedSpecialty,
        }),
      ]);

      const formattedDocs = (doctorsRes.data || []).map((doc) => ({
        ...doc,
        id: doc._id || doc.id,
        type: 'doctor',
      }));

      const formattedHosps = (hospitalsRes.data || []).map((hosp) => ({
        ...hosp,
        id: hosp._id || hosp.id,
        type: 'hospital',
      }));

      setLiveDoctors(formattedDocs);
      setLiveHospitals(formattedHosps);
      setDbError(null);
    } catch (err) {
      setDbError(err.message || 'MongoDB is currently unavailable.');
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, selectedLocality, selectedSpecialty]);

  useEffect(() => {
    loadProviders();
  }, [loadProviders]);

  const handleLogout = async () => {
    try {
      await logoutUser();
      setCurrentUser(null);
      setCurrentView('home');
    } catch (err) {
      console.error('Logout error:', err.message);
      setCurrentUser(null);
      setCurrentView('home');
    }
  };

  const handleSwitchView = (view) => {
    if (view === 'dashboard' && !currentUser) {
      setAuthModalMode('login');
      return;
    }
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Demo fallback filtering (only used if explicitly toggled by user during DB outage)
  const filteredDemoProviders = useMemo(() => {
    return DEMO_PROVIDERS.filter((item) => {
      if (providerTypeFilter !== 'all' && item.type !== providerTypeFilter) return false;
      if (selectedLocality !== 'All Localities' && item.locality !== selectedLocality) return false;
      if (selectedSpecialty) {
        if (item.type === 'doctor') {
          if (item.specialty.toLowerCase() !== selectedSpecialty.toLowerCase()) return false;
        } else if (item.type === 'hospital') {
          const hasSpec = item.specialties?.some(
            (s) => s.toLowerCase() === selectedSpecialty.toLowerCase()
          );
          if (!hasSpec) return false;
        }
      }
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase().trim();
        const matchName = item.name.toLowerCase().includes(query);
        const matchLoc = item.locality.toLowerCase().includes(query);
        const matchSpec =
          item.type === 'doctor'
            ? item.specialty.toLowerCase().includes(query)
            : item.specialties?.some((s) => s.toLowerCase().includes(query));
        const matchCat = item.category?.toLowerCase().includes(query) || false;
        if (!matchName && !matchLoc && !matchSpec && !matchCat) return false;
      }
      return true;
    });
  }, [searchQuery, selectedLocality, selectedSpecialty, providerTypeFilter]);

  // Active providers based on live database or explicit demo preview
  const liveProviders = useMemo(() => {
    if (providerTypeFilter === 'doctor') return liveDoctors;
    if (providerTypeFilter === 'hospital') return liveHospitals;
    return [...liveDoctors, ...liveHospitals];
  }, [liveDoctors, liveHospitals, providerTypeFilter]);

  const activeProviders = dbError && viewDemoFallback ? filteredDemoProviders : liveProviders;

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedLocality('All Localities');
    setSelectedSpecialty('');
    setProviderTypeFilter('all');
  };

  const handleScrollTo = (sectionId) => {
    if (currentView !== 'home') {
      setCurrentView('home');
      setTimeout(() => {
        if (sectionId === 'home') {
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }
        const elem = document.getElementById(sectionId);
        if (elem) elem.scrollIntoView({ behavior: 'smooth' });
      }, 50);
      return;
    }

    if (sectionId === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const elem = document.getElementById(sectionId);
    if (elem) elem.scrollIntoView({ behavior: 'smooth' });
  };

  const handleQuickSpecialtySelect = (specialtyName) => {
    setSelectedSpecialty(specialtyName);
    handleScrollTo('discovery');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800">
      {/* Navigation Header */}
      <Header
        currentUser={currentUser}
        currentView={currentView}
        onSwitchView={handleSwitchView}
        onOpenAuthModal={(mode) => setAuthModalMode(mode)}
        onLogout={handleLogout}
        onNavigate={handleScrollTo}
        onOpenChatbot={() => setIsChatbotOpen(true)}
      />

      {/* View Switching: Dashboard vs Homepage */}
      {currentView === 'dashboard' && currentUser ? (
        <Dashboard
          currentUser={currentUser}
          onBackToDiscovery={() => handleSwitchView('home')}
          onLogout={handleLogout}
        />
      ) : (
        <>
          {/* Hero Section with Search Bar */}
          <Hero
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedLocality={selectedLocality}
            setSelectedLocality={setSelectedLocality}
            onSearchSubmit={() => handleScrollTo('discovery')}
            onQuickSpecialtySelect={handleQuickSpecialtySelect}
          />

          {/* Specialties Browse */}
          <Specialties
            selectedSpecialty={selectedSpecialty}
            onSelectSpecialty={(spec) => {
              setSelectedSpecialty(spec);
              handleScrollTo('discovery');
            }}
          />

          {/* Healthcare Discovery Section */}
          <section id="discovery" className="py-14 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex-1">
            {/* Section Header & Type Tabs */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-teal-700 uppercase tracking-wider">
                    {t('discovery.tag')}
                  </span>
                  {dbError ? (
                    <span className="text-[10px] bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full font-semibold">
                      {t('discovery.dbOffline')}
                    </span>
                  ) : (
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-semibold">
                      {t('discovery.dbLive')}
                    </span>
                  )}
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mt-1">
                  {providerTypeFilter === 'doctor'
                    ? t('discovery.titleDocs')
                    : providerTypeFilter === 'hospital'
                    ? t('discovery.titleHosps')
                    : t('discovery.titleAll')}
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  {isLoading
                    ? t('discovery.loadingTitle')
                    : dbError && !viewDemoFallback
                    ? t('discovery.dbOfflineDesc')
                    : `${t('discovery.showingCount', { count: activeProviders.length })}${
                        selectedLocality !== 'All Localities' ? ` in ${selectedLocality}` : ''
                      }${selectedSpecialty ? ` (${t('specialty.' + selectedSpecialty, selectedSpecialty)})` : ''}`}
                </p>
              </div>

              {/* Filter Controls */}
              <div className="flex items-center gap-2 bg-slate-200/70 p-1 rounded-xl self-start md:self-auto text-xs font-semibold">
                <button
                  onClick={() => setProviderTypeFilter('all')}
                  className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                    providerTypeFilter === 'all'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {t('discovery.tabAll')}
                </button>
                <button
                  onClick={() => setProviderTypeFilter('doctor')}
                  className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                    providerTypeFilter === 'doctor'
                      ? 'bg-white text-teal-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {t('discovery.tabDoctors')}
                </button>
                <button
                  onClick={() => setProviderTypeFilter('hospital')}
                  className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                    providerTypeFilter === 'hospital'
                      ? 'bg-white text-teal-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {t('discovery.tabHospitals')}
                </button>
              </div>
            </div>

            {/* Database Unavailable Explicit Alert */}
            {dbError && (
              <div className="mb-8 p-5 bg-amber-50/90 border border-amber-300 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                    {t('discovery.dbOfflineTitle')} (HTTP 503)
                  </div>
                  <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                    {t('discovery.dbOfflineDesc')}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={loadProviders}
                    className="px-3.5 py-2 bg-amber-200 hover:bg-amber-300 text-amber-900 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                  >
                    {t('discovery.retryBtn')}
                  </button>
                  <button
                    onClick={() => setViewDemoFallback(!viewDemoFallback)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                      viewDemoFallback
                        ? 'bg-amber-800 text-white'
                        : 'bg-white border border-amber-300 text-amber-900 hover:bg-amber-100'
                    }`}
                  >
                    {viewDemoFallback ? t('discovery.hideDemoBtn') : t('discovery.inspectDemoBtn')}
                  </button>
                </div>
              </div>
            )}

            {/* Active Filters Bar if any applied */}
            {(selectedLocality !== 'All Localities' || selectedSpecialty || searchQuery) && (
              <div className="mb-6 flex flex-wrap items-center gap-2 bg-teal-50/70 border border-teal-200/80 px-4 py-2.5 rounded-xl text-xs">
                <span className="font-semibold text-teal-900">{t('discovery.activeFilters')}</span>
                {selectedLocality !== 'All Localities' && (
                  <span className="bg-white border border-teal-200 text-teal-800 px-2 py-0.5 rounded-md flex items-center gap-1 font-medium">
                    {t('discovery.locality')}: {selectedLocality}
                    <button
                      onClick={() => setSelectedLocality('All Localities')}
                      className="hover:text-rose-600 font-bold ml-1 cursor-pointer"
                    >
                      ×
                    </button>
                  </span>
                )}
                {selectedSpecialty && (
                  <span className="bg-white border border-teal-200 text-teal-800 px-2 py-0.5 rounded-md flex items-center gap-1 font-medium">
                    {t('discovery.specialty')}: {t(`specialty.${selectedSpecialty}`, selectedSpecialty)}
                    <button
                      onClick={() => setSelectedSpecialty('')}
                      className="hover:text-rose-600 font-bold ml-1 cursor-pointer"
                    >
                      ×
                    </button>
                  </span>
                )}
                {searchQuery && (
                  <span className="bg-white border border-teal-200 text-teal-800 px-2 py-0.5 rounded-md flex items-center gap-1 font-medium">
                    {t('discovery.search')}: "{searchQuery}"
                    <button
                      onClick={() => setSearchQuery('')}
                      className="hover:text-rose-600 font-bold ml-1 cursor-pointer"
                    >
                      ×
                    </button>
                  </span>
                )}
                <button
                  onClick={handleResetFilters}
                  className="ml-auto text-teal-700 hover:text-teal-900 font-semibold underline underline-offset-2 cursor-pointer"
                >
                  {t('discovery.resetAll')}
                </button>
              </div>
            )}

            {/* Loading State */}
            {isLoading && (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md mx-auto">
                <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-sm font-semibold text-slate-800">{t('discovery.loadingTitle')}</p>
                <p className="text-xs text-slate-500 mt-1">{t('discovery.loadingSubtitle')}</p>
              </div>
            )}

            {/* Database Error / Offline State */}
            {!isLoading && dbError && !viewDemoFallback && (
              <div className="bg-white rounded-2xl border border-dashed border-amber-300 p-12 text-center max-w-lg mx-auto">
                <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3 font-bold text-lg">
                  !
                </div>
                <h3 className="text-base font-bold text-slate-900">{t('discovery.dbOfflineTitle')}</h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  {t('discovery.dbOfflineDesc')}
                </p>
                <div className="mt-5 flex items-center justify-center gap-3">
                  <button
                    onClick={loadProviders}
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    {t('discovery.retryBtn')}
                  </button>
                  <button
                    onClick={() => setViewDemoFallback(true)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    {t('discovery.inspectDemoBtn')}
                  </button>
                </div>
              </div>
            )}

            {/* Providers Grid */}
            {!isLoading && (!dbError || viewDemoFallback) && activeProviders.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeProviders.map((provider) => (
                  <ProviderCard
                    key={provider.id || provider._id}
                    provider={provider}
                    onSelectAction={(p, tab) => setModalData({ type: 'provider', provider: p, initialTab: tab || 'action' })}
                  />
                ))}
              </div>
            )}

            {/* Empty State when 0 providers found */}
            {!isLoading && (!dbError || viewDemoFallback) && activeProviders.length === 0 && (
              <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center max-w-lg mx-auto">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                  <SearchIcon className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900">{t('discovery.noProvidersTitle')}</h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  {t('discovery.noProvidersDesc')}
                </p>
                <button
                  onClick={handleResetFilters}
                  className="mt-4 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer"
                >
                  {t('discovery.clearFiltersBtn')}
                </button>
              </div>
            )}
          </section>

          {/* How It Works Section */}
          <HowItWorks />
        </>
      )}

      {/* Footer */}
      <Footer apiHealth={apiHealth} onNavigate={handleScrollTo} />

      {/* Floating AI Care Guide Trigger Button */}
      <button
        type="button"
        id="sehatsetu-ai-guide-btn"
        onClick={() => setIsChatbotOpen(true)}
        className="fixed bottom-6 right-6 z-40 bg-gradient-to-r from-teal-600 via-teal-700 to-slate-900 hover:from-teal-700 hover:to-slate-950 text-white px-4 py-3 rounded-full shadow-xl shadow-teal-700/30 hover:shadow-2xl hover:shadow-teal-700/40 flex items-center gap-2.5 transition-all transform hover:-translate-y-0.5 cursor-pointer border border-teal-500/40 group ring-4 ring-teal-100/50"
        aria-label={t('chat.title')}
      >
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-300 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-teal-200"></span>
        </span>
        <SparklesIcon className="w-5 h-5 text-teal-200 group-hover:rotate-12 transition-transform" />
        <span className="font-bold text-xs sm:text-sm tracking-tight">
          {t('chat.title')}
        </span>
      </button>

      {/* SehatSetu AI Care Guide Chatbot Modal */}
      <ChatbotModal
        isOpen={isChatbotOpen}
        onClose={() => setIsChatbotOpen(false)}
        onBookDoctor={(doc) => {
          setModalData({ type: 'provider', provider: doc, initialTab: 'action' });
        }}
        onFilterSpecialty={(spec) => {
          setSelectedSpecialty(spec);
          handleScrollTo('discovery');
        }}
      />

      {/* Action / Provider Booking Modal */}
      <BookingModal
        modalData={modalData}
        currentUser={currentUser}
        onClose={() => setModalData(null)}
        onOpenAuthModal={(mode) => setAuthModalMode(mode)}
        onBookingSuccess={() => {
          setCurrentView('dashboard');
          setModalData(null);
        }}
      />

      {/* Authentication Modal (Login / Register) */}
      {authModalMode && (
        <AuthModal
          key={authModalMode}
          initialMode={authModalMode}
          onClose={() => setAuthModalMode(null)}
          onSuccess={(user) => {
            setCurrentUser(user);
            setCurrentView('dashboard');
          }}
        />
      )}
    </div>
  );
}
