export function Metric({ label, value }: { label: string; value: string }) {
    return (
        <div style={{ fontSize: 13, color: '#555' }}>
            <strong>{label}:</strong> {value}
        </div>
    );
}