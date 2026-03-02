import type { FallbackProps } from 'react-error-boundary';

export function FullPageError({ error, resetErrorBoundary }: FallbackProps) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    return (
        <div className="min-h-screen bg-app text-app flex flex-col items-center justify-center p-6 text-center">
            <div className="crt-screen p-8 max-w-lg w-full">
                <h2 className="text-destructive font-bold text-2xl mb-4">CRITICAL SYSTEM FAILURE</h2>
                <div className="bg-surface p-4 rounded-md border border-app mb-6 text-left overflow-auto max-h-48">
                    <pre className="text-sm font-mono text-muted whitespace-pre-wrap">
                        {errorMessage}
                    </pre>
                </div>
                <button
                    onClick={resetErrorBoundary}
                    className="btn-retro w-full"
                >
                    REBOOT SYSTEM
                </button>
            </div>
        </div>
    );
}
