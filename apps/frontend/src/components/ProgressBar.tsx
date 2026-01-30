interface Props {
    value: number;
}

export function ProgressBar({ value }: Props) {
    return (
        <div style={{ height: 12, background: '#eee', borderRadius: 6 }}>
            <div
                style={{
                    width: `${value}%`,
                    height: '100%',
                    background: '#4caf50',
                    borderRadius: 6,
                    transition: 'width 0.3s',
                }}
            />
        </div>
    );
}