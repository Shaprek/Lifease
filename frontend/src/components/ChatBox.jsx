import { useEffect, useRef, useState } from 'react';
import Message from './Message';
import Loader from './Loader';
import { getConversations, sendQuestion, searchConversations } from '../services/api';
import StatsCards from './StatsCards';

export default function ChatBox({ theme, toggleTheme }) {
    const [question, setQuestion] = useState('');
    const [messages, setMessages] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(true);
    const [initialHistory, setInitialHistory] = useState([]);
    const [newMessages, setNewMessages] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchError, setSearchError] = useState('');
    const [loading, setLoading] = useState(false);
    const [statsRefresh, setStatsRefresh] = useState(0);
    const [error, setError] = useState('');
    const messagesEndRef = useRef(null);

    useEffect(() => {
        // Scroll when messages or loading states change (including history load)
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading, historyLoading]);

    useEffect(() => {
        // Load conversation history once on mount. Do not reload on subsequent renders.
        async function fetchConversationHistory() {
            setHistoryLoading(true);
            try {
                const data = await getConversations();

                if (!data || !data.success || !Array.isArray(data.conversations)) {
                    setError('Invalid response from history API.');
                    setHistoryLoading(false);
                    return;
                }

                const convs = data.conversations;

                if (convs.length === 0) {
                    setInitialHistory([]);
                    setMessages([]);
                    setHistoryLoading(false);
                    return;
                }

                // Backend returns newest-first; display oldest-first so history reads naturally
                const chronological = [...convs].reverse();

                const historyMessages = [];
                for (const c of chronological) {
                    historyMessages.push({ id: `${c._id}-q`, role: 'user', content: c.question, timestamp: c.timestamp || c.createdAt });
                    historyMessages.push({ id: `${c._id}-a`, role: 'ai', content: c.answer, timestamp: c.timestamp || c.createdAt });
                }

                setInitialHistory(historyMessages);
                setMessages(historyMessages);
            } catch (err) {
                setError('Failed to load conversation history.');
            } finally {
                setHistoryLoading(false);
            }
        }

        fetchConversationHistory();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function normalizeError(error) {
        if (error.response?.data?.message) {
            return error.response.data.message;
        }

        if (error.code === 'ERR_NETWORK') {
            return 'Network failure. Please check that the backend is running.';
        }

        return 'Backend unavailable. Please try again in a moment.';
    }

    async function handleSubmit(event) {
        event.preventDefault();

        const trimmedQuestion = question.trim();

        if (!trimmedQuestion) {
            setError('Please enter a question before sending.');
            return;
        }

        setLoading(true);
        setError('');
        // clear active search when sending new message so conversation view shows latest context
        setSearchQuery('');

        const userMessage = {
            id: crypto.randomUUID(),
            role: 'user',
            content: trimmedQuestion,
            timestamp: new Date().toISOString(),
        };

        setNewMessages((current) => [...current, userMessage]);
        setMessages((currentMessages) => [...currentMessages, userMessage]);

        try {
            const response = await sendQuestion(trimmedQuestion);
            const answer = response?.answer?.trim();

            if (!answer) {
                throw new Error('The backend returned an empty answer.');
            }

            const aiId = response.conversation?._id || crypto.randomUUID();
            const aiMessage = {
                id: aiId,
                role: 'ai',
                content: '',
                fullText: answer,
                typing: true,
                timestamp: response.conversation?.timestamp || new Date().toISOString(),
            };

            setNewMessages((current) => [...current, aiMessage]);
            setMessages((currentMessages) => [...currentMessages, aiMessage]);
            setQuestion('');
            // trigger stats refresh so dashboard updates
            setStatsRefresh((s) => s + 1);
        } catch (requestError) {
            setError(normalizeError(requestError));
            setMessages((currentMessages) => currentMessages.filter((message) => message.id !== userMessage.id));
        } finally {
            setLoading(false);
        }
    }

    function handleKeyDown(event) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleSubmit(event);
        }
    }

    // Debounced search effect
    useEffect(() => {
        if (!searchQuery) {
            // restore full view
            setSearchLoading(false);
            setSearchError('');
            setMessages([...initialHistory, ...newMessages]);
            return;
        }

        const q = searchQuery.trim();
        if (!q) {
            setMessages([...initialHistory, ...newMessages]);
            return;
        }

        let cancelled = false;
        setSearchLoading(true);
        setSearchError('');

        const timer = setTimeout(async () => {
            try {
                const data = await searchConversations(q);
                if (cancelled) return;

                if (!data || !data.success || !Array.isArray(data.conversations)) {
                    setSearchError('Invalid search response');
                    setMessages([]);
                } else {
                    const convs = data.conversations; // backend returns newest-first
                    const resultMessages = [];
                    for (const c of convs) {
                        resultMessages.push({ id: `${c._id}-q`, role: 'user', content: c.question, timestamp: c.timestamp || c.createdAt });
                        resultMessages.push({ id: `${c._id}-a`, role: 'ai', content: c.answer, timestamp: c.timestamp || c.createdAt });
                    }

                    setMessages(resultMessages);
                }
            } catch (err) {
                if (!cancelled) {
                    setSearchError('Search failed. Please try again.');
                }
            } finally {
                if (!cancelled) setSearchLoading(false);
            }
        }, 300);

        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchQuery, initialHistory, newMessages]);

    return (
        <div className="chat-card">
            <div className="chat-header">
                <div>
                    <p className="chat-title">Conversation</p>
                    <p className="chat-subtitle">Enter a question and press Send or Enter.</p>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <button
                        onClick={toggleTheme}
                        aria-pressed={theme === 'dark'}
                        className="theme-toggle"
                        title="Toggle color theme"
                    >
                        {theme === 'dark' ? '🌙' : '☀️'}
                    </button>
                    <span className="status-pill">Live</span>
                </div>
            </div>

            <div style={{ marginTop: 12, marginBottom: 6 }}>
                <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search conversations..."
                    className="chat-search"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)' }}
                />
            </div>
            <StatsCards refreshTrigger={statsRefresh} />

            <div className="messages-panel" aria-live="polite">
                {searchQuery ? (
                    searchLoading ? (
                        <div className="empty-state">
                            <h2>Searching conversations...</h2>
                        </div>
                    ) : searchError ? (
                        <div className="empty-state">
                            <h2>Search failed</h2>
                            <p>{searchError}</p>
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="empty-state">
                            <h2>No matching conversations found.</h2>
                        </div>
                    ) : null
                ) : null}
                {historyLoading ? (
                    <div className="empty-state">
                        <h2>Loading conversations...</h2>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="empty-state">
                        <h2>No previous conversations found.</h2>
                        <p>Ask the assistant a question to create the first conversation.</p>
                    </div>
                ) : (
                    messages.map((message) => (
                        <Message
                            key={message.id}
                            role={message.role}
                            content={message.content}
                            timestamp={message.timestamp}
                            isTyping={Boolean(message.typing)}
                            fullText={message.fullText}
                            onTypingComplete={() => {
                                // finalize the typing message
                                setMessages((prev) =>
                                    prev.map((m) => (m.id === message.id ? { ...m, content: m.fullText || m.content, typing: false, fullText: undefined } : m))
                                );
                                setNewMessages((prev) =>
                                    prev.map((m) => (m.id === message.id ? { ...m, content: m.fullText || m.content, typing: false, fullText: undefined } : m))
                                );
                            }}
                        />
                    ))
                )}

                {loading ? <Loader /> : null}
                <div ref={messagesEndRef} />
            </div>

            {error ? <p className="error-banner">{error}</p> : null}

            <form className="chat-form" onSubmit={handleSubmit}>
                <textarea
                    value={question}
                    onChange={(event) => setQuestion(event.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type your question here..."
                    rows={3}
                    disabled={loading}
                />

                <div className="chat-actions">
                    <p className="helper-text">Press Enter to send. Shift+Enter is not needed in this version.</p>
                    <button type="submit" disabled={loading}>
                        {loading ? 'Sending...' : 'Send'}
                    </button>
                </div>
            </form>
        </div>
    );
}