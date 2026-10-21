import { SearchIcon, MapPinIcon, ShieldCheckIcon, ClockIcon, StethoscopeIcon } from './Icons';
import { INDORE_LOCALITIES } from '../data/demoData';
import { useLanguage } from '../context/LanguageContext';

export default function Hero({
  searchQuery,
  setSearchQuery,
  selectedLocality,
  setSelectedLocality,
  onSearchSubmit,
  onQuickSpecialtySelect,
}) {
  const { t } = useLanguage();
  const quickTags = ['Cardiology', 'Pediatrics', 'Orthopedics', 'Dermatology', 'General Medicine'];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSearchSubmit) onSearchSubmit();
  };

  return (
    <section id="home" className="relative bg-gradient-to-b from-teal-50/70 via-white to-slate-50 pt-10 pb-16 sm:pt-16 sm:pb-24 border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-100/80 border border-teal-200 text-teal-800 text-xs font-semibold uppercase tracking-wider mb-5">
            <span className="w-2 h-2 rounded-full bg-teal-600"></span>
            {t('hero.badge')}
          </div>

          {/* Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.15]">
            {t('hero.titlePart1')}{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-emerald-600">
              {t('hero.titlePart2')}
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-4 sm:mt-6 text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
            {t('hero.subtitle')}
          </p>

          {/* Prominent Search Box */}
          <div className="mt-8 sm:mt-10">
            <form
              onSubmit={handleSubmit}
              className="bg-white p-3 sm:p-3.5 rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-200/90 flex flex-col md:flex-row items-stretch gap-2.5 text-left"
            >
              {/* Doctor / Specialty search */}
              <div className="flex-1 flex items-center px-3.5 py-2.5 bg-slate-50/70 rounded-xl border border-slate-200/60 focus-within:border-teal-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-teal-100 transition-all">
                <SearchIcon className="w-5 h-5 text-teal-600 shrink-0 mr-3" />
                <input
                  type="text"
                  placeholder={t('hero.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
                />
              </div>

              {/* Indore Locality Selector */}
              <div className="md:w-60 flex items-center px-3.5 py-2.5 bg-slate-50/70 rounded-xl border border-slate-200/60 focus-within:border-teal-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-teal-100 transition-all">
                <MapPinIcon className="w-5 h-5 text-teal-600 shrink-0 mr-2.5" />
                <select
                  value={selectedLocality}
                  onChange={(e) => setSelectedLocality(e.target.value)}
                  className="w-full bg-transparent text-sm text-slate-700 font-medium focus:outline-none cursor-pointer"
                >
                  {INDORE_LOCALITIES.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc === 'All Localities' ? t('hero.allLocalities') : `${loc}, Indore`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                className="bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm px-7 py-3 rounded-xl transition-all shadow-md shadow-teal-600/20 hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <SearchIcon className="w-4 h-4" />
                <span>{t('hero.searchButton')}</span>
              </button>
            </form>

            {/* Quick Specialty Pill Filters */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500">
              <span className="font-medium text-slate-600">{t('hero.popular')}</span>
              {quickTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => onQuickSpecialtySelect(tag)}
                  className="bg-white hover:bg-teal-50 text-slate-700 hover:text-teal-700 px-3 py-1 rounded-full border border-slate-200 hover:border-teal-300 transition-all font-medium cursor-pointer"
                >
                  {t(`specialty.${tag}`, tag)}
                </button>
              ))}
            </div>
          </div>

          {/* Trust Highlights */}
          <div className="mt-12 pt-8 border-t border-slate-200/70 grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
            <div className="flex items-center gap-3.5 bg-white/70 p-3.5 rounded-xl border border-slate-100">
              <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
                <ShieldCheckIcon className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">{t('hero.medicalHubs')}</h2>
                <p className="text-xs text-slate-500">{t('hero.medicalHubsDesc')}</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 bg-white/70 p-3.5 rounded-xl border border-slate-100">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                <StethoscopeIcon className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">{t('hero.expertSpecialists')}</h2>
                <p className="text-xs text-slate-500">{t('hero.expertSpecialistsDesc')}</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 bg-white/70 p-3.5 rounded-xl border border-slate-100">
              <div className="w-10 h-10 rounded-lg bg-cyan-50 text-cyan-700 flex items-center justify-center shrink-0">
                <ClockIcon className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">{t('hero.localAvailability')}</h2>
                <p className="text-xs text-slate-500">{t('hero.localAvailabilityDesc')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
