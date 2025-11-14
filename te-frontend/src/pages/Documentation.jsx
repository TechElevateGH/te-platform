import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HomeIcon, Bars3Icon } from '@heroicons/react/24/outline';
import { MoonIcon, SunIcon } from '@heroicons/react/24/solid';

const DARK_THEME_VARS = {
    '--bg-primary': '#0f172a',
    '--bg-secondary': '#1e293b',
    '--bg-tertiary': '#334155',
    '--surface': '#1e293b',
    '--border': 'rgba(148, 163, 184, 0.1)',
    '--bg': 'rgba(15, 23, 42, 0.85)',
    '--text': '#ffffff',
    '--text-secondary': 'rgba(255, 255, 255, 0.72)',
    '--text-muted': 'rgba(255, 255, 255, 0.56)',
    '--heading': '#ffffff',
    '--accent': '#3b82f6',
    '--accent-hover': '#2563eb',
    '--accent-cyan': '#06b6d4',
    '--accent-purple': '#a855f7',
    '--link': '#60a5fa',
    '--code-bg': 'rgba(0, 0, 0, 0.4)',
    '--success': '#10b981',
    '--warning': '#f59e0b',
    '--error': '#ef4444',
    '--sidebar-width': '280px',
};

const LIGHT_THEME_VARS = {
    '--bg-primary': '#ffffff',
    '--bg-secondary': '#f8fafc',
    '--bg-tertiary': '#e2e8f0',
    '--surface': '#f8fafc',
    '--border': 'rgba(15, 23, 42, 0.08)',
    '--bg': 'rgba(255, 255, 255, 0.9)',
    '--text': '#0f172a',
    '--text-secondary': '#475569',
    '--text-muted': '#64748b',
    '--heading': '#0f172a',
    '--link': '#3b82f6',
    '--code-bg': 'rgba(0, 0, 0, 0.05)',
};

const DOCS_CACHE_KEY = '__teDocsCache_v1';
const DOCS_CACHE_TTL_MS = 1000 * 60 * 60 * 12; // 12 hours

const canUseLocalStorage = () => {
    if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
        return false;
    }
    try {
        const testKey = '__teDocsTest';
        window.localStorage.setItem(testKey, '1');
        window.localStorage.removeItem(testKey);
        return true;
    } catch (err) {
        return false;
    }
};

const readCachedDocumentation = () => {
    if (!canUseLocalStorage()) {
        return null;
    }
    try {
        const raw = window.localStorage.getItem(DOCS_CACHE_KEY);
        if (!raw) {
            return null;
        }
        const parsed = JSON.parse(raw);
        if (!parsed?.html || typeof parsed.html !== 'string') {
            return null;
        }
        return {
            html: parsed.html,
            timestamp: typeof parsed.timestamp === 'number' ? parsed.timestamp : Date.now(),
        };
    } catch (err) {
        if (process.env.NODE_ENV !== 'production') {
            console.warn('Unable to read cached documentation payload', err);
        }
        return null;
    }
};

const writeCachedDocumentation = (html) => {
    if (!canUseLocalStorage() || !html) {
        return;
    }
    try {
        window.localStorage.setItem(
            DOCS_CACHE_KEY,
            JSON.stringify({ html, timestamp: Date.now() })
        );
    } catch (err) {
        if (process.env.NODE_ENV !== 'production') {
            console.warn('Unable to persist cached documentation payload', err);
        }
    }
};

