export const setNestedPropertyValue = (obj, path, value) => {
    if (!path) {
        return obj;
    }

    const properties = path.split('.');
    const lastProperty = properties.pop();

    const target = properties.reduce((nested, property) => {
        const key = property; // Keep naming obvious even for array indices

        if (nested[key] === undefined || nested[key] === null) {
            nested[key] = {};
        }

        return nested[key];
    }, obj);

    target[lastProperty] = value;
    return obj;
};

export const copyTextToClipboard = async (text) => {
    if (typeof navigator?.clipboard?.writeText !== 'function') {
        console.warn('Clipboard API unavailable in this browser context');
        return false;
    }

    await navigator.clipboard.writeText(text);
    return true;
};

/**
 * Get Clearbit logo URL for a company
 * @param {string} companyName - The company name
 * @returns {string} The Clearbit logo URL
 */
export const getCompanyLogoUrl = (companyName) => {
    if (!companyName) return '';
    const domain = companyName.toLowerCase().replace(/\s+/g, '');
    return `https://logo.clearbit.com/${domain}.com`;
};

/**
 * Default company logo placeholder (data URI for a generic building/company icon)
 */
export const DEFAULT_COMPANY_LOGO = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIGZpbGw9IiNGM0Y0RjYiLz4KICA8cGF0aCBkPSJNMTYgMTJIMzJWMzZIMTZWMTJaIiBmaWxsPSIjOUM5Q0EzIi8+CiAgPHBhdGggZD0iTTE4IDE2SDIyVjIwSDE4VjE2WiIgZmlsbD0id2hpdGUiLz4KICA8cGF0aCBkPSJNMjYgMTZIMzBWMjBIMjZWMTZaIiBmaWxsPSJ3aGl0ZSIvPgogIDxwYXRoIGQ9Ik0xOCAyNEgyMlYyOEgxOFYyNFoiIGZpbGw9IndoaXRlIi8+CiAgPHBhdGggZD0iTTI2IDI0SDMwVjI4SDI2VjI0WiIgZmlsbD0id2hpdGUiLz4KICA8cGF0aCBkPSJNMjAgMzJIMjhWMzZIMjBWMzJaIiBmaWxsPSIjNkI3MjgwIi8+Cjwvc3ZnPgo=';

/**
 * Handle company logo error by setting default image
 * @param {Event} e - The error event
 */
export const handleCompanyLogoError = (e) => {
    if (e.target.src !== DEFAULT_COMPANY_LOGO) {
        console.warn('Failed to load company logo:', e.target.src);
        e.target.src = DEFAULT_COMPANY_LOGO;
        e.target.onerror = null; // Prevent infinite loop
    }
};
