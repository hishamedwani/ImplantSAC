import axios from 'axios'

const API_BASE = 'http://localhost:8000'

export const api = axios.create({ baseURL: API_BASE })

// Attach JWT to every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Redirect to login on 401
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// ── Types ─────────────────────────────────────────────────────────────────

export interface User {
  username: string
  role:     string
}

export interface YoloResult {
  z:        number
  cx:       number
  cy:       number
  conf:     number
  score:    number
  z_range:  [number, number]
  scanner:  string
  is_molar: boolean
}

export interface Factor {
  measurement_mm: number | null
  risk:           'Green' | 'Yellow' | 'Red' | 'N/A'
}

export interface CaseResult {
  factors: {
    apical_bone:       Factor
    buccal_wall:       Factor
    ridge_width:       Factor
    septum_width:      { measurement_mm: number | null; risk: string }
    periapical_lesion: { lesion_detected: boolean; lesion_size_mm3: number; risk: string }
  }
  classification: 'Straightforward' | 'Advanced' | 'Complex'
  reasoning:      string[]
  disclaimer:     string
}

export interface UploadResponse {
  case_id:                  string
  patient_id:               string
  yolo:                     YoloResult
  result:                   CaseResult
  clinician_notes?:         string | null
  override_classification?: string | null
}

export interface CaseSummary {
  case_id:          string
  patient_id:       string
  filename:         string
  classification:   string
  ai_classification: string
  is_overridden:    boolean
  created_at:       string
}

export interface VolumeInfo {
  shape:   number[]
  spacing: number[]
  yolo:    { z: number; cx: number; cy: number }
}

// ── Auth ──────────────────────────────────────────────────────────────────

export const login = async (username: string, password: string): Promise<User> => {
  const res  = await api.post('/api/auth/login', { username, password })
  const user: User = { username: res.data.username, role: res.data.role }
  localStorage.setItem('token', res.data.access_token)
  localStorage.setItem('user',  JSON.stringify(user))
  return user
}

export const logout = (): void => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  window.location.href = '/login'
}

export const getStoredUser = (): User | null => {
  const u = localStorage.getItem('user')
  return u ? JSON.parse(u) : null
}

// ── Cases ─────────────────────────────────────────────────────────────────

export const uploadCase = async (file: File, patientId: string): Promise<UploadResponse> => {
  const formData = new FormData()
  formData.append('file',       file)
  formData.append('patient_id', patientId)
  const res = await api.post<UploadResponse>('/api/cases/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data
}

export const getCase = async (caseId: string): Promise<UploadResponse> => {
  const res = await api.get<UploadResponse>(`/api/cases/${caseId}`)
  return res.data
}

export const getAllCases = async (): Promise<CaseSummary[]> => {
  const res = await api.get<CaseSummary[]>('/api/cases/')
  return res.data
}

export const updateCase = async (
  caseId: string,
  update: { clinician_notes?: string; override_classification?: string },
): Promise<void> => {
  await api.patch(`/api/cases/${caseId}`, update)
}

export const deleteCase = async (caseId: string): Promise<void> => {
  await api.delete(`/api/cases/${caseId}`)
}

// ── Viewer ────────────────────────────────────────────────────────────────

export const getVolumeInfo = async (caseId: string): Promise<VolumeInfo> => {
  const res = await api.get<VolumeInfo>(`/api/viewer/${caseId}/volume-info`)
  return res.data
}

export const getSliceUrl = (caseId: string, view: string, index: number): string => {
  const token = localStorage.getItem('token')
  return `${API_BASE}/api/viewer/${caseId}/slice?view=${view}&index=${index}&token=${token}`
}