import { useEffect, useState, useCallback, useRef } from 'react';
import { fetchCustomers } from '../api/customers.api';
import type { Customer } from '../api/types';

export function useCustomersInfinite(pageSize = 50) {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const didInitRef = useRef(false);
    const loadingRef = useRef(false);

    const loadMore = useCallback(async () => {
        if (loadingRef.current || !hasMore) return;

        loadingRef.current = true;
        setLoading(true);
        setError(null);

        try {
            const res = await fetchCustomers(page, pageSize);

            setCustomers((prev) => [...prev, ...res.items]);

            if (res.items.length === 0) {
                setHasMore(false);
            } else if (typeof res.hasMore === 'boolean') {
                setHasMore(res.hasMore);
            } else {
                setHasMore(res.items.length === pageSize);
            }

            setPage((p) => p + 1);
        } catch (e) {
            setError('We couldn’t load customers right now.');
        } finally {
            loadingRef.current = false;
            setLoading(false);
        }
    }, [page, hasMore, pageSize]);

    const resetAndReload = useCallback(() => {
        loadingRef.current = false;
        didInitRef.current = false;

        setCustomers([]);
        setPage(1);
        setHasMore(true);
        setError(null);

        setTimeout(() => {
            loadMore();
        }, 0);
    }, [loadMore]);

    useEffect(() => {
        if (didInitRef.current) return;
        didInitRef.current = true;
        loadMore();
    }, [loadMore]);

    return {
        customers,
        loadMore,
        hasMore,
        loading,
        error,
        resetAndReload
    };
}