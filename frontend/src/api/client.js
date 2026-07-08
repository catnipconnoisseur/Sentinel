/**
 * API client — thin fetch wrapper.
 * Uses Vite proxy (/api → http://localhost:8000/api) in dev.
 */

const BASE_URL = '/api';

async function request(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  return response.json();
}

export const api = {
  // Machine endpoints
  getMachines: () => request('/machines'),
  getMachine: (id) => request(`/machines/${id}`),
  getTelemetry: (id, hours = 168) => request(`/machines/${id}/telemetry?hours=${hours}`),
  getErrors: (id) => request(`/machines/${id}/errors`),
  getMaintenance: (id) => request(`/machines/${id}/maintenance`),

  // Investigation endpoint
  investigate: (machineId, question) =>
    request('/investigate', {
      method: 'POST',
      body: JSON.stringify({ machine_id: machineId, question }),
    }),
};
