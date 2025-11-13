import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../axiosConfig';

const Documentation = () => {
    const [iframeSrc, setIframeSrc] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const urlRef = useRef('');
    const navigate = useNavigate();

    const fetchDocumentation = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await axiosInstance.get('documentation', {
                responseType: 'text',
                transformResponse: [(data) => data],
                headers: {
                    Accept: 'text/html',
                },
            });

            console.log('Documentation response:', response);
            console.log('Response data type:', typeof response.data);
            console.log('Response data length:', response.data?.length);

            const blob = new Blob([response.data], { type: 'text/html' });
            const blobUrl = URL.createObjectURL(blob);

            if (urlRef.current) {
                URL.revokeObjectURL(urlRef.current);
            }

            urlRef.current = blobUrl;
            setIframeSrc(blobUrl);
        } catch (err) {
            console.error('Documentation error:', err);
            console.error('Error response:', err?.response);
            setError(err?.response?.data?.detail || err?.message || 'Unable to load documentation.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDocumentation();
        return () => {
            if (urlRef.current) {
                URL.revokeObjectURL(urlRef.current);
            }
        };
    }, [fetchDocumentation]);

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
            <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
                    <button
                        type="button"
                        onClick={() => navigate('/')}
                        className="text-sm font-semibold text-slate-300 hover:text-white"
                    >
                        ← Back to home
                    </button>
                    <div className="flex items-center gap-3">
                        <a
                            className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-800"
                            href="/docs"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            API Docs
                        </a>
                        {iframeSrc && (
                            <a
                                className="rounded-lg bg-sky-500 px-3 py-1.5 text-xs font-semibold text-slate-900 shadow hover:bg-sky-400"
                                href={iframeSrc}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                Open in new tab
                            </a>
                        )}
                    </div>
                </div>
            </header>

            <main className="flex-1 relative" style={{ minHeight: 'calc(100vh - 73px)' }}>
                {isLoading ? (
                    <div className="flex h-full items-center justify-center absolute inset-0">
                        <div className="flex flex-col items-center gap-3 text-center">
                            <div className="h-10 w-10 animate-spin rounded-full border-4 border-sky-500 border-t-transparent" />
                            <p className="text-sm text-slate-400">Loading documentation…</p>
                        </div>
                    </div>
                ) : error ? (
                    <div className="flex h-full items-center justify-center absolute inset-0">
                        <div className="rounded-xl border border-slate-800 bg-slate-900 px-6 py-8 text-center shadow">
                            <h2 className="text-lg font-semibold text-white">We hit a snag</h2>
                            <p className="mt-2 text-sm text-slate-400">{error}</p>
                            <button
                                type="button"
                                onClick={fetchDocumentation}
                                className="mt-4 rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-sky-400"
                            >
                                Try again
                            </button>
                        </div>
                    </div>
                ) : (
                    <iframe
                        title="TechElevate Documentation"
                        src={iframeSrc}
                        className="absolute inset-0 w-full h-full border-0"
                        sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                    />
                )}
            </main>
        </div>
    );
};

export default Documentation;
