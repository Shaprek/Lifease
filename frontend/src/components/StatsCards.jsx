import { useEffect, useState } from 'react';
import { getStats } from '../services/api';

export default function StatsCards({ refreshTrigger = 0 }) {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError('');
        getStats()
            .then((res) => {
                if (cancelled) return;
                if (res && res.success) setStats(res.stats);
                else setError('Failed to load stats');
            })
            .catch(() => setError('Failed to load stats'))
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [refreshTrigger]);

    if (loading) return <div className="stats-grid">Loading stats…</div>;
    if (error) return <div className="stats-grid">{error}</div>;

    const { totalConversations, totalQuestions, avgQuestionLength, latestConversationTimestamp } = stats || {};

    return (
        <div className="stats-grid">
            <div className="stat-card">
                <div className="stat-label">Total conversations</div>
                <div className="stat-value">{totalConversations ?? 0}</div>
            </div>

            <div className="stat-card">
                <div className="stat-label">Total questions</div>
                <div className="stat-value">{totalQuestions ?? 0}</div>
            </div>

            <div className="stat-card">
                <div className="stat-label">Avg question length</div>
                <div className="stat-value">{(avgQuestionLength ?? 0).toFixed(1)} chars</div>
            </div>

            <div className="stat-card">
                <div className="stat-label">Latest conversation</div>
                <div className="stat-value">{latestConversationTimestamp ? new Date(latestConversationTimestamp).toLocaleString() : '—'}</div>
            </div>
        </div>
    );
}
