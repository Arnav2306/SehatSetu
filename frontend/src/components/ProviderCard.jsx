import { StarIcon, MapPinIcon, StethoscopeIcon, HospitalIcon, ClockIcon, ShieldCheckIcon } from './Icons';
import { useLanguage } from '../context/LanguageContext';

export default function ProviderCard({ provider, onSelectAction }) {
  const { t } = useLanguage();
  const isDoctor = provider.type === 'doctor' || Boolean(provider.qualification);
  const hospitalName = provider.hospital?.name || provider.hospitalAffiliation || (isDoctor ? t('card.independentClinic') : '');
  const contactPhone = provider.emergencyPhone || provider.contactPhone || provider.phone || '';

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden relative group">
      {/* Top Banner Tag */}
      <div className="bg-slate-50 border-b border-slate-100 px-4 py-2 flex items-center justify-between text-xs">
        <span className="inline-flex items-center gap-1.5 font-medium text-slate-600">
          {isDoctor ? (
            <StethoscopeIcon className="w-3.5 h-3.5 text-teal-600" />
          ) : (
            <HospitalIcon className="w-3.5 h-3.5 text-teal-600" />
          )}
          <span>{isDoctor ? t('card.doctorProfile') : (provider.type || 'Hospital')}</span>
        </span>

        {/* Verification Status Badge */}
        {provider.isDemo ? (
          <span className="text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200/80 px-2 py-0.5 rounded-full">
            {t('card.demoListing')}
          </span>
        ) : provider.isVerified ? (
          <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/80 px-2 py-0.5 rounded-full">
            {t('card.verified')}
          </span>
        ) : (
          <span className="text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200/80 px-2 py-0.5 rounded-full">
            {t('card.unverified')}
          </span>
        )}
      </div>

      <div className="p-5 flex-1 flex flex-col">
        {/* Header Info */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div>
            <h3 className="text-base font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
              {provider.name}
            </h3>
            <p className="text-xs font-medium text-teal-700 mt-0.5">
              {isDoctor
                ? t(`specialty.${provider.specialty}`, provider.specialty)
                : (provider.category || provider.type || 'Healthcare Facility')}
            </p>
          </div>

          {/* Rating if present */}
          {provider.rating ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelectAction(provider, 'reviews');
              }}
              className="flex items-center gap-1 bg-amber-50 hover:bg-amber-100 text-amber-900 px-2 py-1 rounded-md text-xs font-bold border border-amber-200/60 shrink-0 cursor-pointer transition-colors"
              title={t('card.reviews')}
            >
              <StarIcon className="w-3.5 h-3.5 text-amber-500" />
              <span>{provider.rating}</span>
              {provider.reviewCount ? (
                <span className="text-[10px] text-amber-700 font-normal">({provider.reviewCount})</span>
              ) : null}
            </button>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelectAction(provider, 'reviews');
              }}
              className="text-[10px] font-medium text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-md shrink-0 cursor-pointer transition-colors"
              title={t('card.reviews')}
            >
              {t('card.reviews')}
            </button>
          )}
        </div>

        {/* Doctor or Hospital Specific Details */}
        {isDoctor ? (
          <div className="space-y-2 mt-2 text-xs text-slate-600 flex-1">
            <p className="text-slate-500 font-normal">{provider.qualification}</p>

            {provider.experienceYears !== undefined && (
              <div className="flex items-center gap-1.5 text-slate-700">
                <span className="font-semibold text-slate-900">{provider.experienceYears}+</span>
                <span>{t('card.yearsExp')}</span>
              </div>
            )}

            {hospitalName && (
              <div className="flex items-center gap-1.5 text-slate-600">
                <HospitalIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{hospitalName}</span>
              </div>
            )}

            <div className="flex items-center gap-1.5 text-slate-600">
              <MapPinIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{provider.locality}, {provider.city || 'Indore'}</span>
            </div>

            {(provider.operatingHours || provider.availability) && (
              <div className="mt-3 bg-teal-50/60 rounded-lg p-2.5 border border-teal-100/80 flex items-center gap-2">
                <ClockIcon className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                <span className="text-[11px] text-teal-900 font-medium">
                  {provider.operatingHours || provider.availability}
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2.5 mt-2 text-xs text-slate-600 flex-1">
            {provider.accreditation && (
              <div className="flex items-center gap-1.5 text-slate-700">
                <ShieldCheckIcon className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                <span className="font-semibold text-slate-900">{provider.accreditation}</span>
                {provider.bedCount && <span>• {provider.bedCount}</span>}
              </div>
            )}

            <div className="flex items-center gap-1.5 text-slate-600">
              <MapPinIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{provider.locality}, {provider.city || 'Indore'}</span>
            </div>

            {provider.specialties?.length > 0 && (
              <div>
                <span className="text-[11px] text-slate-400 block mb-1">{t('card.keyDepartments')}</span>
                <div className="flex flex-wrap gap-1.5">
                  {provider.specialties.map((s) => (
                    <span
                      key={s}
                      className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium"
                    >
                      {t(`specialty.${s}`, s)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {provider.emergencyPhone && (
              <div className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-1 rounded border border-rose-100">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
                <span>{t('card.emergency')} {provider.emergencyPhone}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Card Footer / Action */}
      <div className="p-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-3">
        <div>
          {isDoctor ? (
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">{t('card.consultationFee')}</span>
              <span className="text-sm font-bold text-slate-900">₹{provider.consultationFee ?? 0}</span>
              {provider.isDemo && <span className="text-[10px] text-slate-400 ml-1">({t('card.demoListing')})</span>}
            </div>
          ) : (
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">{t('card.contact')}</span>
              <span className="text-xs font-bold text-slate-800">{contactPhone || 'Available on request'}</span>
            </div>
          )}
        </div>

        <button
          onClick={() => onSelectAction(provider)}
          className={`text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-xs cursor-pointer ${
            isDoctor
              ? 'bg-teal-600 hover:bg-teal-700 text-white shadow-teal-600/10'
              : 'bg-slate-900 hover:bg-slate-800 text-white'
          }`}
        >
          {isDoctor ? t('card.bookVisit') : t('card.viewFacility')}
        </button>
      </div>
    </div>
  );
}
