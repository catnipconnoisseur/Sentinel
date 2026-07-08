/**
 * useInvestigation hook — manages investigation state and API calls.
 */

import { useState, useCallback } from 'react';
import { api } from '../api/client';

export function useInvestigation(machineId) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const investigate = useCallback(async (question) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await api.investigate(machineId, question);
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [machineId]);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { result, loading, error, investigate, reset };
}
