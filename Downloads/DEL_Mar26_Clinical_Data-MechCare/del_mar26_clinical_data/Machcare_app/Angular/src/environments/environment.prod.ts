export const environment = {
  production: true,
  // Change this if your backend WAR context is different on Tomcat.
  apiUrl: `${location.origin}/machcare_backend/api`,
  wsUrl: `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/machcare_backend/ws/realtime`
};
