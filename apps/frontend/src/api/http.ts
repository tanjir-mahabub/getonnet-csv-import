const BASE_API_URL = import.meta.env.VITE_API_URL;

export async function http<T>(
    path: string,
    options?: RequestInit
): Promise<T> {
    const response = await fetch(`${BASE_API_URL}${path}`, {
        headers: {
            'Content-Type': 'application/json',
            ...(options?.headers || {}),
        },
        ...options,
    });

    if (!response.ok) {
        let message = response.statusText;
        try {
            const body = await response.json();
            message = body.message ?? message;
        } catch {
            // ignore JSON parse errors
        }
        throw new Error(message);
    }
    return response.json() as Promise<T>;
}