const formatCacheTimestamp = (timestamp) => {
    if (!timestamp) {
        return '';
    }
    try {
        return new Date(timestamp).toLocaleString(undefined, {
            dateStyle: 'medium',
            timeStyle: 'short',
        });
    } catch (err) {
        return '';
    }
};

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
    const documentationUrl = useMemo(() => buildDocumentationUrl(), []);
    const cacheSnapshot = useMemo(() => readCachedDocumentation(), []);
    const [htmlContent, setHtmlContent] = useState(cacheSnapshot?.html || '');
    const [cachedAt, setCachedAt] = useState(cacheSnapshot?.timestamp ?? null);
    const [isCacheStale, setIsCacheStale] = useState(() => {
        if (!cacheSnapshot?.timestamp) {
            return false;
        }
        return Date.now() - cacheSnapshot.timestamp > DOCS_CACHE_TTL_MS;
    });
    const [isLoading, setIsLoading] = useState(!cacheSnapshot?.html);
    const [isBackgroundRefresh, setIsBackgroundRefresh] = useState(false);
    const [error, setError] = useState(null);
    const [attempts, setAttempts] = useState(0);
    const [docsTheme, setDocsTheme] = useState(() => {
        if (typeof document === 'undefined') {
            return 'dark';
        }
        return document.documentElement.dataset.theme || 'dark';
    });
    const navigate = useNavigate();
    const contentRef = useRef(null);
    const htmlRef = useRef(cacheSnapshot?.html || '');

    useEffect(() => {
        htmlRef.current = htmlContent;
    }, [htmlContent]);

    const fetchDocumentation = useCallback(async () => {
        const hasExistingContent = !!htmlRef.current;
        setIsLoading(!hasExistingContent);
        setIsBackgroundRefresh(hasExistingContent);
        setError(null);

        let aborted = false;
        try {
            const mediaMatch = typeof window !== 'undefined' ? window.matchMedia('(max-width: 640px)').matches : false;
            const uaMobile = typeof navigator !== 'undefined' ? (navigator?.userAgent || '').toLowerCase().includes('mobile') : false;
            const timeoutMs = (mediaMatch || uaMobile) ? 25000 : 40000;

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
            setCachedAt(Date.now());
            setIsCacheStale(false);
            setAttempts(0);
            writeCachedDocumentation(html);
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

            if (htmlRef.current) {
                setIsCacheStale(true);
            }

            setAttempts((prev) => {
                const next = prev + 1;
                if (next === 1 && (aborted || err?.name === 'AbortError')) {
                    setTimeout(() => fetchDocumentation(), 2500);
                }
                return next;
            });
        } finally {
            setIsLoading(false);
            setIsBackgroundRefresh(false);
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
        const container = contentRef.current;
        if (!container) {
            return;
        }

        const docHtml = container.querySelector('html');
        const docBody = container.querySelector('body');

        if (docHtml) {
            docHtml.setAttribute('data-theme', docsTheme);
        }

        if (docBody) {
            if (docsTheme === 'light') {
                docBody.classList.add('light');
            } else {
                docBody.classList.remove('light');
            }
        }

        if (container instanceof HTMLElement) {
            const themeMap = docsTheme === 'light' ? LIGHT_THEME_VARS : DARK_THEME_VARS;
            Object.entries({
                ...DARK_THEME_VARS,
                ...themeMap,
            }).forEach(([key, value]) => {
                container.style.setProperty(key, value);
            });

            container.style.backgroundColor = docsTheme === 'light' ? '#f8fafc' : '#020617';
            container.style.color = docsTheme === 'light' ? '#0f172a' : '#e2e8f0';
        }
    }, [docsTheme, htmlContent]);

    useEffect(() => {
        const container = contentRef.current;
        if (!container) {
            return;
        }

        const extraneousHeader = container.querySelector('header');
        if (extraneousHeader?.parentNode) {
            extraneousHeader.parentNode.removeChild(extraneousHeader);
        }

        const heroSection = container.querySelector('.hero');
        if (heroSection?.parentNode) {
            heroSection.parentNode.removeChild(heroSection);
        }
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

        const sidebar = container?.querySelector('#sidebar');
        if (sidebar instanceof HTMLElement) {
            sidebar.classList.toggle('open');
            return;
        }

        const toggleButton = container?.querySelector('button.sidebar-toggle, button[aria-label*="navigation" i], button[data-sidebar-toggle]')
            || document.querySelector('button.sidebar-toggle, button[aria-label*="navigation" i], button[data-sidebar-toggle]');
        if (toggleButton) {
            toggleButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        }
    }, []);

    const triggerDocsThemeToggle = useCallback(() => {
        const previousTheme = document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
        const container = contentRef.current;
        const themeToggle = container?.querySelector('button.theme-toggle, button[aria-label*="theme" i], button[title*="Switch" i]')
            || document.querySelector('button.theme-toggle, button[aria-label*="theme" i], button[title*="Switch" i]');

        if (themeToggle) {
            themeToggle.dispatchEvent(new MouseEvent('click', { bubbles: true }));

            setTimeout(() => {
                const currentTheme = document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
                if (currentTheme === previousTheme) {
                    const fallbackTheme = previousTheme === 'light' ? 'dark' : 'light';
                    document.documentElement.dataset.theme = fallbackTheme;
                    setDocsTheme(fallbackTheme);
                }
            }, 150);
            return;
        }

        const fallbackTheme = previousTheme === 'light' ? 'dark' : 'light';
        document.documentElement.dataset.theme = fallbackTheme;
        setDocsTheme(fallbackTheme);
    }, [setDocsTheme]);

    useEffect(() => {
        const container = contentRef.current;
        if (!container) {
            return;
        }

        const sidebar = container.querySelector('#sidebar');
        if (!(sidebar instanceof HTMLElement)) {
            return;
        }

        const overlay = document.createElement('div');
        overlay.className = 'te-docs-sidebar-overlay';
        Object.assign(overlay.style, {
            position: 'fixed',
            inset: '0',
            zIndex: '60',
            backgroundColor: docsTheme === 'light' ? 'rgba(255, 255, 255, 0.98)' : 'rgba(0, 0, 0, 0.9)',
            transition: 'opacity 150ms ease, visibility 150ms ease',
            opacity: '0',
            visibility: 'hidden',
            pointerEvents: 'none',
        });
        document.body.appendChild(overlay);

        const mobileQuery = window.matchMedia('(max-width: 1024px)');

        const getDocToggleButton = () => container.querySelector('button.sidebar-toggle, button[aria-label*="navigation" i], button[data-sidebar-toggle]');
        const getExternalToggleButton = () => document.querySelector('[data-docs-sidebar-toggle="true"]');

        const isSidebarOpen = () => {
            if (sidebar.classList.contains('open')) {
                return true;
            }
            const docToggle = getDocToggleButton();
            if (docToggle instanceof HTMLElement) {
                const ariaExpanded = docToggle.getAttribute('aria-expanded');
                if (ariaExpanded === 'true' || docToggle.classList.contains('open') || docToggle.classList.contains('is-open')) {
                    return true;
                }
            }
            return false;
        };

        const isMobile = () => mobileQuery.matches;

        const updateSidebarStyles = () => {
            const open = isSidebarOpen();
            const mobile = isMobile();
            overlay.style.backgroundColor = docsTheme === 'light' ? 'rgba(255, 255, 255, 0.98)' : 'rgba(0, 0, 0, 0.9)';

            if (open && mobile) {
                overlay.style.opacity = '1';
                overlay.style.visibility = 'visible';
                overlay.style.pointerEvents = 'auto';
                sidebar.style.backgroundColor = docsTheme === 'light' ? '#ffffff' : '#000000';
                sidebar.style.boxShadow = '0 20px 60px rgba(0, 0, 0, 0.45)';
                sidebar.style.zIndex = '70';
            } else {
                overlay.style.opacity = '0';
                overlay.style.visibility = 'hidden';
                overlay.style.pointerEvents = 'none';
                sidebar.style.backgroundColor = '';
                sidebar.style.boxShadow = '';
                sidebar.style.zIndex = '';
            }
        };

        const closeSidebar = () => {
            if (!isSidebarOpen()) {
                updateSidebarStyles();
                return;
            }

            if (sidebar.classList.contains('open')) {
                sidebar.classList.remove('open');
            } else {
                const docToggle = getDocToggleButton();
                if (docToggle instanceof HTMLElement) {
                    docToggle.dispatchEvent(new MouseEvent('click', { bubbles: true }));
                } else {
                    const externalToggle = getExternalToggleButton();
                    externalToggle?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
                }
            }

            updateSidebarStyles();
        };

        overlay.addEventListener('click', closeSidebar);

        const handleOutsidePointer = (event) => {
            if (!isMobile() || !isSidebarOpen()) {
                return;
            }
            const target = event.target;
            if (!(target instanceof Element)) {
                closeSidebar();
                return;
            }
            if (sidebar.contains(target)) {
                return;
            }
            if (target.closest('[data-docs-sidebar-toggle]')) {
                return;
            }
            closeSidebar();
        };

        document.addEventListener('pointerdown', handleOutsidePointer);

        const observer = new MutationObserver(updateSidebarStyles);
        observer.observe(sidebar, { attributes: true, attributeFilter: ['class', 'style'] });

        const resizeListener = () => updateSidebarStyles();
        window.addEventListener('resize', resizeListener);
        if (mobileQuery.addEventListener) {
            mobileQuery.addEventListener('change', updateSidebarStyles);
        } else if (mobileQuery.addListener) {
            mobileQuery.addListener(updateSidebarStyles);
        }

        updateSidebarStyles();

        return () => {
            overlay.removeEventListener('click', closeSidebar);
            document.removeEventListener('pointerdown', handleOutsidePointer);
            window.removeEventListener('resize', resizeListener);
            if (mobileQuery.removeEventListener) {
                mobileQuery.removeEventListener('change', updateSidebarStyles);
            } else if (mobileQuery.removeListener) {
                mobileQuery.removeListener(updateSidebarStyles);
            }
            observer.disconnect();
            overlay.remove();
            sidebar.style.backgroundColor = '';
            sidebar.style.boxShadow = '';
            sidebar.style.zIndex = '';
        };
    }, [htmlContent, docsTheme]);

    const isDarkTheme = docsTheme !== 'light';
    const wrapperClass = `min-h-screen flex flex-col ${isDarkTheme ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`;
    const headerClass = `border-b backdrop-blur ${isDarkTheme ? 'border-slate-800 bg-slate-900/80' : 'border-slate-200 bg-white/90'}`;
    const subtitleClass = isDarkTheme ? 'text-slate-400' : 'text-slate-500';
    const navButtonClass = `flex h-10 w-10 items-center justify-center rounded-lg border border-transparent transition-colors ${isDarkTheme ? 'text-slate-300 hover:border-slate-700 hover:text-white' : 'text-slate-500 hover:border-slate-300 hover:text-slate-900'
        }`;
    const loaderTextClass = isDarkTheme ? 'text-slate-400' : 'text-slate-500';
    const skeletonBaseClass = isDarkTheme ? 'bg-slate-800/60' : 'bg-slate-200';
    const skeletonMidClass = isDarkTheme ? 'bg-slate-800/50' : 'bg-slate-200/90';
    const skeletonLowClass = isDarkTheme ? 'bg-slate-800/40' : 'bg-slate-200/80';
    const errorCardClass = `rounded-xl border px-6 py-6 text-center shadow max-w-md w-full backdrop-blur ${isDarkTheme ? 'border-slate-800/80 bg-slate-900/80 text-white' : 'border-slate-200 bg-white/90 text-slate-900'
        }`;
    const errorTextClass = isDarkTheme ? 'text-slate-400' : 'text-slate-500';
    const inlineBannerClass = `mx-auto mb-4 w-full max-w-5xl rounded-xl border px-4 py-3 text-sm backdrop-blur ${isDarkTheme ? 'border-slate-800 bg-slate-900/70 text-slate-100' : 'border-slate-200 bg-white text-slate-900'}`;
    const inlineBannerTextMuted = isDarkTheme ? 'text-slate-400' : 'text-slate-500';
    const inlineBannerAccent = isDarkTheme ? 'text-sky-300' : 'text-sky-600';
    const inlineButtonClass = `rounded-lg border px-3 py-1 text-xs font-semibold transition-colors ${isDarkTheme ? 'border-slate-700 text-slate-100 hover:bg-slate-800' : 'border-slate-300 text-slate-700 hover:bg-slate-50'}`;
    const inlinePrimaryButtonClass = 'rounded-lg bg-sky-500 px-3 py-1 text-xs font-semibold text-slate-900 hover:bg-sky-400';
    const hasContent = Boolean(htmlContent);
    const showSkeleton = isLoading && !hasContent;
    const showBlockingError = Boolean(error) && !hasContent;
    const showInlineError = Boolean(error) && hasContent;
    const showStaleCopy = isCacheStale && hasContent;
    const showRefreshNotice = isBackgroundRefresh && hasContent;
    const shouldShowInlineBanner = showInlineError || showStaleCopy || showRefreshNotice;
    const cacheLabel = cachedAt ? formatCacheTimestamp(cachedAt) : '';

    return (
        <div className={wrapperClass}>
            <header className={headerClass}>
                <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
                    <button
                        type="button"
                        onClick={() => navigate('/')}
                        className="flex items-center gap-3 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 rounded-lg"
                    >
                        <img
                            src="/te-logo.png"
                            alt="TechElevate logo"
                            className="h-10 w-10 select-none"
                        />
                        <div className="flex flex-col text-left">
                            <span className={`text-xs font-medium uppercase tracking-widest ${subtitleClass}`}>TechElevate</span>
                            <span className="text-base font-semibold">Documentation</span>
                        </div>
                    </button>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => navigate('/')}
                            className={navButtonClass}
                            title="Back to home"
                        >
                            <HomeIcon className="h-5 w-5" />
                        </button>
                        <button
                            type="button"
                            onClick={triggerDocsSidebar}
                            className={navButtonClass}
                            title="Toggle documentation navigation"
                            data-docs-sidebar-toggle="true"
                        >
                            <Bars3Icon className="h-5 w-5" />
                        </button>
                        <button
                            type="button"
                            onClick={triggerDocsThemeToggle}
                            className={navButtonClass}
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
                {showSkeleton ? (
                    <div className="flex h-full items-center justify-center px-4">
                        <div className="w-full max-w-md space-y-4">
                            <div className="flex items-center gap-3">
                                <div className={`h-10 w-10 animate-spin rounded-full border-4 border-t-transparent ${isDarkTheme ? 'border-sky-500' : 'border-sky-400'}`} />
                                <p className={`text-sm ${loaderTextClass}`}>Loading documentation…</p>
                            </div>
                            <div className="space-y-2">
                                <div className={`h-4 w-5/6 rounded ${skeletonBaseClass}`} />
                                <div className={`h-4 w-4/6 rounded ${skeletonMidClass}`} />
                                <div className={`h-4 w-3/5 rounded ${skeletonLowClass}`} />
                            </div>
                        </div>
                    </div>
                ) : showBlockingError ? (
                    <div className="flex h-full items-center justify-center px-4">
                        <div className={errorCardClass}>
                            <h2 className="text-base font-semibold">{attempts > 0 ? 'Retrying…' : 'Load issue'}</h2>
                            <p className={`mt-2 text-xs sm:text-sm ${errorTextClass}`}>{error}</p>
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
                                    className={`rounded-lg border px-4 py-2 text-xs font-semibold transition-colors ${isDarkTheme ? 'border-slate-700 text-slate-200 hover:bg-slate-800' : 'border-slate-300 text-slate-700 hover:bg-slate-100'
                                        }`}
                                >
                                    Back home
                                </button>
                                <a
                                    href={documentationUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`rounded-lg border px-4 py-2 text-xs font-semibold transition-colors ${isDarkTheme ? 'border-slate-700 text-slate-200 hover:bg-slate-800' : 'border-slate-300 text-slate-700 hover:bg-slate-100'
                                        }`}
                                >
                                    Open docs
                                </a>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex h-full flex-col">
                        {shouldShowInlineBanner && (
                            <div className={inlineBannerClass}>
                                <div className="flex flex-col gap-3 text-left sm:flex-row sm:items-center sm:justify-between">
                                    <div className="space-y-1">
                                        {showInlineError && (
                                            <p className="font-medium">{error}</p>
                                        )}
                                        {showStaleCopy && (
                                            <p className={`text-xs ${inlineBannerTextMuted}`}>
                                                Showing cached copy{cacheLabel ? ` from ${cacheLabel}` : ''}. We'll refresh automatically once your connection stabilizes.
                                            </p>
                                        )}
                                        {showRefreshNotice && (
                                            <p className={`text-xs font-semibold ${inlineBannerAccent}`}>
                                                Refreshing latest documentation…
                                            </p>
                                        )}
                                        {!showStaleCopy && !showInlineError && cacheLabel && (
                                            <p className={`text-xs ${inlineBannerTextMuted}`}>
                                                Last updated {cacheLabel}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap gap-2 sm:justify-end">
                                        <button
                                            type="button"
                                            onClick={fetchDocumentation}
                                            className={inlinePrimaryButtonClass}
                                        >
                                            Refresh now
                                        </button>
                                        <a
                                            href={documentationUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={inlineButtonClass}
                                        >
                                            Open full page
                                        </a>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div
                            ref={contentRef}
                            dangerouslySetInnerHTML={{ __html: htmlContent }}
                            className="w-full h-full"
                        />
                    </div>
                )}
            </main>
        </div>
    );
};

export default Documentation;
