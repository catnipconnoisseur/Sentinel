import { useState, useCallback, useRef, useEffect } from 'react';
import { api } from '../api/client';

export function useInvestigation(machineId) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastQuestion, setLastQuestion] = useState('');

  const abortControllerRef = useRef(null);
  const isInFlightRef = useRef(false);

  // Clean up any pending request on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      console.info(`[frontend][investigation] cancelling in-flight request for machineId=${machineId}`);
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    isInFlightRef.current = false;
    setLoading(false);
    setError('Investigation cancelled by user.');
  }, [machineId]);

  const investigate = useCallback(async (question) => {
    if (!question || !question.trim()) return;
    if (isInFlightRef.current) {
      console.warn(`[frontend][investigation] duplicate request blocked for machineId=${machineId}`);
      return;
    }

    const cleanQuestion = question.trim();
    const startedAt = performance.now();
    console.info(`[frontend][investigation] start machineId=${machineId} question=${JSON.stringify(cleanQuestion)}`);
    
    // Set up state and guard
    isInFlightRef.current = true;
    setLoading(true);
    setError(null);
    setResult(null);
    setLastQuestion(cleanQuestion);

    // Cancel any existing controller just in case
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const data = await api.investigate(machineId, cleanQuestion, { signal: controller.signal });
      
      // Only update state if this was the latest active controller/request
      if (abortControllerRef.current === controller) {
        console.info(`[frontend][investigation] response received machineId=${machineId} durationMs=${Math.round(performance.now() - startedAt)}`);
        setResult(data);
      }
    } catch (err) {
      if (abortControllerRef.current === controller) {
        console.error(`[frontend][investigation] failed machineId=${machineId} durationMs=${Math.round(performance.now() - startedAt)}`, err);
        setError(err.message);
      }
    } finally {
      if (abortControllerRef.current === controller) {
        isInFlightRef.current = false;
        setLoading(false);
        abortControllerRef.current = null;
        console.info(`[frontend][investigation] loading cleared machineId=${machineId} durationMs=${Math.round(performance.now() - startedAt)}`);
      }
    }
  }, [machineId]);

  const retry = useCallback(() => {
    if (lastQuestion) {
      investigate(lastQuestion);
    }
  }, [lastQuestion, investigate]);

  const reset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    isInFlightRef.current = false;
    setResult(null);
    setError(null);
    setLastQuestion('');
    setLoading(false);
  }, []);

  return { result, loading, error, lastQuestion, investigate, retry, cancel, reset };
}
