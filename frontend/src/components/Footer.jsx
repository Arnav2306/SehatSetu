import { LogoIcon, MapPinIcon } from './Icons';
import { useLanguage } from '../context/LanguageContext';

export default function Footer({ apiHealth, onNavigate }) {
  const { t } = useLanguage();

  return (
    <footer id="about" className="bg-slate-900 text-slate-300 pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-slate-800">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-teal-500 text-white flex items-center justify-center shadow-md shadow-teal-500/20">
                <LogoIcon className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                Sehat<span className="text-teal-400">Setu</span>
              </span>
            </div>

            <p className="text-xs uppercase font-semibold tracking-wider text-teal-400">
              {t('nav.tagline')}
            </p>

            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-md">
              {t('footer.tagline')}
            </p>

            <div className="flex items-center gap-2 text-xs text-slate-400 pt-1">
              <MapPinIcon className="w-4 h-4 text-teal-400 shrink-0" />
              <span>Headquartered in Indore, Madhya Pradesh (PIN 452001)</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
              {t('footer.directory')}
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li>
                <button
                  onClick={() => onNavigate('discovery')}
                  className="hover:text-teal-400 transition-colors cursor-pointer"
                >
                  {t('footer.allDoctors')}
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('discovery')}
                  className="hover:text-teal-400 transition-colors cursor-pointer"
                >
                  {t('footer.hospitalsClinics')}
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('discovery')}
                  className="hover:text-teal-400 transition-colors cursor-pointer"
                >
                  {t('footer.emergencyCare')}
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('discovery')}
                  className="hover:text-teal-400 transition-colors cursor-pointer"
                >
                  {t('footer.quickSpecialties')}
                </button>
              </li>
            </ul>
          </div>

          {/* System & Architecture Status */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
              {t('footer.apiStatus')}
            </h4>
            <div className="bg-slate-800/80 rounded-xl p-3.5 border border-slate-700/80 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Platform:</span>
                <span className="text-teal-300 font-semibold">SehatSetu MERN</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Backend API:</span>
                {apiHealth ? (
                  <span className="inline-flex items-center gap-1 text-emerald-400 font-medium text-[11px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    {t('footer.operational')}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-amber-400 font-medium text-[11px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                    {t('footer.connecting')}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Region:</span>
                <span className="text-slate-300 font-medium">Indore, MP</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Disclaimer */}
        <div className="mt-8 pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500 text-center sm:text-left">
          <p>
            © {new Date().getFullYear()} SehatSetu. {t('footer.rights')}
          </p>
          <div className="flex items-center gap-4">
            <span className="text-teal-400">Healthcare Bridge</span>
            <span>•</span>
            <span>Indore, India</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
