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
