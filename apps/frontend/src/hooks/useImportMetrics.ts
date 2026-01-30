import type { ImportProgress } from "../api/types";

export function useImportMetrics(data: ImportProgress) {
    const percent =
        data.totalRows > 0
            ? Math.floor((data.processedRows / data.totalRows) * 100)
            : 0;

    const elapsed =
        data.startedAt
            ? (Date.now() - new Date(data.startedAt).getTime()) / 1000
            : 0;

    const rate = elapsed > 0 ? Math.round(data.processedRows / elapsed) : 0;
    const remaining = data.totalRows - data.processedRows;
    const eta = rate > 0 ? Math.round(remaining / rate) : null;

    return { percent, rate, eta };
}