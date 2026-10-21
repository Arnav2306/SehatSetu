import { useState } from 'react';
import { LogoIcon, MenuIcon, XIcon, UserIcon, SparklesIcon } from './Icons';
import { useLanguage } from '../context/LanguageContext';

export default function Header({
  currentUser,
  currentView = 'home',
  onSwitchView,
  onOpenAuthModal,
  onLogout,
  onNavigate,
  onOpenChatbot,
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();

  const handleNavClick = (sectionId) => {
    setMobileMenuOpen(false);
    if (currentView !== 'home') {
      onSwitchView('home');
      setTimeout(() => {
        if (onNavigate) onNavigate(sectionId);
      }, 50);
    } else {
      if (onNavigate) onNavigate(sectionId);
    }
  };

  const handleDashboardClick = () => {
    setMobileMenuOpen(false);
    if (!currentUser) {
      onOpenAuthModal('login');
    } else {
      onSwitchView('dashboard');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      {/* Top Demo Notice Banner */}
      <div className="bg-gradient-to-r from-teal-700 via-teal-800 to-slate-900 text-teal-100 text-xs px-4 py-1.5 text-center font-medium flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-2 mx-auto">
          <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
          <span>{t('nav.demoBanner')}</span>
        </div>

        {/* Prominent Language Switch in Top Bar */}
        <div className="hidden sm:flex items-center gap-1 bg-white/10 px-2 py-0.5 rounded-md text-[11px] font-semibold text-white shrink-0">
          <button
            onClick={() => setLanguage('en')}
            className={`px-1.5 py-0.5 rounded transition-all cursor-pointer ${
              language === 'en' ? 'bg-white text-teal-900 font-bold shadow-xs' : 'text-teal-200 hover:text-white'
            }`}
            title="English"
          >
            EN
          </button>
          <span className="text-teal-400">|</span>
          <button
            onClick={() => setLanguage('hi')}
            className={`px-1.5 py-0.5 rounded transition-all cursor-pointer ${
              language === 'hi' ? 'bg-white text-teal-900 font-bold shadow-xs' : 'text-teal-200 hover:text-white'
            }`}
            title="हिन्दी"
          >
            हिन्दी
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Tagline */}
          <div className="flex items-center gap-3">
            <a
              href="#home"
              onClick={(e) => {
                e.preventDefault();
                handleNavClick('home');
              }}
              className="flex items-center gap-2.5 group"
            >
              <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-md shadow-teal-600/20 group-hover:bg-teal-700 transition-colors">
                <LogoIcon className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-teal-700 transition-colors">
                  Sehat<span className="text-teal-600">Setu</span>
                </span>
                <span className="text-[10px] uppercase tracking-wider font-semibold text-teal-700 -mt-1 hidden sm:block">
                  {t('nav.tagline')}
                </span>
              </div>
            </a>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-5 text-sm font-medium text-slate-600">
            <button
              onClick={() => handleNavClick('home')}
              className={`transition-colors cursor-pointer ${
                currentView === 'home' ? 'text-teal-600 font-semibold' : 'hover:text-teal-600'
              }`}
            >
              {t('nav.home')}
            </button>
            <button
              onClick={() => handleNavClick('discovery')}
              className="hover:text-teal-600 transition-colors cursor-pointer"
            >
              {t('nav.findDoctors')}
            </button>
            <button
              onClick={() => handleNavClick('discovery')}
              className="hover:text-teal-600 transition-colors cursor-pointer"
            >
              {t('nav.hospitals')}
            </button>
            <button
              onClick={() => handleNavClick('how-it-works')}
              className="hover:text-teal-600 transition-colors cursor-pointer"
            >
              {t('nav.howItWorks')}
            </button>
            <button
              onClick={handleDashboardClick}
              className={`transition-colors cursor-pointer flex items-center gap-1.5 ${
                currentView === 'dashboard' ? 'text-teal-600 font-bold' : 'hover:text-teal-600'
              }`}
            >
              <span>{t('nav.dashboard')}</span>
              {currentUser && (
                <span className="text-[10px] bg-teal-100 text-teal-800 font-bold px-1.5 py-0.2 rounded uppercase">
                  {currentUser.role}
                </span>
              )}
            </button>

            {/* AI Care Guide Entry Point in Nav */}
            <button
              type="button"
              onClick={onOpenChatbot}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 text-xs font-bold transition-all shadow-xs cursor-pointer group"
              title={t('chat.title')}
            >
              <SparklesIcon className="w-3.5 h-3.5 text-teal-600 group-hover:scale-110 transition-transform" />
              <span>{t('nav.aiGuide')}</span>
            </button>
          </nav>

          {/* Auth Actions (Login / Sign Up / Authenticated User Profile) + Mobile Lang */}
          <div className="hidden md:flex items-center gap-3">
            {currentUser ? (
              <div className="flex items-center gap-2.5">
                <button
                  onClick={handleDashboardClick}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs transition-all cursor-pointer ${
                    currentView === 'dashboard'
                      ? 'bg-teal-50 border-teal-300 ring-2 ring-teal-100'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                  }`}
                  title="Open Role Dashboard"
                >
                  <div className="w-6 h-6 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-[10px]">
                    {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="font-semibold text-slate-800 leading-tight">{currentUser.name}</span>
                    <span className="text-[10px] text-teal-700 capitalize font-medium">{currentUser.role} Dashboard</span>
                  </div>
                </button>

                <button
                  onClick={onLogout}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-2 rounded-lg transition-colors cursor-pointer"
                >
                  {t('nav.logout')}
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={() => onOpenAuthModal('login')}
                  className="text-sm font-semibold text-slate-700 hover:text-teal-600 px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
                >
                  {t('nav.login')}
                </button>
                <button
                  onClick={() => onOpenAuthModal('register')}
                  className="text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 px-4 py-2 rounded-lg shadow-sm shadow-teal-600/20 transition-all hover:shadow cursor-pointer flex items-center gap-1.5"
                >
                  <span>{t('nav.signup')}</span>
                </button>
              </>
            )}
          </div>

          {/* Mobile Right Controls: Language toggle & Hamburger */}
          <div className="flex md:hidden items-center gap-2">
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-semibold">
              <button
                onClick={() => setLanguage('en')}
                className={`px-2 py-1 rounded transition-all ${
                  language === 'en' ? 'bg-white text-teal-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLanguage('hi')}
                className={`px-2 py-1 rounded transition-all ${
                  language === 'hi' ? 'bg-white text-teal-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                हिन्दी
              </button>
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <XIcon className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white px-4 pt-3 pb-6 space-y-3 shadow-lg">
          <button
            onClick={() => handleNavClick('home')}
            className="block w-full text-left py-2 text-base font-medium text-slate-800 hover:text-teal-600"
          >
            {t('nav.home')}
          </button>
          <button
            onClick={() => handleNavClick('discovery')}
            className="block w-full text-left py-2 text-base font-medium text-slate-800 hover:text-teal-600"
          >
            {t('nav.findDoctors')}
          </button>
          <button
            onClick={() => handleNavClick('discovery')}
            className="block w-full text-left py-2 text-base font-medium text-slate-800 hover:text-teal-600"
          >
            {t('nav.hospitals')}
          </button>
          <button
            onClick={() => handleNavClick('how-it-works')}
            className="block w-full text-left py-2 text-base font-medium text-slate-800 hover:text-teal-600"
          >
            {t('nav.howItWorks')}
          </button>
          <button
            onClick={handleDashboardClick}
            className="block w-full text-left py-2 text-base font-medium text-slate-800 hover:text-teal-600"
          >
            {t('nav.dashboard')} {currentUser && `(${currentUser.role})`}
          </button>

          {/* AI Guide Mobile Entry */}
          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              if (onOpenChatbot) onOpenChatbot();
            }}
            className="flex items-center gap-2 w-full text-left py-2 text-teal-700 font-bold"
          >
            <SparklesIcon className="w-4 h-4 text-teal-600" />
            <span>{t('chat.title')}</span>
          </button>

          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
            {currentUser ? (
              <div className="space-y-2">
                <div className="p-3 bg-slate-50 rounded-xl flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-sm">
                    {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{currentUser.name}</p>
                    <p className="text-xs text-slate-500">{currentUser.email} • <span className="capitalize text-teal-700 font-medium">{currentUser.role}</span></p>
                  </div>
                </div>
                <button
                  onClick={() => { setMobileMenuOpen(false); onLogout(); }}
                  className="w-full text-center py-2.5 text-sm font-semibold text-rose-700 bg-rose-50 rounded-lg hover:bg-rose-100"
                >
                  {t('nav.logout')}
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={() => { setMobileMenuOpen(false); onOpenAuthModal('login'); }}
                  className="w-full text-center py-2.5 text-sm font-semibold text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200"
                >
                  {t('nav.login')}
                </button>
                <button
                  onClick={() => { setMobileMenuOpen(false); onOpenAuthModal('register'); }}
                  className="w-full text-center py-2.5 text-sm font-semibold text-white bg-teal-600 rounded-lg hover:bg-teal-700 shadow-sm"
                >
                  {t('nav.signup')}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
