import { http } from "./http";
import type { Customer, CustomersResponse } from "./types";

export function fetchCustomers(
    page: number,
    limit = 50,
): Promise<CustomersResponse> {
    return http(`/customers?page=${page}&limit=${limit}`);
}

export function fetchCustomerById(id: string): Promise<Customer> {
    return http(`/customers/id/${id}`);
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
    return http(`/customers/id/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
    });
}