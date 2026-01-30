export type ImportStatus =
    | 'idle'
    | 'running'
    | 'interrupted'
    | 'completed'
    | 'failed';

export interface ImportProgress {
    status: ImportStatus;
    processedRows: number;
    totalRows: number;
    recentCustomerEmails: string[];
    startedAt: string | null;
    updatedAt?: string | null;
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