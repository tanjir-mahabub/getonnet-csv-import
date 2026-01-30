import { memo } from 'react';
import type { Customer } from '../../api/types';

export const CustomerRow = memo(function CustomerRow({
    customer,
}: {
    customer: Customer;
}) {
    return (
        <>
            <div style={{ flex: '2 0 280px', fontWeight: 500 }}>
                {customer.email}
            </div>
            <div style={{ flex: '1 0 160px' }}>
                {customer.name ?? '-'}
            </div>
            <div style={{ flex: '1 0 160px' }}>
                {customer.phone ?? '-'}
            </div>
        </>
    );
});