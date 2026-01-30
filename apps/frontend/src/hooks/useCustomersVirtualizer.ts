import { useRef, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { Customer } from '../api/types';

export function useCustomersVirtualizer({
    customers,
    hasMore,
    loadMore,
    loading,
    error,
    rowHeight = 48,
}: {
    customers: Customer[];
    hasMore: boolean;
    loadMore: () => void;
    loading: boolean;
    error?: string | null;
    rowHeight?: number;
}) {
    const parentRef = useRef<HTMLDivElement>(null);
    const lockRef = useRef(false);

    const virtualizer = useVirtualizer({
        count: hasMore ? customers.length + 1 : customers.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => rowHeight,
        overscan: 8,
    });

    const items = virtualizer.getVirtualItems();
    const lastItem = items[items.length - 1];

    useEffect(() => {
        if (
            !lastItem ||
            lastItem.index < customers.length - 1 ||
            !hasMore ||
            loading ||
            error ||
            lockRef.current
        ) {
            return;
        }

        lockRef.current = true;
        loadMore();
    }, [
        lastItem?.index,
        customers.length,
        hasMore,
        loading,
        error,
        loadMore,
    ]);

    useEffect(() => {
        if (!loading) {
            lockRef.current = false;
        }
    }, [loading]);

    return { parentRef, virtualizer };
}