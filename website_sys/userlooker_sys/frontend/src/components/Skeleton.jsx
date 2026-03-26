import './Skeleton.css';

function Skeleton({
    width = '100%',
    height = 20,
    borderRadius = 8,
    className = ''
}) {
    return (
        <div
            className={`skeleton ${className}`}
            style={{
                width,
                height: typeof height === 'number' ? `${height}px` : height,
                borderRadius: typeof borderRadius === 'number' ? `${borderRadius}px` : borderRadius
            }}
        />
    );
}

// Pre-built skeleton components
export function ProfileSkeleton() {
    return (
        <div className="skeleton-profile">
            <Skeleton width={80} height={80} borderRadius="50%" />
            <div className="skeleton-profile-info">
                <Skeleton width="60%" height={24} />
                <Skeleton width="40%" height={16} />
            </div>
        </div>
    );
}

export function CardSkeleton() {
    return (
        <div className="skeleton-card">
            <Skeleton height={20} width="70%" />
            <Skeleton height={14} />
            <Skeleton height={14} width="80%" />
        </div>
    );
}

export function TableRowSkeleton({ columns = 4 }) {
    return (
        <div className="skeleton-table-row">
            {Array(columns).fill(0).map((_, i) => (
                <Skeleton key={i} height={16} />
            ))}
        </div>
    );
}

export function MessageSkeleton() {
    return (
        <div className="skeleton-message">
            <div className="skeleton-message-header">
                <Skeleton width={120} height={14} />
                <Skeleton width={80} height={12} />
            </div>
            <Skeleton height={16} />
            <Skeleton height={16} width="85%" />
        </div>
    );
}

export default Skeleton;
