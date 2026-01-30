import { useEffect, useState } from 'react';
import type { ImportProgress } from '../api/types';

export function useImportMetrics(data: ImportProgress) {
    const total = data.totalRows ?? 0;

    const processed = Math.min(
        data.processedRows ?? 0,
        total,
    );

    const [now, setNow] = useState(Date.now());

    useEffect(() => {
        const timer = setInterval(() => {
            setNow(Date.now());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const startedAt = data.startedAt
        ? new Date(data.startedAt).getTime()
        : now;

    const effectiveNow = data.completedAt
        ? new Date(data.completedAt).getTime()
        : now;

    const elapsed = Math.max(
        1,
        Math.floor((effectiveNow - startedAt) / 1000),
    );

    const rate =
        elapsed > 0 ? Math.floor(processed / elapsed) : 0;

    const remaining = Math.max(0, total - processed);

    const eta =
        rate > 0 ? Math.ceil(remaining / rate) : 0;

    const percent =
        total > 0
            ? Math.min(100, Math.floor((processed / total) * 100))
            : 0;

    return {
        percent,
        elapsed,
        rate,
        eta,
        skipped: data.skippedRows ?? 0,
    };
}