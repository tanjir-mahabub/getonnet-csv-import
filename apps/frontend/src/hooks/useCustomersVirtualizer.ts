import { useRef, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { Customer } from '../api/types';

const LOAD_MORE_THRESHOLD_PX = 200;

export function useCustomersVirtualizer({
    customers,
    hasMore,
    loadMore,
    loading,
    rowHeight = 48,
}: {
    customers: Customer[];
    hasMore: boolean;
    loadMore: () => void;
    loading: boolean;
    rowHeight?: number;
}) {
    const parentRef = useRef<HTMLDivElement>(null);
    const fetchingRef = useRef(false);

    const virtualizer = useVirtualizer({
        count: hasMore ? customers.length + 1 : customers.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => rowHeight,
        overscan: 10,
    });

    // scroll-position based infinite trigger (robust)
    useEffect(() => {
        const el = parentRef.current;
        if (!el) return;

        const onScroll = () => {
            const remaining =
                el.scrollHeight - el.scrollTop - el.clientHeight;

            if (
                remaining < LOAD_MORE_THRESHOLD_PX &&
                hasMore &&
                !loading &&
                !fetchingRef.current
            ) {
                fetchingRef.current = true;
                loadMore();
            }
        };

        el.addEventListener('scroll', onScroll);
        return () => el.removeEventListener('scroll', onScroll);
    }, [hasMore, loading, loadMore]);

    useEffect(() => {
        if (!loading) {
            fetchingRef.current = false;
        }
    }, [loading]);

    return { parentRef, virtualizer };
}