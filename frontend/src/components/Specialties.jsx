import { SPECIALTIES } from '../data/demoData';
import { useLanguage } from '../context/LanguageContext';

export default function Specialties({ selectedSpecialty, onSelectSpecialty }) {
  const { t } = useLanguage();

  return (
    <section className="py-12 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8">
          <div>
            <span className="text-xs font-bold text-teal-700 uppercase tracking-wider">
              {t('specialties.tag')}
            </span>
            <h2 className="text-2xl font-bold text-slate-900 mt-1">
              {t('specialties.title')}
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1 sm:mt-0">
            {t('specialties.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {SPECIALTIES.map((spec) => {
            const isSelected = selectedSpecialty === spec.name;
            const displayName = t(`specialty.${spec.name}`, spec.name);
            return (
              <button
                key={spec.id}
                onClick={() => onSelectSpecialty(isSelected ? '' : spec.name)}
                className={`flex flex-col items-center text-center p-3.5 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-teal-600 text-white border-teal-600 shadow-md ring-2 ring-teal-200'
                    : 'bg-slate-50/70 hover:bg-teal-50/60 border-slate-200/80 text-slate-700 hover:border-teal-300'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xs mb-2 transition-colors ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-white text-teal-700 shadow-xs'
                  }`}
                >
                  {spec.name.slice(0, 2).toUpperCase()}
                </div>
                <span className="text-xs font-semibold leading-tight line-clamp-1">{displayName}</span>
                <span className={`text-[10px] mt-1 ${isSelected ? 'text-teal-100' : 'text-slate-500'}`}>
                  {spec.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
