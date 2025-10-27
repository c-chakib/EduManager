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
  },
  google: {
    clientId: '539779239335-grgcj03kdoodn70muil65pb2jtgetc15.apps.googleusercontent.com' // Replace with your actual Google Client ID
  }
};
