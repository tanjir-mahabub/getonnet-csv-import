import type { Customer } from '../../api/types';
import { CustomerRow } from './CustomerRow';
import { useCustomersVirtualizer } from '../../hooks/useCustomersVirtualizer';

const ROW_HEIGHT = 48;
const TABLE_MIN_WIDTH = 820;

export function VirtualizedCustomersTable({
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
    const { parentRef, virtualizer } = useCustomersVirtualizer({
        customers,
        hasMore,
        loadMore,
        loading,
        error,
        rowHeight: ROW_HEIGHT,
    });

    return (
        <div
            ref={parentRef}
            style={{
                height: 420,
                overflow: 'auto',
                borderRadius: 12,
                border: '1px solid #e5e7eb',
                background: '#fff',
                position: 'relative',
            }}
        >
            <div style={{ minWidth: TABLE_MIN_WIDTH }}>
                {/* HEADER */}
                <div
                    style={{
                        display: 'flex',
                        height: ROW_HEIGHT,
                        alignItems: 'center',
                        padding: '0 16px',
                        fontWeight: 600,
                        background: '#2563eb',
                        color: '#fff',
                        position: 'sticky',
                        top: 0,
                        zIndex: 2,
                    }}
                >
                    <div style={{ width: 60 }}>SL</div>
                    <div style={{ flex: '2 0 280px' }}>Email</div>
                    <div style={{ flex: '1 0 120px' }}>Name</div>
                    <div style={{ flex: '1 0 160px' }}>Phone</div>
                </div>

                {/* BODY */}
                <div
                    style={{
                        height: virtualizer.getTotalSize(),
                        position: 'relative',
                    }}
                >
                    {/* 🔴 ERROR OVERLAY */}
                    {error && customers.length === 0 && (
                        <div
                            style={{
                                position: 'absolute',
                                inset: 0,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                height: '325px',
                                gap: 12,
                                background: '#fff',
                                zIndex: 1,
                            }}
                        >
                            <div style={{ fontSize: 42 }}>⚠️</div>
                            <div style={{ fontSize: 16, fontWeight: 600 }}>
                                Cannot load customers
                            </div>
                            <div style={{ color: '#6b7280', fontSize: 14 }}>
                                Server is unreachable right now.
                            </div>
                            <button
                                onClick={loadMore}
                                disabled={loading}
                                style={{
                                    marginTop: 8,
                                    padding: '8px 16px',
                                    borderRadius: 8,
                                    border: 'none',
                                    background: '#2563eb',
                                    color: '#fff',
                                    fontWeight: 500,
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                }}
                            >
                                {loading ? 'Retrying…' : 'Retry'}
                            </button>
                        </div>
                    )}

                    {/* EMPTY STATE */}
                    {!loading && !error && customers.length === 0 && (
                        <div
                            style={{
                                position: 'absolute',
                                inset: 0,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                height: '325px',
                                gap: 10,
                                background: '#fff',
                                zIndex: 1,
                            }}
                        >
                            <div style={{ fontSize: 40 }}>📭</div>

                            <div style={{ fontSize: 16, fontWeight: 600 }}>
                                No customers found
                            </div>

                            <div style={{ fontSize: 14, color: '#6b7280' }}>
                                We couldn’t find any customers right now.
                            </div>

                            <button
                                onClick={resetAndReload}
                                style={{
                                    marginTop: 12,
                                    padding: '8px 16px',
                                    borderRadius: 8,
                                    border: '1px solid #2563eb',
                                    background: '#2563eb',
                                    color: '#fff',
                                    fontWeight: 500,
                                    cursor: 'pointer',
                                }}
                            >
                                Check again
                            </button>
                        </div>
                    )}

                    {/* ROWS */}
                    {virtualizer.getVirtualItems().map((row) => {
                        const isLoader = row.index >= customers.length;
                        const customer = customers[row.index];
                        const sl = row.index + 1;

                        if (isLoader || customers.length === 0) return null;

                        return (
                            <div
                                key={customer?.id ?? row.key}
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: ROW_HEIGHT,
                                    transform: `translateY(${row.start}px)`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '0 16px',
                                    borderBottom: '1px solid #f1f5f9',
                                }}
                            >
                                <div style={{ width: 60, color: '#6b7280' }}>
                                    {sl}
                                </div>
                                <CustomerRow customer={customer} />
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}