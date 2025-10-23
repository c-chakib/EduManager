/**
 * Development Environment Configuration
 * Used during local development (ng serve)
 */
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000',
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
    enabled: true,
    level: 'debug' // debug, info, warn, error
  }
};
