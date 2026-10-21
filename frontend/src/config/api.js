export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export const checkHealth = async () => {
  const response = await fetch(`${API_BASE_URL}/api/health`);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
};

export const fetchDoctors = async ({ search = '', locality = '', specialty = '', page = 1, limit = 20 } = {}) => {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (locality && locality !== 'All Localities') params.append('locality', locality);
  if (specialty) params.append('specialty', specialty);
  if (page) params.append('page', page);
  if (limit) params.append('limit', limit);

  const response = await fetch(`${API_BASE_URL}/api/doctors?${params.toString()}`);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || `Failed to fetch doctors: ${response.status}`);
    error.code = data.code || `HTTP_${response.status}`;
    error.status = response.status;
    throw error;
  }

  return data;
};

export const fetchHospitals = async ({ search = '', locality = '', specialty = '', type = '', page = 1, limit = 20 } = {}) => {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (locality && locality !== 'All Localities') params.append('locality', locality);
  if (specialty) params.append('specialty', specialty);
  if (type) params.append('type', type);
  if (page) params.append('page', page);
  if (limit) params.append('limit', limit);

  const response = await fetch(`${API_BASE_URL}/api/hospitals?${params.toString()}`);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || `Failed to fetch hospitals: ${response.status}`);
    error.code = data.code || `HTTP_${response.status}`;
    error.status = response.status;
    throw error;
  }

  return data;
};

// Auth API client calls
export const registerUser = async ({ name, email, password }) => {
  const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ name, email, password }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || 'Registration failed');
  }
  return data.data;
};

export const loginUser = async ({ email, password }) => {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || 'Login failed');
  }
  return data.data;
};

export const logoutUser = async () => {
  const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || 'Logout failed');
  }
  return data;
};

export const fetchMe = async () => {
  const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    return null;
  }

  const data = await response.json().catch(() => ({}));
  return data.data || null;
};

// Dashboard API client calls
export const fetchDashboardData = async (role) => {
  const endpoint = role === 'admin' ? 'admin' : role === 'doctor' ? 'doctor' : 'patient';
  const response = await fetch(`${API_BASE_URL}/api/dashboard/${endpoint}`, {
    method: 'GET',
    credentials: 'include',
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || `Failed to fetch dashboard: ${response.status}`);
    error.status = response.status;
    error.code = data.code;
    throw error;
  }

  return data.data;
};

// Appointment API client calls
export const fetchDoctorSlots = async ({ doctorId, date }) => {
  const params = new URLSearchParams({ doctorId, date });
  const response = await fetch(`${API_BASE_URL}/api/appointments/slots?${params.toString()}`, {
    method: 'GET',
    credentials: 'include',
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || 'Failed to fetch doctor appointment slots');
    error.status = response.status;
    error.code = data.code;
    throw error;
  }
  return data;
};

