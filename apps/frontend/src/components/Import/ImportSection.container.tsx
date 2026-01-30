import { ImportSectionView } from './ImportSection.view';
import { useImportProgress } from '../../hooks/useImportProgress';
import { useImportMetrics } from '../../hooks/useImportMetrics';
import { fetchImportProgress, startImport } from '../../api/import.api';
import { useEffect, useState } from 'react';
import type { ImportProgress } from '../../api/types';

const EMPTY_PROGRESS: ImportProgress = {
    status: 'IDLE',
    processedRows: 0,
    skippedRows: 0,
    lastProcessedRow: 0,
    totalRows: 0,
    recentCustomerEmails: [],
    startedAt: null,
    completedAt: null,
    errorMessage: null,
};

export function ImportSection() {
    const [pollingEnabled, setPollingEnabled] = useState(false);
    const [starting, setStarting] = useState(false);

    const { data, error } = useImportProgress(pollingEnabled);
    const metrics = useImportMetrics(data ?? EMPTY_PROGRESS);

    /**
     * Fetch ONCE on page load (rehydration)
     */
    useEffect(() => {
        // one-time fetch
        fetchImportProgress().then(() => { });
    }, []);

    /**
     * Control polling strictly by status
     */
    useEffect(() => {
        if (data?.status === 'RUNNING') {
            setPollingEnabled(true);
        } else {
            setPollingEnabled(false);
        }
    }, [data?.status]);

    const onStart = async () => {
        if (data?.status === 'RUNNING') return;

        setStarting(true);
        await startImport();
        setPollingEnabled(true);
        setStarting(false);
    };

    return (
        <ImportSectionView
            data={data}
            metrics={metrics}
            error={error}
            isCompleted={data?.status === 'COMPLETED'}
            isInterrupted={data?.status === 'INTERRUPTED'}
            buttonLabel={
                data?.status === 'INTERRUPTED'
                    ? 'Resume Import'
                    : 'Start Import'
            }
            starting={starting}
            onStart={onStart}
        />
    );
}