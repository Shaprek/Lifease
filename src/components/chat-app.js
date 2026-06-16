'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { fetchConversations, sendQuestion } from '@/lib/api';

const starterSuggestions = [
    'How do I set this project up locally?',
    'How does the MongoDB conversation storage work?',
    'Can you explain the bonus features I should mention in the interview?',
];

export default function ChatApp() {
    const [question, setQuestion] = useState('');
    const [search, setSearch] = useState('');
    const [conversations, setConversations] = useState([]);
    const [error, setError] = useState('');
    const [isPending, startTransition] = useTransition();
    const [isSending, setIsSending] = useState(false);

    async function loadConversations(searchValue = '') {
        try {
            const response = await fetchConversations(searchValue);
            setConversations(response.conversations || []);
            setError('');
        } catch (requestError) {
            setError(requestError.message);
        }
    }

    useEffect(() => {
        let isActive = true;

        async function initializeConversations() {
            try {
                const response = await fetchConversations();
                if (!isActive) {
                    return;
                }

                setConversations(response.conversations || []);
                setError('');
            } catch (requestError) {
                if (isActive) {
                    setError(requestError.message);
                }
            }
        }

        initializeConversations();

        return () => {
            isActive = false;
        };
    }, []);

    const filteredHint = useMemo(() => {
        if (!search) {
            return 'Search previous questions or answers';
        }

        return `Showing results for “${search}”`;
    }, [search]);

    async function handleSubmit(event) {
        event.preventDefault();
        if (!question.trim()) {
            return;
        }

        setIsSending(true);
        try {
            await sendQuestion(question.trim());
            setQuestion('');
            await loadConversations(search);
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setIsSending(false);
        }
    }

    function handleSearchChange(event) {
        const nextSearch = event.target.value;
        setSearch(nextSearch);
        startTransition(() => {
            loadConversations(nextSearch);
        });
    }

    return (
        <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,214,102,0.18),_transparent_30%),linear-gradient(180deg,#08111f_0%,#111a2e_50%,#050814_100%)] px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
                <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 shadow-2xl shadow-black/30 backdrop-blur">
                    <div className="grid gap-6 p-6 lg:grid-cols-[1.2fr_0.8fr] lg:p-10">
                        <div className="space-y-5">
                            <div className="inline-flex items-center rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-amber-200">
                                AI-Powered FAQ Assistant
                            </div>
                            <div className="space-y-3">
                                <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                                    Interview-ready chatbot with saved conversations and search.
                                </h1>
                                <p className="max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                                    Ask a question, store the answer in MongoDB, browse previous conversations, and explain the architecture clearly during your assessment.
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-3">
                                <label className="block text-sm font-medium text-slate-200" htmlFor="question">
                                    Ask a question
                                </label>
                                <textarea
                                    id="question"
                                    value={question}
                                    onChange={(event) => setQuestion(event.target.value)}
                                    rows={4}
                                    placeholder="Type a question about the assignment, setup, or implementation details..."
                                    className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-amber-300/60 focus:ring-2 focus:ring-amber-300/20"
                                />
                                <div className="flex flex-wrap gap-3">
                                    <button
                                        type="submit"
                                        disabled={isSending}
                                        className="rounded-full bg-amber-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-70"
                                    >
                                        {isSending ? 'Sending...' : 'Ask AI'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => loadConversations(search)}
                                        className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
                                    >
                                        Refresh history
                                    </button>
                                </div>
                            </form>
                        </div>

                        <div className="rounded-[1.75rem] border border-white/10 bg-slate-950/50 p-5">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Bonus features</p>
                                    <h2 className="mt-1 text-lg font-semibold text-white">Implementation highlights</h2>
                                </div>
                                <div className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-semibold text-emerald-300">
                                    MongoDB backed
                                </div>
                            </div>
                            <ul className="mt-5 space-y-3 text-sm text-slate-300">
                                <li className="rounded-2xl border border-white/8 bg-white/5 px-4 py-3">Conversation search across stored question and answer text.</li>
                                <li className="rounded-2xl border border-white/8 bg-white/5 px-4 py-3">Ready for AI provider swapping through the backend adapter.</li>
                                <li className="rounded-2xl border border-white/8 bg-white/5 px-4 py-3">Simple UI flow that is easy to explain in an interview.</li>
                            </ul>
                            <div className="mt-5 grid grid-cols-2 gap-3 text-xs text-slate-400">
                                <div className="rounded-2xl border border-white/8 bg-white/5 p-3">
                                    <div className="text-white">Frontend</div>
                                    React + Next.js App Router
                                </div>
                                <div className="rounded-2xl border border-white/8 bg-white/5 p-3">
                                    <div className="text-white">Backend</div>
                                    Express + MongoDB
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
                    <div className="rounded-[1.75rem] border border-white/10 bg-slate-950/60 p-6 shadow-xl shadow-black/20">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Conversation search</p>
                                <h2 className="mt-1 text-xl font-semibold text-white">Previous conversations</h2>
                            </div>
                            <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">
                                {conversations.length} records
                            </span>
                        </div>

                        <label className="mt-5 block text-sm text-slate-300" htmlFor="search">
                            Search conversations
                        </label>
                        <input
                            id="search"
                            value={search}
                            onChange={handleSearchChange}
                            placeholder={filteredHint}
                            className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-amber-300/60 focus:ring-2 focus:ring-amber-300/20"
                        />

                        <div className="mt-5 space-y-3">
                            {isPending ? (
                                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">Searching...</div>
                            ) : conversations.length ? (
                                conversations.map((entry) => (
                                    <article key={entry._id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                                        <div className="flex items-start justify-between gap-4">
                                            <p className="font-medium text-white">{entry.question}</p>
                                            <time className="shrink-0 text-xs text-slate-400">
                                                {new Date(entry.createdAt).toLocaleString()}
                                            </time>
                                        </div>
                                        <p className="mt-3 text-sm leading-6 text-slate-300">{entry.answer}</p>
                                    </article>
                                ))
                            ) : (
                                <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 px-4 py-8 text-center text-sm text-slate-400">
                                    No conversations yet. Ask the assistant to create the first record.
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="rounded-[1.75rem] border border-white/10 bg-gradient-to-b from-slate-950/80 to-slate-900/50 p-6 shadow-xl shadow-black/20">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Suggested prompts</p>
                                <h2 className="mt-1 text-xl font-semibold text-white">Good interview questions</h2>
                            </div>
                            <span className="rounded-full bg-amber-300/15 px-3 py-1 text-xs font-semibold text-amber-200">
                                Bonus ready
                            </span>
                        </div>

                        <div className="mt-5 space-y-3">
                            {starterSuggestions.map((suggestion) => (
                                <button
                                    key={suggestion}
                                    type="button"
                                    onClick={() => setQuestion(suggestion)}
                                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-left text-sm text-slate-200 transition hover:border-amber-300/40 hover:bg-amber-300/10"
                                >
                                    {suggestion}
                                </button>
                            ))}
                        </div>

                        <div className="mt-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm leading-6 text-emerald-100">
                            <strong className="text-emerald-200">Notes for the interview:</strong> explain the adapter pattern in the server, the database indexes, and how you would swap the placeholder AI responder for OpenAI or another provider.
                        </div>

                        {error ? (
                            <div className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm text-rose-100">
                                {error}
                            </div>
                        ) : null}
                    </div>
                </section>
            </div>
        </main>
    );
}