export const bookAppointment = async ({ doctorId, slotStart, slotEnd, notes }) => {
  const response = await fetch(`${API_BASE_URL}/api/appointments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ doctorId, slotStart, slotEnd, notes }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || 'Appointment booking failed');
    error.status = response.status;
    error.code = data.code;
    throw error;
  }
  return data.data;
};

export const fetchMyAppointments = async () => {
  const response = await fetch(`${API_BASE_URL}/api/appointments/my`, {
    method: 'GET',
    credentials: 'include',
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || 'Failed to fetch appointments');
    error.status = response.status;
    error.code = data.code;
    throw error;
  }
  return data.data || [];
};

export const cancelAppointment = async (appointmentId) => {
  const response = await fetch(`${API_BASE_URL}/api/appointments/${appointmentId}/cancel`, {
    method: 'PATCH',
    credentials: 'include',
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || 'Failed to cancel appointment');
    error.status = response.status;
    error.code = data.code;
    throw error;
  }
  return data.data;
};

export const fetchDoctorAppointments = async () => {
  const response = await fetch(`${API_BASE_URL}/api/appointments/doctor`, {
    method: 'GET',
    credentials: 'include',
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || 'Failed to fetch doctor appointments');
    error.status = response.status;
    error.code = data.code;
    throw error;
  }
  return data.data || [];
};

// Doctor schedule API calls
export const fetchMySchedule = async () => {
  const response = await fetch(`${API_BASE_URL}/api/doctors/schedule/me`, {
    method: 'GET',
    credentials: 'include',
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || 'Failed to fetch schedule');
    error.status = response.status;
    error.code = data.code;
    throw error;
  }
  return data.data;
};

export const updateMySchedule = async (schedulePayload) => {
  const response = await fetch(`${API_BASE_URL}/api/doctors/schedule/me`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(schedulePayload),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || 'Failed to update schedule');
    error.status = response.status;
    error.code = data.code;
    throw error;
  }
  return data.data;
};

// Admin provider verification API calls
export const fetchAdminProviders = async ({ type = 'all', status = 'all', page = 1, limit = 20 } = {}) => {
  const params = new URLSearchParams({ type, status, page, limit });
  const response = await fetch(`${API_BASE_URL}/api/admin/providers?${params.toString()}`, {
    method: 'GET',
    credentials: 'include',
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || 'Failed to fetch providers');
    error.status = response.status;
    error.code = data.code;
    throw error;
  }
  return data;
};

export const updateProviderVerification = async ({ type, id, isVerified }) => {
  const response = await fetch(`${API_BASE_URL}/api/admin/providers/${type}/${id}/verify`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ isVerified }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || 'Failed to update verification');
    error.status = response.status;
    error.code = data.code;
    throw error;
  }
  return data.data;
};

export const completeAppointment = async (appointmentId) => {
  const response = await fetch(`${API_BASE_URL}/api/appointments/${appointmentId}/complete`, {
    method: 'PATCH',
    credentials: 'include',
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || 'Failed to complete appointment');
    error.status = response.status;
    error.code = data.code;
    throw error;
  }
  return data.data;
};

// Review API client calls
export const fetchProviderReviews = async ({ doctorId, hospitalId, page = 1, limit = 10 } = {}) => {
  const params = new URLSearchParams();
  if (doctorId) params.append('doctorId', doctorId);
  if (hospitalId) params.append('hospitalId', hospitalId);
  if (page) params.append('page', page);
  if (limit) params.append('limit', limit);

  const response = await fetch(`${API_BASE_URL}/api/reviews?${params.toString()}`);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || 'Failed to fetch provider reviews');
    error.status = response.status;
    error.code = data.code;
    throw error;
  }
  return data;
};

export const submitReview = async ({ appointmentId, rating, comment }) => {
  const response = await fetch(`${API_BASE_URL}/api/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ appointmentId, rating, comment }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || 'Failed to submit review');
    error.status = response.status;
    error.code = data.code;
    throw error;
  }
  return data.data;
};

export const fetchMyReviews = async ({ page = 1, limit = 20 } = {}) => {
  const params = new URLSearchParams({ page, limit });
  const response = await fetch(`${API_BASE_URL}/api/reviews/my?${params.toString()}`, {
    method: 'GET',
    credentials: 'include',
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || 'Failed to fetch your reviews');
    error.status = response.status;
    error.code = data.code;
    throw error;
  }
  return data;
};

export const updateMyReview = async ({ id, rating, comment }) => {
  const response = await fetch(`${API_BASE_URL}/api/reviews/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ rating, comment }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || 'Failed to update review');
    error.status = response.status;
    error.code = data.code;
    throw error;
  }
  return data.data;
};

export const deleteMyReview = async (id) => {
  const response = await fetch(`${API_BASE_URL}/api/reviews/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || 'Failed to delete review');
    error.status = response.status;
    error.code = data.code;
    throw error;
  }
  return data;
};

export const fetchAdminReviews = async ({ status = 'pending', page = 1, limit = 20 } = {}) => {
  const params = new URLSearchParams({ status, page, limit });
  const response = await fetch(`${API_BASE_URL}/api/admin/reviews?${params.toString()}`, {
    method: 'GET',
    credentials: 'include',
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || 'Failed to fetch reviews for moderation');
    error.status = response.status;
    error.code = data.code;
    throw error;
  }
  return data;
};

export const moderateReview = async ({ id, status }) => {
  const response = await fetch(`${API_BASE_URL}/api/admin/reviews/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ status }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || 'Failed to moderate review');
    error.status = response.status;
    error.code = data.code;
    throw error;
  }
  return data;
};

// AI Symptom Triage API client call
export const triageSymptomsApi = async ({ messages, language = 'en' }) => {
  const response = await fetch(`${API_BASE_URL}/api/ai/symptom-triage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ messages, language }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || 'AI symptom triage request failed');
    error.status = response.status;
    error.code = data.code;
    error.messageHi = data.messageHi;
    throw error;
  }
  return data.data;
};


