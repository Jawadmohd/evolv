export const apiUrl = (
  process.env.EXPO_PUBLIC_API_URL?.trim() || 'http://localhost:8080/api/v1'
).replace(/\/+$/, '');
