import type { Customer } from '../../api/types';

export function CustomerRow({ customer }: { customer: Customer }) {
    return (
        <>
            <div
                style={{
                    flex: '2 0 280px',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    fontWeight: 500,
                    color: '#0f172a',
                }}
            >
                {customer.email}
            </div>

            <div
                style={{
                    flex: '1 0 160px',
                    color: '#475569',
                }}
            >
                {customer.name ?? '-'}
            </div>

            <div
                style={{
                    flex: '1 0 160px',
                    color: '#475569',
                }}
            >
                {customer.phone ?? '-'}
            </div>
        </>
    );
}