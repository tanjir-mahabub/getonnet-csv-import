import { http } from "./http";
import type { Customer, CustomersResponse } from "./types";

export function fetchCustomers(
    cursor?: string | null,
    limit = 50,
): Promise<CustomersResponse> {
    const params = new URLSearchParams();

    if (cursor) params.set('cursor', cursor);

    params.set('limit', String(limit));

    return http(`/customers?${params.toString()}`);
}

export function fetchCustomerById(id: string): Promise<Customer> {
    return http(`/customers/${id}`);
}

export function createCustomer(
    payload: Pick<Customer, 'email' | 'name' | 'phone'>,
): Promise<Customer> {
    return http(`/customers`, {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

export function updateCustomer(
    id: string,
    payload: Partial<Pick<Customer, 'name' | 'phone'>>,
): Promise<Customer> {
    return http(`/customers/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
    });
}