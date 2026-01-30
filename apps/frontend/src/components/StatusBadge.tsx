import type { ImportStatus } from '../api/types';

export function StatusBadge({ status }: { status: ImportStatus }) {
    const colorMap: Record<ImportStatus, string> = {
        idle: '#999',
        running: '#2196f3',
        interrupted: '#f59e0b',
        completed: '#4caf50',
        failed: '#f44336',
    };

    return (
        <span
            style={{
                backgroundColor: colorMap[status],
                color: '#fff',
                padding: '4px 8px',
                borderRadius: '12px',
                textTransform: 'capitalize',
            }}
        >
            {status}
        </span>
    );
}