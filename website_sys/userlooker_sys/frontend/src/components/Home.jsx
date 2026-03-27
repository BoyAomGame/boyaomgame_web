import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Footer from './Footer';
import ThemeToggle from './ThemeToggle';
import { useEffect, useState } from 'react';

const DisclaimerModal = ({ onClose }) => (
    <>
        {/* Overlay */}
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(6px)',
            zIndex: 1000,
            animation: 'modalFadeIn 0.3s ease'
        }} onClick={onClose} />

        {/* Modal */}
        <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'linear-gradient(145deg, #1e293b, #0f172a)',
            border: '1px solid rgba(251, 191, 36, 0.3)',
            borderRadius: '16px',
            padding: '36px',
            maxWidth: '460px',
            width: '90%',
            zIndex: 1001,
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.5), 0 0 40px rgba(251, 191, 36, 0.08)',
            animation: 'modalFadeInUp 0.4s ease'
        }}>
            {/* Warning icon */}
            <div style={{
                fontSize: '2.5rem',
                textAlign: 'center',
                marginBottom: '16px'
            }}>
                ⚠️
            </div>

            <h2 style={{
                textAlign: 'center',
                color: '#fbbf24',
                fontSize: '1.4rem',
                fontWeight: '700',
                marginBottom: '16px',
                letterSpacing: '-0.01em'
            }}>
                Under Development
            </h2>

            <p style={{
                color: '#94a3b8',
                fontSize: '0.95rem',
                lineHeight: 1.7,
                textAlign: 'center',
                marginBottom: '12px'
            }}>
                This website is currently <strong style={{ color: '#e2e8f0' }}>under active development</strong>. 
                You may encounter bugs, incomplete features, or unexpected behavior.
            </p>

            <p style={{
                color: '#64748b',
                fontSize: '0.85rem',
                lineHeight: 1.6,
                textAlign: 'center',
                marginBottom: '28px'
            }}>
                Data accuracy is not guaranteed during this phase. 
                Please report any issues you find.
            </p>

            <button
                onClick={onClose}
                style={{
                    display: 'block',
                    width: '100%',
                    padding: '14px',
                    fontSize: '1rem',
                    fontWeight: '600',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    border: 'none',
                    color: '#0f172a',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 15px rgba(245, 158, 11, 0.3)'
                }}
            >
                I Understand
            </button>
        </div>

        <style>{`
            @keyframes modalFadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes modalFadeInUp {
                from { opacity: 0; transform: translate(-50%, -45%); }
                to { opacity: 1; transform: translate(-50%, -50%); }
            }
        `}</style>
    </>
);

const Home = () => {
    const { isAuthenticated, loginWithDiscord } = useAuth();
    const navigate = useNavigate();
    const [showDisclaimer, setShowDisclaimer] = useState(false);

    // If already logged in, redirect to dashboard
    useEffect(() => {
        if (isAuthenticated) {
            navigate('/dashboard');
        }
    }, [isAuthenticated, navigate]);

    // Show disclaimer on first visit (per session)
    useEffect(() => {
        const dismissed = sessionStorage.getItem('userlooker_disclaimer_dismissed');
        if (!dismissed) {
            setShowDisclaimer(true);
        }
    }, []);

    const handleDismissDisclaimer = () => {
        setShowDisclaimer(false);
        sessionStorage.setItem('userlooker_disclaimer_dismissed', 'true');
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100%' }}>
            {/* Disclaimer Modal */}
            {showDisclaimer && <DisclaimerModal onClose={handleDismissDisclaimer} />}

            {/* Top right controls */}
            <div className="home-controls" style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 10, display: 'flex', gap: '12px', alignItems: 'center' }}>
                <ThemeToggle />
            </div>

            <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden',
                padding: '20px'
            }}>
                {/* Animated background elements */}
                <div style={{
                    position: 'absolute',
                    width: '300px',
                    height: '300px',
                    background: 'radial-gradient(circle, rgba(100, 108, 255, 0.15) 0%, transparent 70%)',
                    borderRadius: '50%',
                    top: '10%',
                    left: '10%',
                    animation: 'float 6s ease-in-out infinite',
                    pointerEvents: 'none'
                }} />
                <div style={{
                    position: 'absolute',
                    width: '200px',
                    height: '200px',
                    background: 'radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%)',
                    borderRadius: '50%',
                    bottom: '20%',
                    right: '15%',
                    animation: 'float 8s ease-in-out infinite reverse',
                    pointerEvents: 'none'
                }} />

                {/* Main content */}
                <div className="animate-fade-in-up" style={{ zIndex: 1, textAlign: 'center', maxWidth: '600px' }}>
                    <h1 style={{
                        marginBottom: '20px',
                        fontWeight: '700',
                        letterSpacing: '-0.02em',
                        lineHeight: 1.1
                    }}>
                        UserLooker
                    </h1>

                    <p style={{
                        fontSize: '1.1rem',
                        color: '#94a3b8',
                        marginBottom: '40px',
                        lineHeight: 1.6
                    }}>
                        Track user activity across Roblox and Discord.
                        View message history, extensive rank logs, and server participation graphs.
                    </p>

                    <button
                        onClick={loginWithDiscord}
                        style={{
                            padding: '16px 40px',
                            fontSize: '1.2rem',
                            fontWeight: '600',
                            borderRadius: '50px',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            border: 'none',
                            color: 'white',
                            cursor: 'pointer',
                            boxShadow: '0 4px 15px rgba(100, 108, 255, 0.4)',
                            transition: 'all 0.3s ease'
                        }}
                    >
                        Get Started
                    </button>
                </div>

                {/* Subtle hint text */}
                <p
                    className="animate-fade-in delay-400"
                    style={{
                        marginTop: '30px',
                        color: '#64748b',
                        fontSize: '14px',
                        opacity: 0,
                        animationFillMode: 'forwards',
                        zIndex: 1
                    }}
                >
                    Login with Discord to access the search tools
                </p>
            </div>
            <Footer />
        </div>
    );
};

export default Home;
