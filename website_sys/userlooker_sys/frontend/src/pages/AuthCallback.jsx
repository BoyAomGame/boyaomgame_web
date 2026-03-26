import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function AuthCallback() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    useEffect(() => {
        const token = searchParams.get('token');
        const refresh = searchParams.get('refresh');
        const error = searchParams.get('error');

        if (error) {
            navigate(`/login?error=${encodeURIComponent(error)}`);
            return;
        }

        if (token) {
            login(token, refresh);
            navigate('/dashboard');
        } else {
            navigate('/login?error=No token received');
        }
    }, [searchParams, login, navigate]);

    return (
        <div className="auth-callback">
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Authenticating...</p>
            </div>
            <style>{`
                .auth-callback {
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .loading-container {
                    text-align: center;
                }
                .spinner {
                    width: 48px;
                    height: 48px;
                    border: 4px solid rgba(255, 255, 255, 0.1);
                    border-left-color: #646cff;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin: 0 auto 16px;
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}

export default AuthCallback;
