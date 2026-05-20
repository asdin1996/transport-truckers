import api from './api'

export const getMaponUnits     = () => api.get('/mapon/units')
export const getMaponDashboard = () => api.get('/mapon/dashboard')
