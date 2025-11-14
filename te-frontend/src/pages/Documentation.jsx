import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HomeIcon, Bars3Icon } from '@heroicons/react/24/outline';
import { MoonIcon, SunIcon } from '@heroicons/react/24/solid';

const buildDocumentationUrl = () => {
    const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000/v1/';

    try {
        return new URL('documentation', baseUrl).toString();
    } catch (err) {
        console.warn('Falling back to manual documentation URL join:', err);
        const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
        return `${normalizedBase}documentation`;
    }
};

const fetchWithTimeout = async (url, options = {}) => {
    const { timeout = 30000, onAbort, signal, ...rest } = options;
    const controller = new AbortController();

    const handleAbort = () => {
        controller.abort();
        if (onAbort) onAbort();
    };

    const timeoutId = setTimeout(handleAbort, timeout);

    if (signal) {
        if (signal.aborted) {
            handleAbort();
        } else {
            signal.addEventListener('abort', handleAbort);
        }
    }

    try {
        return await fetch(url, {
            ...rest,
            signal: controller.signal,
        });
    } finally {
        clearTimeout(timeoutId);
        if (signal) {
            signal.removeEventListener('abort', handleAbort);
        }
    }
};

const Documentation = () => {
    const [htmlContent, setHtmlContent] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [attempts, setAttempts] = useState(0);
    const [docsTheme, setDocsTheme] = useState(() => document.documentElement.dataset.theme || 'dark');
    const navigate = useNavigate();
    const contentRef = useRef(null);

    const documentationUrl = useMemo(() => buildDocumentationUrl(), []);

    const fetchDocumentation = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        let aborted = false;
        try {
            const isMobile = window.matchMedia('(max-width: 640px)').matches ||
                (navigator?.userAgent || '').toLowerCase().includes('mobile');
            const timeoutMs = isMobile ? 25000 : 40000;

            const response = await fetchWithTimeout(documentationUrl, {
                headers: { Accept: 'text/html' },
                timeout: timeoutMs,
                onAbort: () => {
                    aborted = true;
                },
            });

            if (!response.ok) {
                throw new Error(`Failed to load documentation (${response.status})`);
            }

            const html = await response.text();
            if (!html || html.length < 50) {
                throw new Error('Unexpected documentation payload');
            }

            setHtmlContent(html);
        } catch (err) {
            console.error('Documentation error:', err);

            let errorMessage = 'Unable to load documentation.';
            const message = err?.message || '';

            if (aborted || err?.name === 'AbortError' || message.includes('timeout')) {
                errorMessage = 'Request timed out. Please retry.';
            } else if (message === 'Network Error' || message === 'Failed to fetch') {
                errorMessage = 'Network error. Check your connection and retry.';
            } else if (message.includes('Unexpected documentation payload')) {
                errorMessage = 'Received incomplete documentation data. Retrying…';
            } else if (message.includes('Failed to load documentation')) {
                errorMessage = 'Documentation endpoint returned an error. Please try again.';
            } else if (message) {
                errorMessage = message;
            }

            setError(errorMessage);

            setAttempts((prev) => {
                const next = prev + 1;
                if (next === 1 && (aborted || err?.name === 'AbortError')) {
                    setTimeout(() => fetchDocumentation(), 2500);
                }
                return next;
            });
        } finally {
            setIsLoading(false);
        }
    }, [documentationUrl]);

    useEffect(() => {
        fetchDocumentation();
    }, [fetchDocumentation]);

    useEffect(() => {
        if (!htmlContent) {
            return;
        }

        const container = contentRef.current;
        if (!container) {
            return;
        }

        const storeKey = '__teDocsScriptStore';
        const scriptStore = window[storeKey] || { htmlSignature: null, executed: new Set() };

        if (!window[storeKey]) {
            window[storeKey] = scriptStore;
        }

        if (scriptStore.htmlSignature !== htmlContent) {
            scriptStore.htmlSignature = htmlContent;
            scriptStore.executed = new Set();
        }

        const scripts = container.querySelectorAll('script');
        scripts.forEach((script, index) => {
            const inlineKey = script.textContent ? `${index}:${script.textContent.length}` : '';
            const scriptKey = script.src || inlineKey;

            if (scriptStore.executed.has(scriptKey)) {
                return;
            }

            const newScript = document.createElement('script');
            Array.from(script.attributes).forEach((attr) => {
                newScript.setAttribute(attr.name, attr.value);
            });

            if (script.src) {
                newScript.src = script.src;
            } else {
                newScript.textContent = script.textContent;
            }

            scriptStore.executed.add(scriptKey);
            script.parentNode?.replaceChild(newScript, script);
        });
    }, [htmlContent]);

    useEffect(() => {
        const updateTheme = () => {
            const theme = document.documentElement.dataset.theme;
            setDocsTheme(theme || 'dark');
        };

        updateTheme();

        const observer = new MutationObserver(updateTheme);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

        return () => observer.disconnect();
    }, []);

    const triggerDocsSidebar = useCallback(() => {
        const container = contentRef.current;
        const toggleButton = container?.querySelector('button.sidebar-toggle, button[aria-label*="navigation" i], button[data-sidebar-toggle]')
            || document.querySelector('button.sidebar-toggle, button[aria-label*="navigation" i], button[data-sidebar-toggle]');
        if (toggleButton) {
            toggleButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        }
    }, []);

    const triggerDocsThemeToggle = useCallback(() => {
        const container = contentRef.current;
        const themeToggle = container?.querySelector('button.theme-toggle, button[aria-label*="theme" i], button[title*="Switch" i]')
            || document.querySelector('button.theme-toggle, button[aria-label*="theme" i], button[title*="Switch" i]');
        if (themeToggle) {
            themeToggle.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        }
    }, []);

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
            <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-3">
                        <img
                            src="/te-logo.png"
                            alt="TechElevate logo"
                            className="h-10 w-10 select-none"
                        />
                        <div className="flex flex-col">
                            <span className="text-xs font-medium text-slate-400 uppercase tracking-widest">TechElevate</span>
                            <span className="text-base font-semibold text-white">Documentation</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-slate-300">
                        <button
                            type="button"
                            onClick={() => navigate('/')}
                            className="flex h-10 w-10 items-center justify-center rounded-lg border border-transparent hover:border-slate-700 hover:text-white transition-colors"
                            title="Back to home"
                        >
                            <HomeIcon className="h-5 w-5" />
                        </button>
                        <button
                            type="button"
                            onClick={triggerDocsSidebar}
                            className="flex h-10 w-10 items-center justify-center rounded-lg border border-transparent hover:border-slate-700 hover:text-white transition-colors"
                            title="Toggle documentation navigation"
                        >
                            <Bars3Icon className="h-5 w-5" />
                        </button>
                        <button
                            type="button"
                            onClick={triggerDocsThemeToggle}
                            className="flex h-10 w-10 items-center justify-center rounded-lg border border-transparent hover:border-slate-700 hover:text-white transition-colors"
                            title="Toggle documentation theme"
                        >
                            {docsTheme === 'dark' ? (
                                <SunIcon className="h-5 w-5" />
                            ) : (
                                <MoonIcon className="h-5 w-5" />
                            )}
                        </button>
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
                        ref={contentRef}
                        dangerouslySetInnerHTML={{ __html: htmlContent }}
                        className="w-full h-full"
                    />
                )}
            </main>
        </div>
    );
};

export default Documentation;
