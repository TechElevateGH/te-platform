import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HomeIcon, Bars3Icon } from 'icons';
import { MoonIcon, SunIcon } from 'icons';

const DARK_THEME_VARS = {
    '--bg-primary': '#191919',
    '--bg-secondary': '#202020',
    '--bg-tertiary': '#2a2a2a',
    '--surface': '#202020',
    '--border': 'rgba(255, 255, 255, 0.12)',
    '--bg': 'rgba(25, 25, 25, 0.85)',
    '--text': '#ededec',
    '--text-secondary': 'rgba(237, 237, 236, 0.72)',
    '--text-muted': 'rgba(237, 237, 236, 0.56)',
    '--heading': '#ffffff',
    '--accent': '#3fbf6f',
    '--accent-hover': '#64d58b',
    '--accent-blue': '#3fbf6f',
    '--accent-soft': 'rgba(63, 191, 111, 0.18)',
    '--link': '#3fbf6f',
    '--code-bg': 'rgba(0, 0, 0, 0.4)',
    '--success': '#3fbf6f',
    '--success-soft': 'rgba(63, 191, 111, 0.16)',
    '--warning': '#c4880a',
    '--warning-soft': 'rgba(196, 136, 10, 0.18)',
    '--error': '#ce1126',
    '--error-soft': 'rgba(206, 17, 38, 0.16)',
    '--sidebar-width': '280px',
};

