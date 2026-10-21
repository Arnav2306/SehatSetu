import { useState, useEffect, useCallback } from 'react';
import {
  fetchDashboardData,
  fetchMyAppointments,
  cancelAppointment,
  fetchDoctorAppointments,
  completeAppointment,
  fetchMySchedule,
  updateMySchedule,
  fetchAdminProviders,
  updateProviderVerification,
  fetchMyReviews,
  submitReview,
  deleteMyReview,
  fetchAdminReviews,
  moderateReview,
} from '../config/api';
import {
  StethoscopeIcon,
  ShieldCheckIcon,
  CalendarIcon,
  ArrowRightIcon,
  ClockIcon,
  StarIcon,
  XIcon,
} from './Icons';
import { useLanguage } from '../context/LanguageContext';

export default function Dashboard({ currentUser, onBackToDiscovery, onLogout }) {
  const { t } = useLanguage();
  const [dashboardData, setDashboardData] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancelLoadingId, setCancelLoadingId] = useState(null);
  const [completeLoadingId, setCompleteLoadingId] = useState(null);

  // Patient reviews state
  const [patientReviews, setPatientReviews] = useState([]);
  const [reviewModalAppt, setReviewModalAppt] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewModalError, setReviewModalError] = useState(null);
  const [deleteReviewId, setDeleteReviewId] = useState(null);

  // Doctor schedule state
  const WEEK_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const [schedule, setSchedule] = useState({ days: [], startTime: '', endTime: '', slotDurationMinutes: 30 });
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleSaving, setScheduleSaving] = useState(false);
  const [scheduleError, setScheduleError] = useState(null);
  const [scheduleSuccess, setScheduleSuccess] = useState(null);

  // Admin providers state
  const [providers, setProviders] = useState([]);
  const [providerFilter, setProviderFilter] = useState({ type: 'all', status: 'all', page: 1 });
  const [providerPagination, setProviderPagination] = useState(null);
  const [providersLoading, setProvidersLoading] = useState(false);
  const [providersError, setProvidersError] = useState(null);
  const [verifyingId, setVerifyingId] = useState(null);

  // Admin reviews moderation state
  const [adminReviews, setAdminReviews] = useState([]);
  const [adminReviewFilter, setAdminReviewFilter] = useState('pending'); // 'pending' | 'approved' | 'rejected' | 'all'
  const [adminReviewPage, setAdminReviewPage] = useState(1);
  const [adminReviewPagination, setAdminReviewPagination] = useState(null);
  const [adminReviewsLoading, setAdminReviewsLoading] = useState(false);
  const [adminReviewsError, setAdminReviewsError] = useState(null);
  const [moderatingId, setModeratingId] = useState(null);

  const role = currentUser?.role || 'patient';

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      if (role === 'patient') {
        const [dash, appts, revs] = await Promise.all([
          fetchDashboardData('patient').catch(() => null),
          fetchMyAppointments().catch(() => []),
          fetchMyReviews().then((res) => res.data || []).catch(() => []),
        ]);
        setDashboardData(dash);
        setAppointments(appts);
        setPatientReviews(revs);
      } else if (role === 'doctor') {
        const [dash, appts] = await Promise.all([
          fetchDashboardData('doctor').catch(() => null),
          fetchDoctorAppointments().catch(() => []),
        ]);
        setDashboardData(dash);
        setAppointments(appts);
      } else if (role === 'admin') {
        const dash = await fetchDashboardData('admin');
        setDashboardData(dash);
      }
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [role]);

  // Load doctor schedule
  const loadSchedule = useCallback(async () => {
    if (role !== 'doctor') return;
    setScheduleLoading(true);
    setScheduleError(null);
    try {
      const data = await fetchMySchedule();
      if (data?.schedule) {
        setSchedule({
          days: data.schedule.days || [],
          startTime: data.schedule.startTime || '',
          endTime: data.schedule.endTime || '',
          slotDurationMinutes: data.schedule.slotDurationMinutes || 30,
        });
      }
    } catch (err) {
      setScheduleError(err.message || 'Could not load schedule.');
    } finally {
      setScheduleLoading(false);
    }
  }, [role]);

  // Load admin providers
  const loadProviders = useCallback(async () => {
    if (role !== 'admin') return;
    setProvidersLoading(true);
    setProvidersError(null);
    try {
      const result = await fetchAdminProviders(providerFilter);
      setProviders(result.data || []);
      setProviderPagination(result.pagination || null);
    } catch (err) {
      setProvidersError(err.message || 'Could not load providers.');
    } finally {
      setProvidersLoading(false);
    }
  }, [role, providerFilter]);

  // Load admin reviews
  const loadAdminReviews = useCallback(async () => {
    if (role !== 'admin') return;
    setAdminReviewsLoading(true);
    setAdminReviewsError(null);
    try {
      const result = await fetchAdminReviews({
        status: adminReviewFilter,
        page: adminReviewPage,
        limit: 15,
      });
      setAdminReviews(result.data || []);
      setAdminReviewPagination(result.pagination || null);
    } catch (err) {
      setAdminReviewsError(err.message || 'Could not load reviews for moderation.');
    } finally {
      setAdminReviewsLoading(false);
    }
  }, [role, adminReviewFilter, adminReviewPage]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    loadSchedule();
  }, [loadSchedule]);

  useEffect(() => {
    loadProviders();
  }, [loadProviders]);

  useEffect(() => {
    loadAdminReviews();
  }, [loadAdminReviews]);

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;

    setCancelLoadingId(id);
    try {
      await cancelAppointment(id);
      setAppointments((prev) =>
        prev.map((a) => ((a._id || a.id) === id ? { ...a, status: 'cancelled' } : a))
      );
    } catch (err) {
      alert(err.message || 'Failed to cancel appointment');
    } finally {
      setCancelLoadingId(null);
    }
  };

  const handleCompleteAppt = async (id) => {
    setCompleteLoadingId(id);
    try {
      await completeAppointment(id);
      setAppointments((prev) =>
        prev.map((a) => ((a._id || a.id) === id ? { ...a, status: 'completed' } : a))
      );
    } catch (err) {
      alert(err.message || 'Failed to mark appointment completed');
    } finally {
      setCompleteLoadingId(null);
    }
  };

  const handleOpenReviewModal = (appt) => {
    setReviewModalAppt(appt);
    setReviewRating(5);
    setReviewComment('');
    setReviewModalError(null);
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewModalAppt) return;

    if (!reviewComment.trim()) {
      setReviewModalError('Please enter a review comment.');
      return;
    }

    setReviewSubmitting(true);
    setReviewModalError(null);

    try {
      const created = await submitReview({
        appointmentId: reviewModalAppt._id || reviewModalAppt.id,
        rating: reviewRating,
        comment: reviewComment.trim(),
      });
      setPatientReviews((prev) => [created, ...prev]);
      setReviewModalAppt(null);
      alert('Your review has been submitted and is pending moderation.');
    } catch (err) {
      setReviewModalError(err.message || 'Failed to submit review');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;
    setDeleteReviewId(reviewId);
    try {
      await deleteMyReview(reviewId);
      setPatientReviews((prev) => prev.filter((r) => (r._id || r.id) !== reviewId));
    } catch (err) {
      alert(err.message || 'Failed to delete review');
    } finally {
      setDeleteReviewId(null);
    }
  };

  const handleModerateReview = async (id, status) => {
    setModeratingId(id);
    try {
      await moderateReview({ id, status });
      setAdminReviews((prev) =>
        adminReviewFilter === 'all'
          ? prev.map((r) => ((r._id || r.id) === id ? { ...r, status } : r))
          : prev.filter((r) => (r._id || r.id) !== id)
      );
    } catch (err) {
      alert(err.message || 'Failed to moderate review');
    } finally {
      setModeratingId(null);
    }
  };

  const handleScheduleSave = async (e) => {
    e.preventDefault();
    setScheduleSaving(true);
    setScheduleError(null);
    setScheduleSuccess(null);
    try {
      await updateMySchedule({
        days: schedule.days,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        slotDurationMinutes: Number(schedule.slotDurationMinutes),
      });
      setScheduleSuccess('Schedule updated successfully.');
    } catch (err) {
      setScheduleError(err.message || 'Failed to save schedule.');
    } finally {
      setScheduleSaving(false);
    }
  };

  const toggleDay = (day) => {
    setSchedule((prev) => ({
      ...prev,
      days: prev.days.includes(day) ? prev.days.filter((d) => d !== day) : [...prev.days, day],
    }));
    setScheduleSuccess(null);
  };

  const handleVerifyToggle = async (provider) => {
    const id = provider._id || provider.id;
    const newVal = !provider.isVerified;
    setVerifyingId(id);
    setProviders((prev) => prev.map((p) => ((p._id || p.id) === id ? { ...p, isVerified: newVal } : p)));
    try {
      await updateProviderVerification({ type: provider.providerType, id, isVerified: newVal });
    } catch (err) {
      setProviders((prev) => prev.map((p) => ((p._id || p.id) === id ? { ...p, isVerified: !newVal } : p)));
      alert(err.message || 'Failed to update verification.');
    } finally {
      setVerifyingId(null);
    }
  };

  const formatDateTime = (isoString) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString([], {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  const reviewedApptIds = new Set(
    patientReviews.map((r) => r.appointment?._id || r.appointment?.id || r.appointment)
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-teal-700 uppercase tracking-wider">
              {role === 'admin'
                ? t('dashboard.admin')
                : role === 'doctor'
                ? t('dashboard.doctor')
                : t('dashboard.patient')}
            </span>
            <span className="text-[10px] bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full font-semibold uppercase">
              {role}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            {t('dashboard.welcome')} {currentUser?.name || 'User'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Indore Healthcare Platform • Authenticated as {currentUser?.email}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onBackToDiscovery}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            ← {t('dashboard.backToDirectory')}
          </button>
          <button
            onClick={onLogout}
            className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            {t('nav.logout')}
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Profile Summary */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm self-start space-y-5">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
              {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">{currentUser?.name}</h2>
              <p className="text-xs text-slate-500">{currentUser?.email}</p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 space-y-3 text-xs">
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-500">Account Role:</span>
              <span className="font-semibold text-slate-800 capitalize bg-slate-100 px-2.5 py-0.5 rounded-md">
                {role}
              </span>
            </div>

            <div className="flex justify-between items-center py-1">
              <span className="text-slate-500">User ID:</span>
              <code className="text-[11px] bg-slate-100 px-2 py-0.5 rounded text-slate-700 truncate max-w-[150px]">
                {currentUser?.id || currentUser?._id || 'Standard'}
              </code>
            </div>

            <div className="flex justify-between items-center py-1">
              <span className="text-slate-500">Registered City:</span>
              <span className="font-medium text-slate-800">Indore, MP</span>
            </div>

            <div className="flex justify-between items-center py-1">
              <span className="text-slate-500">Verification:</span>
              <span className="text-emerald-700 font-semibold inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Active Account
              </span>
            </div>
          </div>
        </div>

        {/* Right Columns: Role-Specific Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Patient View */}
          {role === 'patient' && (
            <div className="space-y-6">
              {/* My Appointments Card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-7 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5 text-teal-600" />
                    <span>My Appointments</span>
                  </h3>
                  <span className="text-xs bg-slate-100 text-slate-600 font-medium px-2.5 py-0.5 rounded-full">
                    {appointments.length} Total
                  </span>
                </div>

                {loading && (
                  <div className="py-12 text-center text-xs text-slate-500">
                    Loading your appointments...
                  </div>
                )}

                {!loading && appointments.length === 0 && (
                  <div className="py-12 px-6 rounded-xl border border-dashed border-slate-200 bg-slate-50 text-center">
                    <div className="w-12 h-12 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-3">
                      <CalendarIcon className="w-6 h-6" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-800">No appointments yet</h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
                      You have not scheduled any doctor consultations. Browse verified providers across Indore to book your next visit.
                    </p>
                    <button
                      onClick={onBackToDiscovery}
                      className="mt-5 inline-flex items-center gap-1.5 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer"
                    >
                      <span>Find Doctors & Hospitals in Indore</span>
                      <ArrowRightIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {!loading && appointments.length > 0 && (
                  <div className="space-y-3">
                    {appointments.map((appt) => {
                      const apptId = appt._id || appt.id;
                      const isUpcoming = new Date(appt.slotStart) > new Date();
                      const isScheduled = appt.status === 'scheduled';
                      const isCompleted = appt.status === 'completed';
                      const canCancel = isUpcoming && isScheduled;
                      const hasReviewed = reviewedApptIds.has(apptId);

                      return (
                        <div
                          key={apptId}
                          className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 text-sm">
                                {appt.doctor?.name || 'Dr. Specialist'}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                                  appt.status === 'scheduled'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : appt.status === 'cancelled'
                                    ? 'bg-rose-100 text-rose-800'
                                    : 'bg-teal-100 text-teal-800'
                                }`}
                              >
                                {appt.status}
                              </span>
                            </div>

                            <p className="text-slate-500">
                              {appt.doctor?.specialty} • {appt.hospital?.name || appt.doctor?.locality || 'Indore'}
                            </p>

                            <div className="flex items-center gap-2 text-slate-700 font-medium pt-0.5">
                              <ClockIcon className="w-3.5 h-3.5 text-teal-600" />
                              <span>{formatDateTime(appt.slotStart)}</span>
                              <span className="text-slate-400">•</span>
                              <span className="font-bold text-slate-900">₹{appt.consultationFee} Fee</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {canCancel && (
                              <button
                                onClick={() => handleCancel(apptId)}
                                disabled={cancelLoadingId === apptId}
                                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold rounded-lg text-xs transition-colors cursor-pointer"
                              >
                                {cancelLoadingId === apptId ? 'Cancelling...' : 'Cancel Visit'}
                              </button>
                            )}

                            {isCompleted && !hasReviewed && (
                              <button
                                onClick={() => handleOpenReviewModal(appt)}
                                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-lg text-xs transition-colors flex items-center gap-1 cursor-pointer"
                              >
                                <StarIcon className="w-3 h-3" />
                                <span>Write Review</span>
                              </button>
                            )}

                            {isCompleted && hasReviewed && (
                              <span className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg text-[11px] font-semibold inline-flex items-center gap-1">
                                <StarIcon className="w-3 h-3 text-amber-500" />
                                <span>Reviewed</span>
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* My Reviews Card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-7 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <StarIcon className="w-5 h-5 text-amber-500" />
                    <span>My Reviews & Feedback</span>
                  </h3>
                  <span className="text-xs bg-slate-100 text-slate-600 font-medium px-2.5 py-0.5 rounded-full">
                    {patientReviews.length} Submitted
                  </span>
                </div>

                {patientReviews.length === 0 && (
                  <div className="py-8 px-6 rounded-xl border border-dashed border-slate-200 bg-slate-50 text-center">
                    <StarIcon className="w-6 h-6 text-slate-300 mx-auto mb-1.5" />
                    <p className="text-xs font-semibold text-slate-700">No reviews submitted yet</p>
                    <p className="text-[11px] text-slate-500 mt-0.5 max-w-sm mx-auto">
                      Completed appointments can be reviewed to help other patients in Indore discover trusted doctors and hospitals.
                    </p>
                  </div>
                )}

                {patientReviews.length > 0 && (
                  <div className="space-y-3">
                    {patientReviews.map((rev) => {
                      const revId = rev._id || rev.id;
                      return (
                        <div
                          key={revId}
                          className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 text-xs space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-bold text-slate-900 text-sm">
                                {rev.doctor?.name || 'Doctor'}
                              </span>
                              {rev.hospital?.name && (
                                <span className="text-slate-500 ml-2">({rev.hospital.name})</span>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                                  rev.status === 'approved'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : rev.status === 'rejected'
                                    ? 'bg-rose-100 text-rose-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {rev.status === 'pending' ? 'Pending Moderation' : rev.status}
                              </span>

                              <button
                                onClick={() => handleDeleteReview(revId)}
                                disabled={deleteReviewId === revId}
                                className="text-rose-600 hover:text-rose-800 text-[11px] font-semibold underline cursor-pointer"
                              >
                                {deleteReviewId === revId ? '...' : 'Delete'}
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 text-amber-500">
                            {Array.from({ length: rev.rating }).map((_, i) => (
                              <StarIcon key={i} className="w-3.5 h-3.5" />
                            ))}
                            <span className="text-slate-700 font-bold ml-1">{rev.rating}/5</span>
                          </div>

                          <p className="text-slate-700 leading-relaxed bg-white p-2.5 rounded-lg border border-slate-100">
                            "{rev.comment}"
                          </p>
                          <span className="text-[10px] text-slate-400 block">
                            Submitted on {formatDateTime(rev.createdAt)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Doctor View */}
          {role === 'doctor' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 p-7 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                      <StethoscopeIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">Patient Appointments</h3>
                      <p className="text-xs text-slate-500">Booked consultations roster</p>
                    </div>
                  </div>
                  <span className="text-xs bg-slate-100 text-slate-600 font-medium px-2.5 py-0.5 rounded-full">
                    {appointments.length} Consultations
                  </span>
                </div>

                {loading && (
                  <div className="py-12 text-center text-xs text-slate-500">
                    Loading scheduled consultations...
                  </div>
                )}

                {!loading && appointments.length === 0 && (
                  <div className="py-10 px-6 rounded-xl border border-dashed border-slate-200 bg-slate-50 text-center">
                    <ClockIcon className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <h4 className="text-xs font-bold text-slate-800">No patient appointments scheduled</h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      Appointments booked by patients will appear in this real-time roster.
                    </p>
                  </div>
                )}

                {!loading && appointments.length > 0 && (
                  <div className="space-y-2.5">
                    {appointments.map((appt) => {
                      const apptId = appt._id || appt.id;
                      return (
                        <div
                          key={apptId}
                          className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs gap-3"
                        >
                          <div>
                            <p className="font-bold text-slate-900">
                              Patient: {appt.patient?.name || 'Registered Patient'}
                            </p>
                            <p className="text-slate-500 text-[11px]">{appt.patient?.email}</p>
                            <p className="text-teal-800 font-medium mt-1">
                              {formatDateTime(appt.slotStart)}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                                appt.status === 'scheduled'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : appt.status === 'completed'
                                  ? 'bg-teal-100 text-teal-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {appt.status}
                            </span>

                            {appt.status === 'scheduled' && (
                              <button
                                onClick={() => handleCompleteAppt(apptId)}
                                disabled={completeLoadingId === apptId}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs transition-colors cursor-pointer"
                              >
                                {completeLoadingId === apptId ? '...' : 'Mark Completed'}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Schedule Editor */}
                <div className="mt-6 border-t border-slate-100 pt-6">
                  <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <ClockIcon className="w-4 h-4 text-teal-600" />
                    My Working Schedule
                  </h4>

                  {scheduleLoading && (
                    <p className="text-xs text-slate-500 py-4 text-center">Loading schedule...</p>
                  )}

                  {!scheduleLoading && (
                    <form onSubmit={handleScheduleSave} className="space-y-4">
                      {/* Days */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-2">Working Days</label>
                        <div className="flex flex-wrap gap-2">
                          {WEEK_DAYS.map((day) => (
                            <button
                              key={day}
                              type="button"
                              onClick={() => toggleDay(day)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                                schedule.days.includes(day)
                                  ? 'bg-teal-600 text-white border-teal-600'
                                  : 'bg-white text-slate-600 border-slate-300 hover:border-teal-400'
                              }`}
                            >
                              {day.slice(0, 3)}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Times */}
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="sched-start">Start Time</label>
                          <input
                            id="sched-start"
                            type="time"
                            value={schedule.startTime}
                            onChange={(e) => { setSchedule((p) => ({ ...p, startTime: e.target.value })); setScheduleSuccess(null); }}
                            className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="sched-end">End Time</label>
                          <input
                            id="sched-end"
                            type="time"
                            value={schedule.endTime}
                            onChange={(e) => { setSchedule((p) => ({ ...p, endTime: e.target.value })); setScheduleSuccess(null); }}
                            className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="sched-dur">Slot (min)</label>
                          <input
                            id="sched-dur"
                            type="number"
                            min="10"
                            max="120"
                            step="5"
                            value={schedule.slotDurationMinutes}
                            onChange={(e) => { setSchedule((p) => ({ ...p, slotDurationMinutes: e.target.value })); setScheduleSuccess(null); }}
                            className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                          />
                        </div>
                      </div>

                      {scheduleError && (
                        <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">{scheduleError}</p>
                      )}
                      {scheduleSuccess && (
                        <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">{scheduleSuccess}</p>
                      )}

                      <button
                        type="submit"
                        disabled={scheduleSaving}
                        className="px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                      >
                        {scheduleSaving ? 'Saving...' : 'Save Schedule'}
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Admin View */}
          {role === 'admin' && (
            <div className="space-y-6">
              {/* Provider Verification Overview */}
              <div className="bg-white rounded-2xl border border-slate-200 p-7 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                      <ShieldCheckIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">Provider Verification Overview</h3>
                      <p className="text-xs text-slate-500">Real-time database verification metrics</p>
                    </div>
                  </div>
                  <span className="text-xs bg-slate-100 text-slate-600 font-medium px-2.5 py-0.5 rounded-full">
                    Live Data
                  </span>
                </div>

                {loading && (
                  <div className="py-8 text-center text-xs text-slate-500">
                    Querying provider verification counts...
                  </div>
                )}

                {error && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                    <strong className="block mb-0.5">Database Statistics Offline:</strong>
                    {error} — Verification counts require an active MongoDB connection.
                  </div>
                )}

                {dashboardData?.verificationOverview && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80">
                      <span className="text-xs font-bold text-slate-800 block mb-2">Doctor Directory</span>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Verified Doctors:</span>
                          <span className="font-bold text-emerald-700">
                            {dashboardData.verificationOverview.doctors.verified}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Unverified Doctors:</span>
                          <span className="font-bold text-amber-700">
                            {dashboardData.verificationOverview.doctors.unverified}
                          </span>
                        </div>
                        <div className="flex justify-between pt-1 border-t border-slate-200">
                          <span className="text-slate-700 font-semibold">Total Registered:</span>
                          <span className="font-bold text-slate-900">
                            {dashboardData.verificationOverview.doctors.total}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80">
                      <span className="text-xs font-bold text-slate-800 block mb-2">Hospital Directory</span>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Verified Hospitals:</span>
                          <span className="font-bold text-emerald-700">
                            {dashboardData.verificationOverview.hospitals.verified}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Unverified Hospitals:</span>
                          <span className="font-bold text-amber-700">
                            {dashboardData.verificationOverview.hospitals.unverified}
                          </span>
                        </div>
                        <div className="flex justify-between pt-1 border-t border-slate-200">
                          <span className="text-slate-700 font-semibold">Total Registered:</span>
                          <span className="font-bold text-slate-900">
                            {dashboardData.verificationOverview.hospitals.total}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Provider Management */}
                <div className="mt-6 border-t border-slate-100 pt-6">
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <h4 className="text-sm font-bold text-slate-800 flex-1">Provider Management</h4>
                    <select
                      id="admin-filter-type"
                      value={providerFilter.type}
                      onChange={(e) => setProviderFilter((p) => ({ ...p, type: e.target.value, page: 1 }))}
                      className="border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="all">All Types</option>
                      <option value="doctor">Doctors</option>
                      <option value="hospital">Hospitals</option>
                    </select>
                    <select
                      id="admin-filter-status"
                      value={providerFilter.status}
                      onChange={(e) => setProviderFilter((p) => ({ ...p, status: e.target.value, page: 1 }))}
                      className="border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="all">All Status</option>
                      <option value="verified">Verified</option>
                      <option value="unverified">Unverified</option>
                    </select>
                  </div>

                  {providersLoading && (
                    <p className="text-xs text-slate-500 text-center py-6">Loading providers...</p>
                  )}
                  {providersError && (
                    <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2 mb-3">{providersError}</p>
                  )}

                  {!providersLoading && providers.length === 0 && (
                    <p className="text-xs text-slate-500 text-center py-6">No providers match the current filter.</p>
                  )}

                  {!providersLoading && providers.length > 0 && (
                    <div className="space-y-2.5">
                      {providers.map((prov) => {
                        const provId = prov._id || prov.id;
                        return (
                          <div
                            key={provId}
                            className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50/50 text-xs gap-3"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-slate-900 truncate">{prov.name}</p>
                              <p className="text-slate-500 truncate">
                                {prov.providerType === 'doctor' ? (prov.specialty || 'Doctor') : (prov.type || 'Hospital')}
                                {prov.locality ? ` • ${prov.locality}` : ''}
                              </p>
                            </div>
                            <span
                              className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                                prov.isVerified ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {prov.isVerified ? 'Verified' : 'Unverified'}
                            </span>
                            <button
                              onClick={() => handleVerifyToggle(prov)}
                              disabled={verifyingId === provId}
                              className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                                prov.isVerified
                                  ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              } disabled:opacity-60`}
                            >
                              {verifyingId === provId ? '...' : prov.isVerified ? 'Unverify' : 'Verify'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Pagination */}
                  {providerPagination && providerPagination.total > 0 && (
                    <div className="flex items-center justify-between mt-4 text-xs text-slate-600">
                      <span>Page {providerFilter.page} • {providerPagination.total} total</span>
                      <div className="flex gap-2">
                        <button
                          disabled={providerFilter.page <= 1}
                          onClick={() => setProviderFilter((p) => ({ ...p, page: p.page - 1 }))}
                          className="px-2.5 py-1 border border-slate-300 rounded-lg hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                        >
                          Prev
                        </button>
                        <button
                          disabled={providers.length < 20}
                          onClick={() => setProviderFilter((p) => ({ ...p, page: p.page + 1 }))}
                          className="px-2.5 py-1 border border-slate-300 rounded-lg hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Review Moderation Panel */}
              <div className="bg-white rounded-2xl border border-slate-200 p-7 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                      <StarIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">Patient Review Moderation</h3>
                      <p className="text-xs text-slate-500">Approve or reject submitted reviews</p>
                    </div>
                  </div>

                  <select
                    id="admin-filter-review-status"
                    value={adminReviewFilter}
                    onChange={(e) => {
                      setAdminReviewFilter(e.target.value);
                      setAdminReviewPage(1);
                    }}
                    className="border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                  >
                    <option value="pending">Pending Moderation</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="all">All Statuses</option>
                  </select>
                </div>

                {adminReviewsLoading && (
                  <p className="text-xs text-slate-500 text-center py-6">Loading reviews...</p>
                )}

                {adminReviewsError && (
                  <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2 mb-3">
                    {adminReviewsError}
                  </p>
                )}

                {!adminReviewsLoading && adminReviews.length === 0 && (
                  <p className="text-xs text-slate-500 text-center py-6">
                    No reviews match the current status filter "{adminReviewFilter}".
                  </p>
                )}

                {!adminReviewsLoading && adminReviews.length > 0 && (
                  <div className="space-y-3">
                    {adminReviews.map((r) => {
                      const rId = r._id || r.id;
                      return (
                        <div
                          key={rId}
                          className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 text-xs space-y-2.5"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <span className="font-bold text-slate-900 text-sm">
                                {r.patient?.name || 'Patient'}
                              </span>
                              <span className="text-slate-500 ml-1.5">({r.patient?.email})</span>
                              <span className="text-slate-400 mx-1.5">•</span>
                              <span className="font-medium text-teal-800">
                                {r.doctor?.name ? `Dr. ${r.doctor.name}` : r.hospital?.name || 'Healthcare Provider'}
                              </span>
                            </div>

                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase self-start sm:self-auto ${
                                r.status === 'approved'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : r.status === 'rejected'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {r.status}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 text-amber-500">
                            {Array.from({ length: r.rating }).map((_, i) => (
                              <StarIcon key={i} className="w-3.5 h-3.5" />
                            ))}
                            <span className="text-slate-800 font-bold ml-1">{r.rating}/5</span>
                          </div>

                          <p className="text-slate-700 bg-white p-3 rounded-xl border border-slate-200 leading-relaxed">
                            "{r.comment}"
                          </p>

                          <div className="flex items-center justify-between pt-1">
                            <span className="text-[10px] text-slate-400">
                              Submitted {formatDateTime(r.createdAt)}
                            </span>

                            <div className="flex gap-2">
                              {r.status !== 'approved' && (
                                <button
                                  onClick={() => handleModerateReview(rId, 'approved')}
                                  disabled={moderatingId === rId}
                                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                                >
                                  {moderatingId === rId ? '...' : 'Approve'}
                                </button>
                              )}
                              {r.status !== 'rejected' && (
                                <button
                                  onClick={() => handleModerateReview(rId, 'rejected')}
                                  disabled={moderatingId === rId}
                                  className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                                >
                                  {moderatingId === rId ? '...' : 'Reject'}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Moderation Pagination */}
                {adminReviewPagination && adminReviewPagination.total > 0 && (
                  <div className="flex items-center justify-between mt-4 text-xs text-slate-600">
                    <span>
                      Page {adminReviewPage} • {adminReviewPagination.total} reviews
                    </span>
                    <div className="flex gap-2">
                      <button
                        disabled={adminReviewPage <= 1}
                        onClick={() => setAdminReviewPage((p) => p - 1)}
                        className="px-2.5 py-1 border border-slate-300 rounded-lg hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                      >
                        Prev
                      </button>
                      <button
                        disabled={adminReviews.length < 15}
                        onClick={() => setAdminReviewPage((p) => p + 1)}
                        className="px-2.5 py-1 border border-slate-300 rounded-lg hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Review Submission Modal for Patient */}
      {reviewModalAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative animate-in fade-in duration-200">
            <button
              onClick={() => setReviewModalAppt(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
            >
              <XIcon className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <StarIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Review Consultation</h3>
                <p className="text-xs text-slate-500">
                  {reviewModalAppt.doctor?.name || 'Dr. Specialist'} • {reviewModalAppt.doctor?.specialty}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmitReview} className="space-y-4">
              {/* Star Rating Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Rating (1 to 5 Stars)
                </label>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        reviewRating >= star ? 'text-amber-500 hover:text-amber-600' : 'text-slate-300 hover:text-slate-400'
                      }`}
                    >
                      <StarIcon className="w-6 h-6 fill-current" />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-slate-800 ml-2">
                    {reviewRating} out of 5
                  </span>
                </div>
              </div>

              {/* Comment Text Area */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Your Review & Experience
                  </label>
                  <span className="text-[10px] text-slate-400">{reviewComment.length}/500</span>
                </div>
                <textarea
                  required
                  rows={4}
                  maxLength={500}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Share details about the consultation, communication, clinic experience..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:bg-white resize-none"
                ></textarea>
              </div>

              {reviewModalError && (
                <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-2.5">
                  {reviewModalError}
                </p>
              )}

              <p className="text-[11px] text-slate-400 leading-relaxed">
                All patient reviews are moderated by admins to prevent spam or abusive content before appearing publicly.
              </p>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setReviewModalAppt(null)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reviewSubmitting || !reviewComment.trim()}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
