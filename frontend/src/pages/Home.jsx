import ChatBox from '../components/ChatBox';

export default function Home({ theme, toggleTheme }) {
    return (
        <main className="app-shell">
            <section className="hero-card">
                <div className="hero-copy">
                    <p className="eyebrow">AI FAQ Assistant</p>
                    <h1>Ask questions and get instant AI answers.</h1>
                    <p className="hero-text">
                        A clean React + Vite chat interface connected to your existing backend APIs.
                    </p>
                </div>
                <ChatBox theme={theme} toggleTheme={toggleTheme} />
            </section>
        </main>
    );
}