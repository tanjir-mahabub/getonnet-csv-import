import { useSmoothProgress } from '../hooks/useSmoothProgress';

export function ProgressBar({ value }: { value: number }) {
    const smooth = useSmoothProgress(value, 600);

    return (
        <div style={{ height: 12, background: '#e5e7eb', borderRadius: 6 }}>
            <div
                style={{
                    width: `${smooth}%`,
                    height: '100%',
                    background:
                        'linear-gradient(90deg, #4caf50, #66bb6a)',
                    borderRadius: 6,
                }}
            />
        </div>
    );
}