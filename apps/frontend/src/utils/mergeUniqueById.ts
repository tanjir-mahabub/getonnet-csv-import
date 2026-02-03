export function mergeUniqueById<T extends { id: string }>(
    prev: T[],
    next: T[]
): T[] {
    const map = new Map<string, T>();

    for (const item of prev) {
        map.set(item.id, item);
    }

    for (const item of next) {
        map.set(item.id, item);
    }

    return Array.from(map.values());
}