import { StatusBadge } from '../StatusBadge';
import { ProgressBar } from '../ProgressBar';
import { Metric } from '../Metric';
import { PrimaryButton } from '../ui/PrimaryButton';
import type { ImportProgress } from '../../api/types';

export function ImportSectionView({
    data,
    metrics,
    error,
    isInterrupted,
    isCompleted,
    buttonLabel,
    starting,
    onStart,
}: {
    data: ImportProgress | null;
    metrics: {
        percent: number;
        elapsed: number;
        rate: number;
        eta: number;
        skipped: number;
    } | null;
    error: string | null;
    isInterrupted: boolean;
    isCompleted: boolean;
    buttonLabel: string;
    starting: boolean;
    onStart: () => void;
}) {
    if (!data || !metrics) {
        return (
            <section>
                <h2>CSV Import</h2>
                <PrimaryButton onClick={onStart}>
                    Start Import
                </PrimaryButton>
            </section>
        );
    }

    const processed = data.processedRows ?? 0;
    const skipped = data.skippedRows ?? 0;
    const total = data.totalRows ?? 0;
    const percent = Math.min(100, Math.max(0, metrics.percent));

    const isRunning = data.status === 'RUNNING';

    return (
        <section
            style={{
                padding: 24,
                borderRadius: 16,
                background: '#f5f8ff',
                boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
            }}
        >
            {/* ================= HEADER ================= */}
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}
            >
                <h2 style={{ margin: 0 }}>CSV Import</h2>

                <PrimaryButton
                    onClick={onStart}
                    disabled={isRunning || starting}
                >
                    {isRunning
                        ? 'Import Running…'
                        : starting
                            ? 'Starting…'
                            : buttonLabel}
                </PrimaryButton>
            </div>

            {/* ================= STATUS ================= */}
            <div style={{ marginTop: 8 }}>
                <StatusBadge status={data.status} />
            </div>

            {/* ================= PROGRESS ================= */}
            <div style={{ margin: '16px 0' }}>
                <ProgressBar value={percent} />
            </div>

            {/* ================= METRICS ================= */}
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <Metric
                    label="Processed"
                    value={`${processed.toLocaleString()} / ${total.toLocaleString()}`}
                />
                <Metric
                    label="Skipped"
                    value={skipped.toLocaleString()}
                />
                <Metric
                    label="Elapsed"
                    value={`${metrics.elapsed}s`}
                />
                <Metric
                    label="Rate"
                    value={`${metrics.rate} rows/sec`}
                />
                <Metric
                    label="ETA"
                    value={`${metrics.eta}s`}
                />
            </div>

            {/* ================= RECENT ROWS ================= */}
            {data.recentCustomerEmails.length > 0 && (
                <div style={{ marginTop: 16 }}>
                    <h4>Recently Imported</h4>
                    <ul style={{ maxHeight: 120, overflowY: 'auto' }}>
                        {data.recentCustomerEmails.map((email) => (
                            <li key={email}>{email}</li>
                        ))}
                    </ul>
                </div>
            )}

            {/* ================= WARNINGS ================= */}
            {isInterrupted && (
                <div style={{ marginTop: 12, color: '#b45309' }}>
                    ⚠ Import interrupted. You can safely resume.
                </div>
            )}

            {isCompleted && (
                <div style={{ marginTop: 12, color: '#166534' }}>
                    ✅ Import completed successfully
                </div>
            )}

            {/* ================= ERROR ================= */}
            {error && (
                <div style={{ marginTop: 12, color: '#dc2626' }}>
                    {error}
                </div>
            )}
        </section>
    );
}