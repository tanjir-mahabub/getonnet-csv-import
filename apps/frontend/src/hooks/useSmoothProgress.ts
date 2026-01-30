import { useEffect, useRef, useState } from 'react';

export function useSmoothProgress(
    target: number,
    durationMs = 500,
) {
    const [value, setValue] = useState(target);
    const startRef = useRef<number | null>(null);
    const fromRef = useRef(target);

    useEffect(() => {
        fromRef.current = value;
        startRef.current = null;

        const step = (timestamp: number) => {
            if (!startRef.current) startRef.current = timestamp;

            const progress = Math.min(
                (timestamp - startRef.current) / durationMs,
                1,
            );

            const next =
                fromRef.current +
                (target - fromRef.current) * easeOut(progress);

            setValue(next);

            if (progress < 1) {
                requestAnimationFrame(step);
            }
        };

        requestAnimationFrame(step);
    }, [target]);

    return Math.min(100, Math.max(0, value));
}

function easeOut(t: number) {
    return 1 - Math.pow(1 - t, 3);
}