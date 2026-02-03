import { useEffect, useState, useCallback, useRef } from 'react';
import { fetchCustomers } from '../api/customers.api';
import type { Customer } from '../api/types';
import { mergeUniqueById } from '../utils/mergeUniqueById';

export function useCustomersInfinite(pageSize = 50) {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [cursor, setCursor] = useState<string | null>(null);
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
            const res = await fetchCustomers(cursor, pageSize);

            setCustomers((prev) => mergeUniqueById(prev, res.items));

            setCustomers((prev) => mergeUniqueById(prev, res.items));
            setHasMore(res.hasMore);
            setCursor(res.nextCursor);
        } catch (e) {
            setError('We couldn’t load customers right now.');
        } finally {
            loadingRef.current = false;
            setLoading(false);
        }
    }, [cursor, hasMore, pageSize]);

    const resetAndReload = useCallback(() => {
        loadingRef.current = false;
        didInitRef.current = false;

        setCustomers([]);
        setCursor(null);
        setHasMore(true);
        setError(null);

        setTimeout(() => loadMore(), 0);
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