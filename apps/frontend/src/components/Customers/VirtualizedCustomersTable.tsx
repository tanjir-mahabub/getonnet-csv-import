import type { Customer } from '../../api/types';
import { CustomerRow } from './CustomerRow';
import { useCustomersVirtualizer } from '../../hooks/useCustomersVirtualizer';

const TABLE_MIN_WIDTH = 760;
const ROW_HEIGHT = 48;

export function VirtualizedCustomersTable({
    customers,
    loadMore,
    hasMore,
    loading,
}: {
    customers: Customer[];
    loadMore: () => void;
    hasMore: boolean;
    loading: boolean;
}) {
    const { parentRef, virtualizer } = useCustomersVirtualizer({
        customers,
        hasMore,
        loadMore,
        loading,
        rowHeight: ROW_HEIGHT,
    });

    return (
        <div
            ref={parentRef}
            style={{
                height: 420,
                overflow: 'auto', // ✅ single scroll container
                borderRadius: 12,
                border: '1px solid #e5e7eb',
                background: '#fff',
                boxShadow: '0 8px 20px rgba(0,0,0,0.06)',
            }}
        >
            {/* Inner wrapper controls horizontal scroll */}
            <div
                style={{
                    minWidth: TABLE_MIN_WIDTH,
                    boxSizing: 'border-box',
                }}
            >
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
                        borderBottom: '2px solid #1e40af',
                        width: '100%',
                        boxSizing: 'border-box',
                    }}
                >
                    <div style={{ flex: '2 0 280px' }}>Email</div>
                    <div style={{ flex: '1 0 160px' }}>Name</div>
                    <div style={{ flex: '1 0 160px' }}>Phone</div>
                </div>

                {/* VIRTUALIZED BODY */}
                <div
                    style={{
                        height: virtualizer.getTotalSize(),
                        position: 'relative',
                    }}
                >
                    {virtualizer.getVirtualItems().map((row) => {
                        const isLoader = row.index >= customers.length;
                        const customer = customers[row.index];

                        return (
                            <div
                                key={row.key}
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
                                    boxSizing: 'border-box',

                                    // zebra strip
                                    background:
                                        row.index % 2 === 0
                                            ? '#ffffff'
                                            : '#f1f5f9',

                                    // visible row border
                                    borderBottom: '1px solid #cbd5e1',
                                }}
                            >
                                {isLoader ? (
                                    <div
                                        style={{
                                            width: '100%',
                                            textAlign: 'center',
                                            fontSize: 13,
                                            color: '#64748b',
                                        }}
                                    >
                                        {loading
                                            ? 'Loading more customers…'
                                            : hasMore
                                                ? '↓ Scroll to load more'
                                                : '✓ All customers loaded'}
                                    </div>
                                ) : (
                                    <CustomerRow customer={customer} />
                                )}
                            </div>
                        );
                    })}

                    {/* bottom fade hint */}
                    <div
                        style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            height: 40,
                            pointerEvents: 'none',
                            background:
                                hasMore && !loading
                                    ? 'linear-gradient(to top, rgba(255,255,255,1), rgba(255,255,255,0))'
                                    : 'transparent',
                        }}
                    />
                </div>
            </div>
        </div>
    );
}