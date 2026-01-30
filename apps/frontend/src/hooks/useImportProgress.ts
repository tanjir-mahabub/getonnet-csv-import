import { useEffect, useState } from "react";
import { fetchImportProgress } from "../api/import.api";
import type { ImportProgress } from "../api/types";

export function useImportProgress(pollIntervalMs: number = 1500) {
    const [data, setData] = useState<ImportProgress | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let timer: number;

        const load = async () => {
            try {
                const response = await fetchImportProgress();
                setData(response);
                setError(null);

                if (response.status !== 'running') {
                    clearInterval(timer);
                }
            } catch (e: unknown) {
                setError(e instanceof Error ? e.message : "Failed to fetch import progress");
            }
        };

        load();
        timer = window.setInterval(load, pollIntervalMs);

        return () => clearInterval(timer);
    }, [pollIntervalMs]);

    return { data, error };
}