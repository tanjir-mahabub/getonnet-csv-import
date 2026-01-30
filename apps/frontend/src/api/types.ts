export type ImportStatus =
    | 'IDLE'
    | 'RUNNING'
    | 'INTERRUPTED'
    | 'COMPLETED'
    | 'FAILED';

export interface ImportProgress {
    status: ImportStatus;
    processedRows: number;
    skippedRows: number;
    lastProcessedRow: number;
    totalRows: number;
    recentCustomerEmails: string[];
    startedAt: string | null;
    updatedAt?: string | null;
    completedAt?: string | null;

    errorMessage?: string | null;
}

export interface Customer {
    id: string;
    email: string;
    name?: string;
    phone?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface CustomersResponse {
    items: Customer[];
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
}