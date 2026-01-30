import type { Customer } from '../../api/types';
import { VirtualizedCustomersTable } from './VirtualizedCustomersTable';

export function CustomersSectionView({
    customers,
    loadMore,
    hasMore,
    loading,
    error,
    resetAndReload,
}: {
    customers: Customer[];
    loadMore: () => void;
    hasMore: boolean;
    loading: boolean;
    error?: string | null;
    resetAndReload: () => void;
}) {
    return (
        <section style={{ marginTop: 40 }}>
            <h3 style={{ marginBottom: 12 }}>Customers</h3>

            <VirtualizedCustomersTable
                customers={customers}
                loadMore={loadMore}
                hasMore={hasMore}
                loading={loading}
                error={error}
                resetAndReload={resetAndReload}
            />
        </section>
    );
}