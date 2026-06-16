import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import TypingMessage from './TypingMessage';

export default function Message({ role, content, timestamp, isTyping = false, fullText = '', onTypingComplete }) {
    const isUser = role === 'user';
    const [copied, setCopied] = useState(false);

    const displayed = content || fullText || '';

    const formattedTime = timestamp ? new Date(timestamp).toLocaleString() : '';

    async function handleCopy() {
        try {
            if (!navigator.clipboard) throw new Error('Clipboard not supported');
            await navigator.clipboard.writeText(displayed);
            setCopied(true);
            setTimeout(() => setCopied(false), 1600);
        } catch (err) {
            // best-effort fallback: select and copy using execCommand (rarely needed)
            try {
                const el = document.createElement('textarea');
                el.value = displayed;
                el.setAttribute('readonly', '');
                el.style.position = 'absolute';
                el.style.left = '-9999px';
                document.body.appendChild(el);
                el.select();
                document.execCommand('copy');
                document.body.removeChild(el);
                setCopied(true);
                setTimeout(() => setCopied(false), 1600);
            } catch (e) {
                console.warn('Copy failed', e);
            }
        }
    }

    return (
        <article className={`message ${isUser ? 'message-user' : 'message-ai'}`}>
            <div className="message-label">{isUser ? 'User' : 'AI'}</div>

            {/* Copy button for AI messages (not while typing) */}
            {!isUser && !isTyping ? (
                <button
                    className={`copy-btn ${copied ? 'copy-success' : ''}`}
                    onClick={handleCopy}
                    aria-label={copied ? 'Copied' : 'Copy response'}
                    title={copied ? 'Copied' : 'Copy response'}
                >
                    {copied ? '✓ Copied' : 'Copy'}
                </button>
            ) : null}

            <div className="message-content">
                {isTyping ? (
                    <TypingMessage text={fullText} onComplete={onTypingComplete} />
                ) : (
                    // Render AI responses as sanitized Markdown. For user messages we show plain text.
                    (!isUser) ? (
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            rehypePlugins={[rehypeSanitize]}
                            components={{
                                a: ({ node, ...props }) => (
                                    // open links in new tab safely
                                    <a {...props} target="_blank" rel="noopener noreferrer" />
                                ),
                                code({ node, inline, className, children, ...props }) {
                                    if (inline) {
                                        return <code className={className} {...props}>{children}</code>;
                                    }
                                    return (
                                        <pre {...props}>
                                            <code className={className}>{children}</code>
                                        </pre>
                                    );
                                }
                            }}
                        >
                            {displayed}
                        </ReactMarkdown>
                    ) : (
                        // user message: plain text
                        displayed
                    )
                )}
            </div>
            {formattedTime ? <div className="message-timestamp">{formattedTime}</div> : null}
        </article>
    );
}