import { useState } from 'react';
import { useImportProgress } from '../../hooks/useImportProgress';
import { useImportMetrics } from '../../hooks/useImportMetrics';
import { startImport } from '../../api/import.api';
import { ImportSectionView } from './ImportSection.view';

export function ImportSection() {
    const { data, error } = useImportProgress();
    const [starting, setStarting] = useState(false);

    if (!data) return null;

    const metrics = useImportMetrics(data);

    const isRunning = data.status === 'running';
    const isInterrupted = data.status === 'interrupted';

    const buttonLabel = isRunning
        ? 'Syncing…'
        : isInterrupted
            ? 'Resume Import'
            : 'Start Import';

    const onStart = async () => {
        try {
            setStarting(true);
            await startImport();
        } finally {
            setStarting(false);
        }
    };

    return (
        <ImportSectionView
            data={data}
            metrics={metrics}
            error={error}
            isRunning={isRunning}
            isInterrupted={isInterrupted}
            buttonLabel={buttonLabel}
            starting={starting}
            onStart={onStart}
        />
    );
}