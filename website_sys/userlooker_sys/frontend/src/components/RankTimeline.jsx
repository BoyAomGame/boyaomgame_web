import './RankTimeline.css';

// Classify rank tier for color coding
function getRankTier(rank) {
    if (!rank) return 'unknown';

    const rankUpper = rank.toUpperCase();

    // Generals (OF-7 to OF-10)
    if (rankUpper.includes('GEN') || rankUpper.startsWith('OF-10') ||
        rankUpper.startsWith('OF-9') || rankUpper.startsWith('OF-8') ||
        rankUpper.startsWith('OF-7')) {
        return 'general';
    }

    // Senior Officers (OF-4 to OF-6)
    if (rankUpper.startsWith('OF-6') || rankUpper.startsWith('OF-5') ||
        rankUpper.startsWith('OF-4') || rankUpper.includes('COL') ||
        rankUpper.includes('LTCOL') || rankUpper.includes('MAJ')) {
        return 'senior-officer';
    }

    // Junior Officers (OF-1 to OF-3)
    if (rankUpper.startsWith('OF-3') || rankUpper.startsWith('OF-2') ||
        rankUpper.startsWith('OF-1') || rankUpper.includes('CAPT') ||
        rankUpper.includes('LT')) {
        return 'junior-officer';
    }

    // Enlisted (OR ranks)
    if (rankUpper.startsWith('OR-') || rankUpper.includes('SGT') ||
        rankUpper.includes('CPL') || rankUpper.includes('PVT')) {
        return 'enlisted';
    }

    return 'other';
}

function formatDate(dateString) {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function calculateDuration(currentDate, previousDate) {
    if (!previousDate) return 'Initial Rank';

    const current = new Date(currentDate);
    const previous = new Date(previousDate);
    const diffMs = current - previous;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 1) return 'Same day';
    if (diffDays === 1) return '1 day';
    if (diffDays < 30) return `${diffDays} days`;

    const months = Math.floor(diffDays / 30);
    const remainingDays = diffDays % 30;

    if (months < 12) {
        if (remainingDays > 0) {
            return `${months} month${months > 1 ? 's' : ''}, ${remainingDays} day${remainingDays > 1 ? 's' : ''}`;
        }
        return `${months} month${months > 1 ? 's' : ''}`;
    }

    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;

    if (remainingMonths > 0) {
        return `${years} year${years > 1 ? 's' : ''}, ${remainingMonths} month${remainingMonths > 1 ? 's' : ''}`;
    }
    return `${years} year${years > 1 ? 's' : ''}`;
}

function RankTimeline({ history }) {
    if (!history || history.length === 0) {
        return (
            <div className="timeline-empty">
                <p>No rank history available</p>
            </div>
        );
    }

    return (
        <div className="rank-timeline">
            <div className="timeline-line" />

            {history.map((entry, index) => {
                const tier = getRankTier(entry.new_rank);
                const isLatest = index === 0;
                const previousEntry = history[index + 1];
                const duration = previousEntry
                    ? calculateDuration(entry.recorded_at, previousEntry.recorded_at)
                    : 'Initial Rank';

                return (
                    <div
                        key={index}
                        className={`timeline-entry ${tier} ${isLatest ? 'latest' : ''}`}
                    >
                        <div className="timeline-marker">
                            <div className="marker-dot" />
                        </div>

                        <div className="timeline-content">
                            <div className="timeline-date">
                                {formatDate(entry.recorded_at)}
                            </div>

                            <div className="timeline-ranks">
                                {entry.previous_rank && (
                                    <>
                                        <span className="previous-rank">{entry.previous_rank}</span>
                                        <span className="rank-arrow">→</span>
                                    </>
                                )}
                                <span className="new-rank">{entry.new_rank}</span>
                            </div>

                            {!isLatest && (
                                <div className="timeline-duration">
                                    Held for: {duration}
                                </div>
                            )}

                            {isLatest && (
                                <div className="current-badge">Current</div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

export default RankTimeline;
