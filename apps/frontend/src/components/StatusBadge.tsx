import type { ImportStatus } from '../api/types';

export function StatusBadge({ status }: { status: ImportStatus }) {
    const colorMap: Record<ImportStatus, string> = {
        IDLE: '#6b7280',
        RUNNING: '#2563eb',
        INTERRUPTED: '#f59e0b',
        COMPLETED: '#16a34a',
        FAILED: '#dc2626',
    };

    const color = colorMap[status] ?? '#6b7280';

    return (
        <span
            style={{
                backgroundColor: color,
                color: '#fff',
                padding: '4px 10px',
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 600,
                display: 'inline-block',
            }}
        >
            {status}
        </span>
    );
}