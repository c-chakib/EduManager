/**
 * Production Environment Configuration
 * Used when building for production (ng build --configuration production)
 */
export const environment = {
  production: true,
  apiUrl: 'https://your-production-api.com', // TODO: Replace with actual production API URL
  apiEndpoints: {
    users: '/users',
    etudiants: '/etudiants',
    matieres: '/etudiants/matieres/list'
  },
  auth: {
    tokenKey: 'auth_token',
    userKey: 'current_user'
  },
  logging: {
    enabled: false, // Disable detailed logging in production
    level: 'error' // Only log errors in production
  }
};
