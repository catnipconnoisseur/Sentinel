/**
 * API client — thin fetch wrapper.
 * Uses Vite proxy (/api → http://localhost:8000/api) in dev.
 */

const BASE_URL = '/api';

async function request(path, options = {}) {
  const startedAt = performance.now();
  const method = options.method || 'GET';
  const timeoutMs = options.timeout !== undefined ? options.timeout : 45000;

  console.info(`[frontend][api] start ${method} ${BASE_URL}${path} timeoutMs=${timeoutMs}`);

  // Create an AbortController for timeout handling
  const controller = new AbortController();
  const { signal } = controller;

  // If user provided a signal, link them
  if (options.signal) {
    options.signal.addEventListener('abort', () => {
      controller.abort();
    });
  }

  let timeoutId;
  if (timeoutMs > 0) {
    timeoutId = setTimeout(() => {
      console.warn(`[frontend][api] aborting request due to timeout ${method} ${BASE_URL}${path} after ${timeoutMs}ms`);
      controller.abort();
    }, timeoutMs);
  }

  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
      signal,
    });

    if (timeoutId) clearTimeout(timeoutId);

    const durationMs = Math.round(performance.now() - startedAt);
    console.info(`[frontend][api] response ${method} ${BASE_URL}${path} status=${response.status} durationMs=${durationMs}`);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
      console.error(`[frontend][api] error body ${method} ${BASE_URL}${path}`, error);
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (err) {
    if (timeoutId) clearTimeout(timeoutId);
    
    const durationMs = Math.round(performance.now() - startedAt);
    if (err.name === 'AbortError') {
      console.error(`[frontend][api] request aborted/timed out ${method} ${BASE_URL}${path} durationMs=${durationMs}`);
      throw new Error(`Request timed out or cancelled after ${timeoutMs / 1000}s`);
    }
    
    console.error(`[frontend][api] request failed ${method} ${BASE_URL}${path} durationMs=${durationMs}`, err);
    throw err;
  }
}

export const api = {
  // Machine endpoints
  getMachines: () => request('/machines'),
  getMachine: (id) => request(`/machines/${id}`),
  getTelemetry: (id, hours = 168) => request(`/machines/${id}/telemetry?hours=${hours}`),
  getErrors: (id) => request(`/machines/${id}/errors`),
  getMaintenance: (id) => request(`/machines/${id}/maintenance`),

  // Investigation endpoint
  investigate: (machineId, question, options = {}) =>
    request('/investigate', {
      method: 'POST',
      body: JSON.stringify({ machine_id: machineId, question }),
      ...options,
    }),
};
