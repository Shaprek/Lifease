import { useEffect, useRef, useState } from 'react';

export default function TypingMessage({ text = '', speed = 20, onComplete }) {
    const [displayed, setDisplayed] = useState('');
    const idxRef = useRef(0);
    const rafRef = useRef(null);

    useEffect(() => {
        idxRef.current = 0;
        setDisplayed('');

        let lastTime = performance.now();

        function step(now) {
            const elapsed = now - lastTime;
            // determine how many characters to advance based on elapsed time
            const charsToAdvance = Math.max(1, Math.floor(elapsed / speed));
            if (idxRef.current < text.length) {
                idxRef.current = Math.min(text.length, idxRef.current + charsToAdvance);
                setDisplayed(text.slice(0, idxRef.current));
                lastTime = now;
                rafRef.current = requestAnimationFrame(step);
            } else {
                if (onComplete) onComplete();
            }
        }

        rafRef.current = requestAnimationFrame(step);

        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [text, speed]);

    return <span className="typing-text">{displayed}</span>;
}
