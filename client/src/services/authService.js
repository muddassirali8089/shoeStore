import { apiClient, requestData } from './api'

export const authService = {
  login: (credentials) => requestData(apiClient.post('/admin/login', credentials)),
  me: () => requestData(apiClient.get('/admin/me')),
  logout: () => requestData(apiClient.post('/admin/logout')),
  forgotPassword: (email) => requestData(apiClient.post('/admin/forgot-password', { email })),
  verifyCode: (email, code) => requestData(apiClient.post('/admin/verify-code', { email, code })),
  resetPassword: (email, resetToken, newPassword) => requestData(apiClient.post('/admin/reset-password', { email, resetToken, newPassword })),
}
