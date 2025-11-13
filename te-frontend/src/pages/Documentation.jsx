import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../axiosConfig';

const Documentation = () => {
    const [htmlContent, setHtmlContent] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [attempts, setAttempts] = useState(0);
    const abortRef = useRef(null);
    const navigate = useNavigate();

    const fetchDocumentation = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        // Abort any in-flight request
        if (abortRef.current) {
            abortRef.current.abort();
        }
        const controller = new AbortController();
        abortRef.current = controller;

        try {
            // Mobile detection (coarse pointer or small width)
            const isMobile = window.matchMedia('(max-width: 640px)').matches ||
                (navigator?.userAgent || '').toLowerCase().includes('mobile');

            // For mobile, use a shorter timeout to fail fast & retry
            const timeoutMs = isMobile ? 15000 : 30000; // 15s mobile, 30s desktop
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Request timeout')), timeoutMs);
            });

            const requestPromise = axiosInstance.get('documentation', {
                responseType: 'text',
                transformResponse: [(data) => data],
                headers: { Accept: 'text/html' },
                signal: controller.signal,
            });

            const response = await Promise.race([requestPromise, timeoutPromise]);

            // Defensive checks
            if (!response || typeof response.data !== 'string' || response.data.length < 50) {
                throw new Error('Unexpected documentation payload');
            }

            setHtmlContent(response.data);
        } catch (err) {
            console.error('Documentation error:', err);

            let errorMessage = 'Unable to load documentation.';
            const message = err?.message || '';
            if (message.includes('timeout')) {
                errorMessage = 'Server is waking up (cold start). Retrying…';
            } else if (message === 'Network Error') {
                errorMessage = 'Network error. Check your connection and retry.';
            } else if (message.includes('Unexpected documentation payload')) {
                errorMessage = 'Received incomplete documentation data. Retrying…';
            } else {
                errorMessage = err?.response?.data?.detail || message || errorMessage;
            }

            setError(errorMessage);

            // Auto single retry for first failure
            setAttempts(prev => {
                const next = prev + 1;
                if (next === 1) {
                    setTimeout(() => fetchDocumentation(), 2000);
                }
                return next;
            });
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDocumentation();
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
                    </div>
                </div>
            </header>

            <main className="flex-1" style={{ minHeight: 'calc(100vh - 73px)' }}>
                {isLoading ? (
                    <div className="flex h-full items-center justify-center px-4">
                        <div className="w-full max-w-md space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 animate-spin rounded-full border-4 border-sky-500 border-t-transparent" />
                                <p className="text-sm text-slate-400">Loading documentation…</p>
                            </div>
                            {/* Skeleton blocks */}
                            <div className="space-y-2">
                                <div className="h-4 w-5/6 bg-slate-800/60 rounded" />
                                <div className="h-4 w-4/6 bg-slate-800/50 rounded" />
                                <div className="h-4 w-3/5 bg-slate-800/40 rounded" />
                            </div>
                        </div>
                    </div>
                ) : error ? (
                    <div className="flex h-full items-center justify-center px-4">
                        <div className="rounded-xl border border-slate-800/80 bg-slate-900/80 backdrop-blur px-6 py-6 text-center shadow max-w-md w-full">
                            <h2 className="text-base font-semibold text-white">{attempts > 0 ? 'Retrying…' : 'Load issue'}</h2>
                            <p className="mt-2 text-xs sm:text-sm text-slate-400">{error}</p>
                            <div className="mt-4 flex flex-wrap gap-2 justify-center">
                                <button
                                    type="button"
                                    onClick={fetchDocumentation}
                                    className="rounded-lg bg-sky-500 px-4 py-2 text-xs font-semibold text-slate-900 hover:bg-sky-400"
                                >
                                    Retry now
                                </button>
                                <button
                                    type="button"
                                    onClick={() => navigate('/')}
                                    className="rounded-lg border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800"
                                >
                                    Back home
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div
                        dangerouslySetInnerHTML={{ __html: htmlContent }}
                        className="w-full h-full"
                    />
                )}
            </main>
        </div>
    );
};

export default Documentation;
