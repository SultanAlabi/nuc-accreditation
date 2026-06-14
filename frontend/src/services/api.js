// src/services/api.js
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api",
  // Do not force a global Content-Type here. We'll set it per-request in the
  // interceptor so FormData uploads can let the browser set the multipart
  // boundary automatically.
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("nuc_token");
  if (!config.headers) config.headers = {};
  if (token) config.headers.Authorization = `Bearer ${token}`;

  // If the request body is FormData, remove any Content-Type so the browser
  // will set multipart/form-data with the correct boundary. For non-FormData
  // payloads, default to application/json when a body exists and no
  // Content-Type is provided.
  const isFormData = typeof FormData !== 'undefined' && config.data instanceof FormData;
  if (isFormData) {
    delete config.headers['Content-Type'];
    delete config.headers['content-type'];
  } else {
    if (config.data != null && !config.headers['Content-Type'] && !config.headers['content-type']) {
      config.headers['Content-Type'] = 'application/json';
    }
  }

  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("nuc_token");
      localStorage.removeItem("nuc_user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

// ── Auth ─────────────────────────────────────────────────────────────────────
export const authAPI = {
  login:          (data) => api.post("/auth/login/", data),
  register:       (data) => api.post("/auth/register/", data),
  logout:         ()     => api.post("/auth/logout/"),
  me:             ()     => api.get("/auth/me/"),
  forgotPassword: (data) => api.post("/auth/forgot-password/", data),
  resetPassword:  (data) => api.post("/auth/reset-password/", data),
};


// ── Programmes ────────────────────────────────────────────────────────────────
export const programmesAPI = {
  list:   (params) => api.get("/programmes/", { params }),
  get:    (id)     => api.get(`/programmes/${id}/`),
  create: (data)   => api.post("/programmes/", data),
  update: (id, d)  => api.patch(`/programmes/${id}/`, d),
  delete: (id)     => api.delete(`/programmes/${id}/`),
  stats:  ()       => api.get("/programmes/stats/"),
  submit:   (id)          => api.post(`/programmes/${id}/submit/`),
  forward:  (id)          => api.post(`/programmes/${id}/forward/`),
  decision: (id, data)    => api.post(`/programmes/${id}/decision/`, data),

  downloadReport: (id)     => api.get(`/programmes/${id}/report/`, {
    params: { format: "pdf" },
    responseType: "blob"
  }),
};


// ── Milestones ────────────────────────────────────────────────────────────────
export const milestonesAPI = {
  list:     (pid)       => api.get(`/programmes/${pid}/milestones/`),
  complete: (pid, msId) => api.patch(`/programmes/milestones/${msId}/`, { status: 'COMPLETED' }),
};

// ── Documents ─────────────────────────────────────────────────────────────────
export const documentsAPI = {
  listAll: (params)              => api.get("/documents/", { params }),
  list:    (pid)                 => api.get(`/programmes/${pid}/documents/`),
  upload:  (pid, fd, onProgress) => {
    // Let the request interceptor handle Content-Type for FormData. Pass the
    // FormData directly so axios/browser can set the multipart boundary.
    return api.post(`/programmes/${pid}/documents/`, fd, {
      onUploadProgress: (e) => { if (onProgress && e.total) onProgress(Math.round(e.loaded * 100 / e.total)); },
    });
  },
  update: (id, data) => api.patch(`/documents/${id}/`, data),
  verify: (id)       => api.patch(`/documents/${id}/verify/`),
  delete: (id)       => api.delete(`/documents/${id}/`),
};

// ── Notifications ─────────────────────────────────────────────────────────────
export const notificationsAPI = {
  list:        (params) => api.get("/notifications/", { params }),
  markRead:    (id)     => api.patch(`/notifications/${id}/read/`),
  markAllRead: ()       => api.post("/notifications/mark-all-read/"),
  dismiss:     (id)     => api.delete(`/notifications/${id}/`),
};

// ── Settings / Profile ────────────────────────────────────────────────────────
export const settingsAPI = {
  getProfile:     ()     => api.get("/auth/me/"),
  updateProfile:  (data) => api.patch("/auth/profile/", data),
  changePassword: (data) => api.post("/auth/change-password/", data),
  updatePrefs:    (data) => api.patch("/auth/preferences/", data),
  deactivate:     ()     => api.delete("/auth/account/"),
};

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const dashboardAPI = {
  summary: () => api.get("/dashboard/summary/"),
};

// ── Team ──────────────────────────────────────────────────────────────────────
export const teamAPI = {
  list:     (params) => api.get("/team/members/", { params }),
  get:      (id)     => api.get(`/team/members/${id}/`),
  create:   (data)   => api.post("/team/members/", data),
  update:   (id, d)  => api.patch(`/team/members/${id}/`, d),
  remove:   (id)     => api.delete(`/team/members/${id}/`),
  invite:   (data)   => api.post("/team/invites/", data),
};

export default api;