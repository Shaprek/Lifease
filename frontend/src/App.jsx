import { useEffect, useState } from 'react';
import Home from './pages/Home';

const STORAGE_KEY = 'theme';

export default function App() {
    const [theme, setTheme] = useState('dark');

    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored === 'light' || stored === 'dark') {
                setTheme(stored);
                document.documentElement.setAttribute('data-theme', stored);
                return;
            }

            // Fallback to system preference
            const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
            const initial = prefersLight ? 'light' : 'dark';
            setTheme(initial);
            document.documentElement.setAttribute('data-theme', initial);
        } catch (e) {
            document.documentElement.setAttribute('data-theme', 'dark');
        }
    }, []);

    useEffect(() => {
        try {
            document.documentElement.setAttribute('data-theme', theme);
            localStorage.setItem(STORAGE_KEY, theme);
        } catch (e) {
            // ignore write errors
        }
    }, [theme]);

    function toggleTheme() {
        setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
    }

    return <Home theme={theme} toggleTheme={toggleTheme} />;
}