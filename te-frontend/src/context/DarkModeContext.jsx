import { createContext, useContext, useState, useEffect } from 'react';

const DarkModeContext = createContext();

export const useDarkMode = () => {
    const context = useContext(DarkModeContext);
    if (!context) {
        throw new Error('useDarkMode must be used within a DarkModeProvider');
    }
    return context;
};

export const DarkModeProvider = ({ children }) => {
    const [darkMode, setDarkMode] = useState(() => {
        // Check localStorage first, default to false
        const saved = localStorage.getItem('appDarkMode');
        return saved === 'true';
    });

    useEffect(() => {
        // Save to localStorage
        localStorage.setItem('appDarkMode', darkMode);

        // Apply to document
        if (darkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [darkMode]);

    const toggleDarkMode = () => {
        setDarkMode(prev => !prev);
    };

    return (
        <DarkModeContext.Provider value={{ darkMode, setDarkMode, toggleDarkMode }}>
            {children}
        </DarkModeContext.Provider>
    );
};