const LIGHT_THEME_VARS = {
    '--bg-primary': '#ffffff',
    '--bg-secondary': '#f7f7f6',
    '--bg-tertiary': '#e8e8e6',
    '--surface': '#f7f7f6',
    '--border': 'rgba(15, 15, 15, 0.10)',
    '--bg': 'rgba(255, 255, 255, 0.9)',
    '--text': '#1f2024',
    '--text-secondary': '#4a4a4a',
    '--text-muted': '#6b6b6b',
    '--heading': '#111111',
    '--accent': '#0e7a3d',
    '--accent-hover': '#0a5a2d',
    '--accent-blue': '#0e7a3d',
    '--accent-soft': 'rgba(14, 122, 61, 0.12)',
    '--link': '#0e7a3d',
    '--code-bg': 'rgba(0, 0, 0, 0.05)',
    '--success': '#0e7a3d',
    '--success-soft': 'rgba(14, 122, 61, 0.10)',
    '--warning': '#c4880a',
    '--warning-soft': 'rgba(196, 136, 10, 0.14)',
    '--error': '#ce1126',
    '--error-soft': 'rgba(206, 17, 38, 0.10)',
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

            container.style.backgroundColor = 'var(--bg-primary)';
            container.style.color = 'var(--text)';
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
                sidebar.style.backgroundColor = 'var(--bg-primary)';
                sidebar.style.boxShadow = 'none';
                sidebar.style.borderRight = '1px solid var(--border)';
                sidebar.style.zIndex = '70';
            } else {
                overlay.style.opacity = '0';
                overlay.style.visibility = 'hidden';
                overlay.style.pointerEvents = 'none';
                sidebar.style.backgroundColor = '';
                sidebar.style.boxShadow = '';
                sidebar.style.borderRight = '';
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
            sidebar.style.borderRight = '';
            sidebar.style.zIndex = '';
        };
    }, [htmlContent, docsTheme]);

    const themeVars = {
        ...DARK_THEME_VARS,
        ...(docsTheme === 'light' ? LIGHT_THEME_VARS : DARK_THEME_VARS),
    };
    const wrapperClass = 'te-docs-shell min-h-screen flex flex-col bg-[var(--bg-primary)] text-[var(--text)]';
    const headerClass = 'sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--bg)] backdrop-blur';
    const subtitleClass = 'te-eyebrow text-[var(--warning)]';
    const navButtonClass = 'inline-flex h-10 w-10 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] transition-colors hover:bg-[var(--accent-soft)] hover:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-primary)]';
    const loaderTextClass = 'font-mono text-sm uppercase tracking-[0.18em] text-[var(--text-muted)]';
    const skeletonBaseClass = 'bg-[var(--bg-tertiary)]';
    const skeletonMidClass = 'bg-[var(--border)]';
    const skeletonLowClass = 'bg-[var(--code-bg)]';
    const errorCardClass = 'w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-6 py-6 text-center text-[var(--text)] shadow-sm';
    const errorTextClass = 'text-[var(--text-muted)]';
    const inlineBannerClass = 'mx-auto mb-4 w-full max-w-5xl rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text)] shadow-sm';
    const inlineBannerTextMuted = 'text-[var(--text-muted)]';
    const inlineBannerAccent = 'font-mono uppercase tracking-[0.18em] text-[var(--accent)]';
    const inlineButtonClass = 'te-btn-secondary te-btn-sm';
    const inlinePrimaryButtonClass = 'te-btn-primary te-btn-sm';
    const hasContent = Boolean(htmlContent);
    const showSkeleton = isLoading && !hasContent;
    const showBlockingError = Boolean(error) && !hasContent;
    const showInlineError = Boolean(error) && hasContent;
    const showStaleCopy = isCacheStale && hasContent;
    const showRefreshNotice = isBackgroundRefresh && hasContent;
    const shouldShowInlineBanner = showInlineError || showStaleCopy || showRefreshNotice;
    const cacheLabel = cachedAt ? formatCacheTimestamp(cachedAt) : '';

    return (
        <div className={wrapperClass} style={themeVars}>
            <style>{`
                .te-docs-shell {
                    color: var(--text);
                    background: var(--bg-primary);
                }
                .te-docs-shell .te-docs-content,
                .te-docs-shell .te-docs-content * {
                    border-color: var(--border);
                }
                .te-docs-shell .te-docs-content {
                    min-height: 100%;
                    background: var(--bg-primary);
                    color: var(--text);
                    font-family: var(--font-sans, 'IBM Plex Sans', ui-sans-serif, system-ui, sans-serif);
                }
                .te-docs-shell .te-docs-content h1,
                .te-docs-shell .te-docs-content h2,
                .te-docs-shell .te-docs-content h3,
                .te-docs-shell .te-docs-content h4,
                .te-docs-shell .te-docs-content h5,
                .te-docs-shell .te-docs-content h6 {
                    color: var(--heading);
                    font-family: var(--font-display, 'JetBrains Mono', ui-monospace, monospace);
                    letter-spacing: -0.03em;
                }
                .te-docs-shell .te-docs-content a {
                    color: var(--link);
                    text-decoration-color: var(--border);
                    text-underline-offset: 3px;
                }
                .te-docs-shell .te-docs-content a:hover {
                    color: var(--accent-hover);
                    background: var(--accent-soft);
                }
                .te-docs-shell .te-docs-content [class*="text-blue"],
                .te-docs-shell .te-docs-content [class*="text-sky"],
                .te-docs-shell .te-docs-content [class*="text-cyan"],
                .te-docs-shell .te-docs-content [class*="text-indigo"],
                .te-docs-shell .te-docs-content [class*="text-violet"],
                .te-docs-shell .te-docs-content [class*="text-purple"],
                .te-docs-shell .te-docs-content [class*="text-teal"],
                .te-docs-shell .te-docs-content [class*="text-emerald"],
                .te-docs-shell .te-docs-content [class*="text-lime"] {
                    color: var(--accent) !important;
                }
                .te-docs-shell .te-docs-content [class*="bg-blue"],
                .te-docs-shell .te-docs-content [class*="bg-sky"],
                .te-docs-shell .te-docs-content [class*="bg-cyan"],
                .te-docs-shell .te-docs-content [class*="bg-indigo"],
                .te-docs-shell .te-docs-content [class*="bg-violet"],
                .te-docs-shell .te-docs-content [class*="bg-purple"],
                .te-docs-shell .te-docs-content [class*="bg-teal"],
                .te-docs-shell .te-docs-content [class*="bg-emerald"],
                .te-docs-shell .te-docs-content [class*="bg-lime"] {
                    background: var(--success-soft) !important;
                }
                .te-docs-shell .te-docs-content [class*="border-blue"],
                .te-docs-shell .te-docs-content [class*="border-sky"],
                .te-docs-shell .te-docs-content [class*="border-cyan"],
                .te-docs-shell .te-docs-content [class*="border-indigo"],
                .te-docs-shell .te-docs-content [class*="border-violet"],
                .te-docs-shell .te-docs-content [class*="border-purple"],
                .te-docs-shell .te-docs-content [class*="border-teal"],
                .te-docs-shell .te-docs-content [class*="border-emerald"],
                .te-docs-shell .te-docs-content [class*="border-lime"] {
                    border-color: var(--success) !important;
                }
                .te-docs-shell .te-docs-content [class*="text-amber"],
                .te-docs-shell .te-docs-content [class*="text-yellow"],
                .te-docs-shell .te-docs-content [class*="text-orange"] {
                    color: var(--warning) !important;
                }
                .te-docs-shell .te-docs-content [class*="bg-amber"],
                .te-docs-shell .te-docs-content [class*="bg-yellow"],
                .te-docs-shell .te-docs-content [class*="bg-orange"] {
                    background: var(--warning-soft) !important;
                }
                .te-docs-shell .te-docs-content [class*="border-amber"],
                .te-docs-shell .te-docs-content [class*="border-yellow"],
                .te-docs-shell .te-docs-content [class*="border-orange"] {
                    border-color: var(--warning) !important;
                }
                .te-docs-shell .te-docs-content [class*="text-red"],
                .te-docs-shell .te-docs-content [class*="text-rose"],
                .te-docs-shell .te-docs-content [class*="text-pink"] {
                    color: var(--error) !important;
                }
                .te-docs-shell .te-docs-content [class*="bg-red"],
                .te-docs-shell .te-docs-content [class*="bg-rose"],
                .te-docs-shell .te-docs-content [class*="bg-pink"] {
                    background: var(--error-soft) !important;
                }
                .te-docs-shell .te-docs-content [class*="border-red"],
                .te-docs-shell .te-docs-content [class*="border-rose"],
                .te-docs-shell .te-docs-content [class*="border-pink"] {
                    border-color: var(--error) !important;
                }
                .te-docs-shell .te-docs-content code,
                .te-docs-shell .te-docs-content pre,
                .te-docs-shell .te-docs-content kbd,
                .te-docs-shell .te-docs-content samp {
                    font-family: var(--font-mono, 'JetBrains Mono', ui-monospace, monospace);
                }
                .te-docs-shell .te-docs-content pre,
                .te-docs-shell .te-docs-content code {
                    background: var(--code-bg);
                    color: var(--text);
                    border-color: var(--border);
                }
                .te-docs-shell .te-docs-content pre {
                    border: 1px solid var(--border);
                    border-radius: 1rem;
                    box-shadow: none;
                }
                .te-docs-shell .te-docs-content table,
                .te-docs-shell .te-docs-content th,
                .te-docs-shell .te-docs-content td,
                .te-docs-shell .te-docs-content blockquote {
                    border-color: var(--border);
                }
                .te-docs-shell .te-docs-content blockquote,
                .te-docs-shell .te-docs-content .card,
                .te-docs-shell .te-docs-content .panel {
                    background: var(--surface);
                    color: var(--text);
                    border-color: var(--border);
                    box-shadow: none;
                }
                .te-docs-shell .te-docs-content .callout,
                .te-docs-shell .te-docs-content .admonition,
                .te-docs-shell .te-docs-content .alert {
                    background: var(--surface);
                    color: var(--text);
                    border: 1px solid var(--border);
                    box-shadow: none;
                }
                .te-docs-shell .te-docs-content .callout-info,
                .te-docs-shell .te-docs-content .callout-note,
                .te-docs-shell .te-docs-content .admonition-info,
                .te-docs-shell .te-docs-content .admonition-note,
                .te-docs-shell .te-docs-content .alert-info,
                .te-docs-shell .te-docs-content .alert-success,
                .te-docs-shell .te-docs-content .callout-success,
                .te-docs-shell .te-docs-content .admonition-success {
                    background: var(--success-soft);
                    border-color: var(--success);
                }
                .te-docs-shell .te-docs-content .callout-warning,
                .te-docs-shell .te-docs-content .admonition-warning,
                .te-docs-shell .te-docs-content .alert-warning {
                    background: var(--warning-soft);
                    border-color: var(--warning);
                }
                .te-docs-shell .te-docs-content .callout-danger,
                .te-docs-shell .te-docs-content .callout-error,
                .te-docs-shell .te-docs-content .admonition-danger,
                .te-docs-shell .te-docs-content .admonition-error,
                .te-docs-shell .te-docs-content .alert-danger,
                .te-docs-shell .te-docs-content .alert-error {
                    background: var(--error-soft);
                    border-color: var(--error);
                }
                .te-docs-shell .te-docs-content #sidebar,
                .te-docs-shell .te-docs-content aside,
                .te-docs-shell .te-docs-content nav {
                    background: var(--bg-primary);
                    border-color: var(--border);
                    color: var(--text-secondary);
                }
                .te-docs-shell .te-docs-content #sidebar a,
                .te-docs-shell .te-docs-content nav a {
                    color: var(--text-secondary);
                    border-radius: 0.75rem;
                }
                .te-docs-shell .te-docs-content #sidebar a:hover,
                .te-docs-shell .te-docs-content nav a:hover,
                .te-docs-shell .te-docs-content #sidebar a.active,
                .te-docs-shell .te-docs-content nav a.active,
                .te-docs-shell .te-docs-content #sidebar [aria-current='page'],
                .te-docs-shell .te-docs-content nav [aria-current='page'] {
                    background: var(--accent-soft);
                    color: var(--accent);
                }
                .te-docs-shell .te-docs-content button,
                .te-docs-shell .te-docs-content input,
                .te-docs-shell .te-docs-content select,
                .te-docs-shell .te-docs-content textarea {
                    border-color: var(--border);
                    box-shadow: none;
                }
                .te-docs-shell .te-docs-content button:not(.sidebar-toggle):not(.theme-toggle) {
                    background: var(--surface);
                    color: var(--text);
                }
                .te-docs-shell .te-docs-content button:hover {
                    background: var(--accent-soft);
                    color: var(--accent);
                }
            `}</style>
            <header className={headerClass}>
                <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
                    <button
                        type="button"
                        onClick={() => navigate('/')}
                        className="flex items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-primary)]"
                    >
                        <img
                            src="/te-mark.svg"
                            alt="TechElevate logo"
                            className="h-10 w-10 select-none"
                        />
                        <div className="flex flex-col text-left">
                            <span className={subtitleClass}>TechElevate</span>
                            <span className="font-mono text-base font-semibold uppercase tracking-[-0.02em] text-[var(--heading)]">Documentation</span>
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
                                <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--accent)]" />
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
                            <h2 className="font-mono text-base font-semibold uppercase tracking-[-0.02em] text-[var(--heading)]">{attempts > 0 ? 'Retrying…' : 'Load issue'}</h2>
                            <p className={`mt-2 text-xs sm:text-sm ${errorTextClass}`}>{error}</p>
                            <div className="mt-4 flex flex-wrap gap-2 justify-center">
                                <button
                                    type="button"
                                    onClick={fetchDocumentation}
                                    className="te-btn-primary te-btn-sm"
                                >
                                    Retry now
                                </button>
                                <button
                                    type="button"
                                    onClick={() => navigate('/')}
                                    className="te-btn-secondary te-btn-sm"
                                >
                                    Back home
                                </button>
                                <a
                                    href={documentationUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="te-btn-secondary te-btn-sm"
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
                            className="te-docs-content w-full h-full"
                        />
                    </div>
                )}
            </main>
        </div>
    );
};

export default Documentation;
