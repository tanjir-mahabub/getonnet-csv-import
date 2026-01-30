import { useState, useEffect } from 'react';
import { fetchCustomers } from '../api/customers.api';
import type { Customer } from '../api/types';

export function useCustomersInfinite() {
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState<Record<number, Customer[]>>({});
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);

    const loadMore = async () => {
        if (!hasMore || loading) return;

        try {
            setLoading(true);
            const res = await fetchCustomers(page);

            setPages((p) => ({
                ...p,
                [page]: res.items,
            }));

            setHasMore(res.hasMore);
            setPage((p) => p + 1);
        } finally {
            setLoading(false);
        }
    };

    // ✅ INITIAL LOAD (THIS WAS MISSING)
    useEffect(() => {
        loadMore();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return {
        customers: Object.values(pages).flat(),
        loadMore,
        hasMore,
        loading,
    };
}