import { http } from "./http";
import type { ImportProgress } from "./types";

export function fetchImportProgress(): Promise<ImportProgress> {
    return http(`/import/progress`);
}

export function startImport(): Promise<void> {
    return http(`/import/sync`, {
        method: 'POST',
    });
}