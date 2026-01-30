type Props = {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
};

export function PrimaryButton({ children, onClick, disabled }: Props) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            style={{
                padding: '10px 18px',
                borderRadius: 10,
                background: '#2563eb',
                color: '#fff',
                border: 'none',
                fontWeight: 600,
                opacity: disabled ? 0.6 : 1,
                cursor: disabled ? 'not-allowed' : 'pointer',
            }}
        >
            {children}
        </button>
    );
}