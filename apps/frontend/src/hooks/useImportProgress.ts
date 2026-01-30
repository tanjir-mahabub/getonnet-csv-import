import { useEffect, useRef, useState } from 'react';
import type { ImportProgress } from '../api/types';
import { fetchImportProgress } from '../api/import.api';

export function useImportProgress(
    enabled: boolean,
    pollIntervalMs: number = 1500,
) {
    const [data, setData] = useState<ImportProgress | null>(null);
    const [error, setError] = useState<string | null>(null);
    const timerRef = useRef<number | null>(null);

    const load = async () => {
        try {
            const response = await fetchImportProgress();
            setData(response);
            setError(null);
        } catch (e: any) {
            setError(e.message ?? 'Failed to fetch import progress');
        }
    };

    useEffect(() => {
        load();
    }, []);

    useEffect(() => {
        if (!enabled) {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
            return;
        }

        timerRef.current = window.setInterval(load, pollIntervalMs);

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        };
    }, [enabled, pollIntervalMs]);

    return { data, error };
}