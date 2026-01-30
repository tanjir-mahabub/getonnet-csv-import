import { useCustomersInfinite } from '../../hooks/useCustomersInfinite';
import { CustomersSectionView } from './CustomersSection.view';

export function CustomersSection() {
    const {
        customers,
        loadMore,
        hasMore,
        loading,
        error,
        resetAndReload
    } = useCustomersInfinite();

    return (
        <CustomersSectionView
            customers={customers}
            loadMore={loadMore}
            hasMore={hasMore}
            loading={loading}
            error={error}
            resetAndReload={resetAndReload}
        />
    );
}