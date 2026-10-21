import { useState, useEffect } from 'react';
import {
  XIcon,
  CheckCircleIcon,
  StethoscopeIcon,
  HospitalIcon,
  ClockIcon,
  CalendarIcon,
  StarIcon,
} from './Icons';
import { fetchDoctorSlots, bookAppointment, fetchProviderReviews } from '../config/api';
import { useLanguage } from '../context/LanguageContext';

export default function BookingModal({
  modalData,
  currentUser,
  onClose,
  onOpenAuthModal,
  onBookingSuccess,
}) {
  const { t } = useLanguage();
  const isAuthNotice = modalData?.type === 'auth';
  const provider = modalData?.provider;
  const isDoctor = provider?.type === 'doctor' || Boolean(provider?.qualification);

  // Today's date formatted as YYYY-MM-DD in local time
  const getTodayDateString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Tab state for switching between Booking/Details and Patient Reviews
  const [activeTab, setActiveTab] = useState(modalData?.initialTab || 'action'); // 'action' | 'reviews'

  // Reviews state
  const [reviewsData, setReviewsData] = useState(null);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState(null);
  const [reviewsPage, setReviewsPage] = useState(1);

  const [selectedDate, setSelectedDate] = useState(getTodayDateString());
  const [slots, setSlots] = useState([]);
  const [slotsMessage, setSlotsMessage] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [notes, setNotes] = useState('');
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [error, setError] = useState(null);
  const [bookingDone, setBookingDone] = useState(false);
  const [confirmedAppt, setConfirmedAppt] = useState(null);

  // Reset tab on modal change
  useEffect(() => {
    setActiveTab(modalData?.initialTab || 'action');
    setReviewsPage(1);
  }, [modalData]);

  // Load reviews when provider changes or tab is reviews
  useEffect(() => {
    if (!provider || !provider._id || isAuthNotice) {
      setReviewsData(null);
      return;
    }

    let isMounted = true;
    setReviewsLoading(true);
    setReviewsError(null);

    const query = isDoctor
      ? { doctorId: provider._id, page: reviewsPage, limit: 5 }
      : { hospitalId: provider._id, page: reviewsPage, limit: 5 };

    fetchProviderReviews(query)
      .then((res) => {
        if (!isMounted) return;
        setReviewsData(res.data || null);
        setReviewsLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        setReviewsError(err.message || 'Could not load approved reviews.');
        setReviewsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [provider, isDoctor, isAuthNotice, reviewsPage]);

  // Load slots when date or provider changes
  useEffect(() => {
    if (!provider || !isDoctor || !provider._id) {
      setSlots([]);
      setSlotsMessage(
        provider?.isDemo
          ? 'This is a simulated demo profile. Real-time booking requires live doctors with configured operating schedules.'
          : ''
      );
      return;
    }

    let isMounted = true;
    setLoadingSlots(true);
    setError(null);
    setSelectedSlot(null);

    fetchDoctorSlots({ doctorId: provider._id, date: selectedDate })
      .then((res) => {
        if (!isMounted) return;
        setSlots(res.data || []);
        setSlotsMessage(res.message || '');
        setLoadingSlots(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || 'Failed to query doctor appointment slots.');
        setSlots([]);
        setLoadingSlots(false);
      });

    return () => {
      isMounted = false;
    };
  }, [provider, isDoctor, selectedDate]);

  if (!modalData) return null;

  const handleConfirmBooking = async (e) => {
    e.preventDefault();
    if (!selectedSlot) return;

    setBookingLoading(true);
    setError(null);

    try {
      const appt = await bookAppointment({
        doctorId: provider._id,
        slotStart: selectedSlot.slotStart,
        slotEnd: selectedSlot.slotEnd,
        notes,
      });

      setBookingDone(true);
      setConfirmedAppt(appt);
      if (onBookingSuccess) onBookingSuccess(appt);
    } catch (err) {
      setError(err.message || 'Booking failed. Please try another slot.');
    } finally {
      setBookingLoading(false);
    }
  };

  const formatLocalTime = (isoString) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return isoString;
    }
  };

  const formatDate = (isoString) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return isoString;
    }
  };

  const summary = reviewsData?.summary || { averageRating: 0, totalReviews: 0, ratingDistribution: {} };
  const reviews = reviewsData?.reviews || [];
  const pagination = reviewsData?.pagination || null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 relative animate-in fade-in duration-200 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Close dialog"
        >
          <XIcon className="w-5 h-5" />
        </button>

        {/* 1. Auth Notice Modal */}
        {isAuthNotice && (
          <div>
            <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mb-4">
              <CheckCircleIcon className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">{modalData.action}</h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
              Sign in with your patient account to book consultation slots, view active appointments, and manage healthcare records in Indore.
            </p>
            <button
              onClick={() => {
                onClose();
                onOpenAuthModal(modalData.action === 'Sign Up' ? 'register' : 'login');
              }}
              className="mt-6 w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs rounded-xl shadow-xs cursor-pointer"
            >
              Continue to {modalData.action}
            </button>
          </div>
        )}

        {/* Provider Tabs (When inspecting provider) */}
        {!isAuthNotice && provider && (
          <div className="flex border-b border-slate-200 mb-5">
            <button
              onClick={() => setActiveTab('action')}
              className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                activeTab === 'action'
                  ? 'border-teal-600 text-teal-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {isDoctor ? t('card.bookVisit') : t('card.viewFacility')}
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'reviews'
                  ? 'border-teal-600 text-teal-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <StarIcon className="w-3.5 h-3.5 text-amber-500" />
              <span>{t('card.reviews')}</span>
              {summary.totalReviews > 0 && (
                <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded-full">
                  {summary.totalReviews}
                </span>
              )}
            </button>
          </div>
        )}

        {/* REVIEWS TAB VIEW */}
        {!isAuthNotice && activeTab === 'reviews' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h4 className="text-sm font-bold text-slate-900">{provider?.name} Reviews</h4>
                <p className="text-xs text-slate-500">Verified patient ratings from completed visits</p>
              </div>

              {summary.totalReviews > 0 ? (
                <div className="flex items-center gap-1.5 bg-amber-50 text-amber-950 px-3 py-1.5 rounded-xl border border-amber-200">
                  <StarIcon className="w-4 h-4 text-amber-500" />
                  <span className="font-extrabold text-sm">{summary.averageRating.toFixed(1)}</span>
                  <span className="text-[11px] text-amber-800 font-normal">/ 5.0</span>
                </div>
              ) : null}
            </div>

            {reviewsLoading && (
              <div className="py-8 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></span>
                <span>Loading approved reviews...</span>
              </div>
            )}

            {reviewsError && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                {reviewsError}
              </div>
            )}

            {!reviewsLoading && !reviewsError && summary.totalReviews === 0 && (
              <div className="py-8 px-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center">
                <StarIcon className="w-7 h-7 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-800">No approved reviews yet</p>
                <p className="text-[11px] text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
                  Only authenticated patients who completed verified appointments can submit reviews. New submissions appear after admin moderation.
                </p>
              </div>
            )}

            {!reviewsLoading && !reviewsError && reviews.length > 0 && (
              <div className="space-y-3">
                {/* Rating Distribution summary if multiple reviews */}
                {summary.totalReviews > 1 && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs">
                    <span className="font-semibold text-slate-700 block mb-2">Rating Distribution:</span>
                    <div className="space-y-1">
                      {[5, 4, 3, 2, 1].map((stars) => {
                        const count = summary.ratingDistribution?.[stars] || 0;
                        const pct = summary.totalReviews > 0 ? (count / summary.totalReviews) * 100 : 0;
                        return (
                          <div key={stars} className="flex items-center gap-2 text-[11px]">
                            <span className="w-6 text-slate-600 font-medium">{stars} ★</span>
                            <div className="flex-1 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="bg-amber-400 h-1.5 rounded-full"
                                style={{ width: `${pct}%` }}
                              ></div>
                            </div>
                            <span className="w-5 text-slate-400 text-right">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Reviews List */}
                <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                  {reviews.map((r) => (
                    <div
                      key={r.id || r._id}
                      className="p-3 bg-slate-50/70 border border-slate-200 rounded-xl text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{r.patientName}</span>
                        <div className="flex items-center gap-1 text-amber-500">
                          {Array.from({ length: r.rating }).map((_, i) => (
                            <StarIcon key={i} className="w-3.5 h-3.5" />
                          ))}
                        </div>
                      </div>
                      <p className="text-slate-700 text-xs leading-relaxed">{r.comment}</p>
                      <span className="text-[10px] text-slate-400 block">{formatDate(r.createdAt)}</span>
                    </div>
                  ))}
                </div>

                {/* Reviews Pagination */}
                {pagination && pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
                    <span>
                      Page {reviewsPage} of {pagination.totalPages}
                    </span>
                    <div className="flex gap-2">
                      <button
                        disabled={reviewsPage <= 1}
                        onClick={() => setReviewsPage((p) => p - 1)}
                        className="px-2.5 py-1 border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                      >
                        Prev
                      </button>
                      <button
                        disabled={reviewsPage >= pagination.totalPages}
                        onClick={() => setReviewsPage((p) => p + 1)}
                        className="px-2.5 py-1 border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 2. Hospital Details Modal (Action tab) */}
        {!isAuthNotice && !isDoctor && activeTab === 'action' && (
          <div>
            <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mb-4">
              <HospitalIcon className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">{provider?.name}</h3>
            <p className="text-xs text-teal-700 font-medium">
              {provider?.category || provider?.type || 'Hospital'} • {provider?.locality}, Indore
            </p>

            <div className="my-4 p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs text-slate-600 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Accreditation:</span>
                <span className="font-semibold text-slate-900">{provider?.accreditation || 'NABH Certified'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Contact / Emergency:</span>
                <span className="font-medium text-slate-900">{provider?.phone || provider?.contactPhone || 'Available on request'}</span>
              </div>
              {provider?.specialties?.length > 0 && (
                <div className="pt-2">
                  <span className="text-slate-500 block mb-1">Key Departments:</span>
                  <div className="flex flex-wrap gap-1">
                    {provider.specialties.map((s) => (
                      <span key={s} className="bg-slate-200/80 text-slate-700 px-2 py-0.5 rounded text-[10px]">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              To book a consultation at this facility, browse and select an individual specialist doctor affiliated with this center.
            </p>

            <button
              onClick={onClose}
              className="mt-5 w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs rounded-xl shadow-xs cursor-pointer"
            >
              Close
            </button>
          </div>
        )}

        {/* 3. Doctor Appointment Booking Modal (Action tab) */}
        {!isAuthNotice && isDoctor && activeTab === 'action' && (
          <div>
            {bookingDone ? (
              <div className="text-center py-4">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                  <CheckCircleIcon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Appointment Confirmed!</h3>
                <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto">
                  Your appointment with <strong>{provider.name}</strong> has been successfully booked.
                </p>

                <div className="my-5 p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl text-left text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Date:</span>
                    <span className="font-semibold text-slate-900">{selectedDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Time:</span>
                    <span className="font-semibold text-emerald-800">
                      {formatLocalTime(confirmedAppt?.slotStart)} - {formatLocalTime(confirmedAppt?.slotEnd)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Consultation Fee:</span>
                    <span className="font-bold text-slate-900">₹{confirmedAppt?.consultationFee ?? provider.consultationFee}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Status:</span>
                    <span className="capitalize font-semibold text-emerald-700">Scheduled</span>
                  </div>
                </div>

                <button
                  onClick={onClose}
                  className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs rounded-xl shadow-xs cursor-pointer"
                >
                  Close & View Appointments
                </button>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                    <StethoscopeIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{provider.name}</h3>
                    <p className="text-xs text-teal-700 font-medium">
                      {provider.specialty} • {provider.locality}, Indore
                    </p>
                  </div>
                </div>

                {/* Consultation Fee Badge */}
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200/80 mb-4 text-xs">
                  <span className="text-slate-600">Consultation Fee Snapshot:</span>
                  <span className="text-sm font-bold text-slate-900">
                    ₹{provider.consultationFee ?? 0}
                    {provider.isDemo && <span className="text-[10px] text-slate-400 font-normal ml-1">(Demo)</span>}
                  </span>
                </div>

                {/* Unauthenticated notice */}
                {!currentUser ? (
                  <div className="py-6 px-4 bg-teal-50/70 border border-teal-200 rounded-xl text-center">
                    <CalendarIcon className="w-8 h-8 text-teal-600 mx-auto mb-2" />
                    <h4 className="text-xs font-bold text-slate-900">Sign in to Book Consultation</h4>
                    <p className="text-xs text-slate-600 mt-1 max-w-xs mx-auto leading-relaxed">
                      Please log in with your patient account to select available consultation slots and confirm your visit.
                    </p>
                    <button
                      onClick={() => {
                        onClose();
                        onOpenAuthModal('login');
                      }}
                      className="mt-4 px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl shadow-sm cursor-pointer"
                    >
                      Log in to Book
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleConfirmBooking} className="space-y-4">
                    {/* Date Picker */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Select Consultation Date
                      </label>
                      <input
                        type="date"
                        min={getTodayDateString()}
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-100 transition-all cursor-pointer"
                      />
                    </div>

                    {/* Slots Area */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-semibold text-slate-700">
                          Available Time Slots
                        </label>
                        <span className="text-[10px] text-slate-400">Indore Local Time</span>
                      </div>

                      {loadingSlots && (
                        <div className="py-6 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                          <span className="w-3.5 h-3.5 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></span>
                          <span>Loading available slots...</span>
                        </div>
                      )}

                      {!loadingSlots && error && (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                          {error}
                        </div>
                      )}

                      {!loadingSlots && !error && slots.length === 0 && (
                        <div className="py-6 px-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center">
                          <ClockIcon className="w-6 h-6 text-slate-400 mx-auto mb-1.5" />
                          <p className="text-xs text-slate-600 font-medium">
                            {slotsMessage || 'No available slots found for this date.'}
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Schedules are strictly generated from configured doctor operating hours.
                          </p>
                        </div>
                      )}

                      {!loadingSlots && slots.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-1">
                          {slots.map((slot) => {
                            const isSelected = selectedSlot?.slotStart === slot.slotStart;
                            return (
                              <button
                                key={slot.slotStart}
                                type="button"
                                onClick={() => setSelectedSlot(slot)}
                                className={`py-2 px-2.5 rounded-xl text-xs font-medium border text-center transition-all cursor-pointer ${
                                  isSelected
                                    ? 'bg-teal-600 text-white border-teal-600 shadow-sm ring-2 ring-teal-200'
                                    : 'bg-white hover:bg-teal-50/70 border-slate-200 text-slate-700'
                                }`}
                              >
                                {formatLocalTime(slot.slotStart)}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Optional Notes */}
                    {selectedSlot && (
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Reason for Visit / Notes (Optional)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. General checkup, routine consultation"
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:bg-white"
                        />
                      </div>
                    )}

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={!selectedSlot || bookingLoading}
                      className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      {bookingLoading ? (
                        <>
                          <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                          <span>Reserving slot...</span>
                        </>
                      ) : (
                        'Confirm Appointment'
                      )}
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
