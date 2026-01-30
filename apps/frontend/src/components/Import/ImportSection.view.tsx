import { StatusBadge } from '../StatusBadge';
import { ProgressBar } from '../ProgressBar';
import { Metric } from '../Metric';
import type { ImportProgress } from '../../api/types';

export function ImportSectionView({
    data,
    metrics,
    error,
    isRunning,
    isInterrupted,
    buttonLabel,
    starting,
    onStart,
}: {
    data: ImportProgress;
    metrics: { percent: number; rate: number; eta: number | null };
    error: string | null;
    isRunning: boolean;
    isInterrupted: boolean;
    buttonLabel: string;
    starting: boolean;
    onStart: () => void;
}) {
    return (
        <section
            style={{
                padding: 24,
                borderRadius: 16,
                background: '#f5f8ff',
                boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
            }}
        >
            <h2>CSV Import</h2>

            <StatusBadge status={data.status} />

            <div style={{ margin: '16px 0' }}>
                <ProgressBar value={metrics.percent} />
            </div>

            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <Metric
                    label="Processed"
                    value={`${data.processedRows.toLocaleString()} / ${data.totalRows.toLocaleString()}`}
                />
                <Metric label="Rate" value={`${metrics.rate} rows/sec`} />
                {metrics.eta !== null && (
                    <Metric label="ETA" value={`${metrics.eta} sec`} />
                )}
            </div>

            {isInterrupted && (
                <div style={{ marginTop: 12, color: '#b45309' }}>
                    ⚠ Import was interrupted. You can safely resume.
                </div>
            )}

            {data.status === 'failed' && (
                <div style={{ marginTop: 12, color: '#dc2626' }}>
                    ❌ Import failed: {data.errorMessage}
                </div>
            )}

            <button
                disabled={starting || isRunning}
                onClick={onStart}
                style={{
                    marginTop: 20,
                    padding: '10px 18px',
                    borderRadius: 10,
                    background: '#2563eb',
                    color: '#fff',
                    border: 'none',
                    fontWeight: 600,
                    opacity: isRunning ? 0.6 : 1,
                    cursor: isRunning ? 'not-allowed' : 'pointer',
                }}
            >
                {starting ? 'Starting…' : buttonLabel}
            </button>

            {error && (
                <div style={{ marginTop: 12, color: '#dc2626' }}>
                    {error}
                </div>
            )}
        </section>
    );
}