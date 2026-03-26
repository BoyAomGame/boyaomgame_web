import { Link } from 'react-router-dom';
import Footer from './Footer';

const Contact = () => {
    const inquiryTypes = [
        { emoji: "🐛", title: "Bug Reports", description: "Found a bug? Please contact us with:", items: ["Description of the problem", "Steps to reproduce", "Expected vs actual behavior", "Screenshots (if applicable)"] },
        { emoji: "💡", title: "Feature Requests", description: "Have an idea to improve UserLooker? We welcome suggestions!", items: ["Describe your idea and its use case", "Explain how it would benefit users"] },
        { emoji: "🔐", title: "Privacy Requests", description: "For privacy-related requests (data access, correction, deletion):", items: ["Contact the developer directly via Discord", "Include your Discord User ID for verification", "Specify the type of request (access/correction/deletion)"] },
        { emoji: "⚠️", title: "Security Issues", description: "Found a security vulnerability?", items: ["Please contact the developer directly and privately", "Do not share vulnerability details publicly", "Allow time for the issue to be resolved before any disclosure"], isWarning: true },
        { emoji: "❓", title: "General Questions", description: "For general questions about the project:", items: ["Check if your question has been answered previously", "Contact the developer via Discord"] }
    ];

    const responseTimes = [
        { type: "Bug Reports", time: "1-3 business days" },
        { type: "Feature Requests", time: "3-7 business days" },
        { type: "Privacy Requests", time: "1-5 business days" },
        { type: "Security Issues", time: "24-48 hours" }
    ];

    const acknowledgments = [
        "FastAPI - Modern Python web framework",
        "React - JavaScript UI library",
        "MongoDB - NoSQL database",
        "Vite - Next generation frontend tooling"
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100%' }}>
            <div style={{ flex: 1, padding: '40px 20px', maxWidth: '800px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
                {/* Header */}
                <div className="animate-fade-in-up" style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <h1 style={{ marginBottom: '10px' }}>Contact Us</h1>
                    <p style={{ color: '#94a3b8', marginTop: '20px' }}>
                        We'd love to hear from you! Whether you have questions, feedback, or need support, here's how you can reach us.
                    </p>
                </div>

                {/* Developer Info */}
                <div className="card animate-fade-in-up" style={{ marginBottom: '20px', opacity: 0, animationFillMode: 'forwards', animationDelay: '0.1s' }}>
                    <h2 style={{ fontSize: '1.25rem', marginTop: 0, marginBottom: '16px', color: '#60a5fa' }}>Developer Info</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
                        <div>
                            <label style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase' }}>Developer</label>
                            <p style={{ margin: '4px 0 0 0', color: '#4ade80', fontWeight: '600' }}>BoyAomGame</p>
                        </div>
                        <div>
                            <label style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase' }}>Project</label>
                            <p style={{ margin: '4px 0 0 0', color: 'white' }}>UserLooker</p>
                        </div>
                        <div>
                            <label style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase' }}>Contact</label>
                            <p style={{ margin: '4px 0 0 0', color: 'white' }}>Discord</p>
                        </div>
                    </div>
                </div>

                {/* Get in Touch */}
                <div className="card animate-fade-in-up" style={{ marginBottom: '20px', opacity: 0, animationFillMode: 'forwards', animationDelay: '0.15s' }}>
                    <h2 style={{ fontSize: '1.25rem', marginTop: 0, marginBottom: '16px', color: '#60a5fa' }}>Get in Touch</h2>
                    <div style={{ marginBottom: '16px' }}>
                        <h3 style={{ fontSize: '1rem', color: '#a78bfa', marginBottom: '8px' }}>Discord (Primary Contact)</h3>
                        <p style={{ color: '#94a3b8', margin: '4px 0' }}>
                            For bug reports, feature requests, or technical questions, please reach out to the developer via Discord.
                        </p>
                        <p style={{ color: '#4ade80', fontWeight: '600', marginTop: '12px' }}>
                            Developer: BoyAomGame
                        </p>
                    </div>
                </div>

                {/* Types of Inquiries */}
                <div className="card animate-fade-in-up" style={{ marginBottom: '20px', opacity: 0, animationFillMode: 'forwards', animationDelay: '0.2s' }}>
                    <h2 style={{ fontSize: '1.25rem', marginTop: 0, marginBottom: '16px', color: '#60a5fa' }}>Types of Inquiries</h2>
                    {inquiryTypes.map((inquiry, index) => (
                        <div
                            key={index}
                            style={{
                                marginBottom: index < inquiryTypes.length - 1 ? '20px' : 0,
                                padding: '16px',
                                backgroundColor: inquiry.isWarning ? 'rgba(248, 113, 113, 0.1)' : '#0f172a',
                                borderRadius: '8px',
                                borderLeft: `3px solid ${inquiry.isWarning ? '#f87171' : '#334155'}`
                            }}
                        >
                            <h3 style={{ fontSize: '1rem', color: inquiry.isWarning ? '#f87171' : '#a78bfa', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span>{inquiry.emoji}</span> {inquiry.title}
                            </h3>
                            <p style={{ color: '#94a3b8', marginBottom: '8px', fontSize: '14px' }}>{inquiry.description}</p>
                            <ul style={{ margin: 0, paddingLeft: '20px', color: '#64748b', fontSize: '14px' }}>
                                {inquiry.items.map((item, itemIndex) => (
                                    <li key={itemIndex} style={{ marginBottom: '4px' }}>{item}</li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Response Time */}
                <div className="card animate-fade-in-up" style={{ marginBottom: '20px', opacity: 0, animationFillMode: 'forwards', animationDelay: '0.25s' }}>
                    <h2 style={{ fontSize: '1.25rem', marginTop: 0, marginBottom: '16px', color: '#60a5fa' }}>Response Time</h2>
                    <p style={{ color: '#94a3b8', marginBottom: '16px' }}>We aim to respond to inquiries within:</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                        {responseTimes.map((item, index) => (
                            <div key={index} style={{ padding: '12px', backgroundColor: '#0f172a', borderRadius: '8px', textAlign: 'center' }}>
                                <p style={{ color: '#64748b', fontSize: '12px', margin: '0 0 4px 0' }}>{item.type}</p>
                                <p style={{ color: '#4ade80', fontWeight: '600', margin: 0 }}>{item.time}</p>
                            </div>
                        ))}
                    </div>
                    <p style={{ color: '#64748b', fontStyle: 'italic', marginTop: '16px', fontSize: '14px' }}>
                        Note: Response times may vary based on complexity and developer availability.
                    </p>
                </div>

                {/* About the Project */}
                <div className="card animate-fade-in-up" style={{ marginBottom: '20px', opacity: 0, animationFillMode: 'forwards', animationDelay: '0.3s' }}>
                    <h2 style={{ fontSize: '1.25rem', marginTop: 0, marginBottom: '16px', color: '#60a5fa' }}>About the Project</h2>
                    <p style={{ color: '#94a3b8', margin: 0 }}>
                        UserLooker is a private, closed-source project developed by BoyAomGame. The service is designed for personal/organization use and is not publicly available for distribution or modification.
                    </p>
                </div>

                {/* Acknowledgments */}
                <div className="card animate-fade-in-up" style={{ marginBottom: '20px', opacity: 0, animationFillMode: 'forwards', animationDelay: '0.35s' }}>
                    <h2 style={{ fontSize: '1.25rem', marginTop: 0, marginBottom: '16px', color: '#60a5fa' }}>Acknowledgments</h2>
                    <p style={{ color: '#94a3b8', marginBottom: '16px' }}>UserLooker is built with the following technologies:</p>
                    <ul style={{ margin: 0, paddingLeft: '20px', color: '#94a3b8' }}>
                        {acknowledgments.map((item, index) => (
                            <li key={index} style={{ marginBottom: '8px' }}>{item}</li>
                        ))}
                    </ul>
                    <p style={{ color: '#a78bfa', marginTop: '16px', fontWeight: '500' }}>
                        Thank you to all users who make this project better through their feedback!
                    </p>
                </div>

                {/* Footer note */}
                <div className="animate-fade-in" style={{ textAlign: 'center', marginTop: '40px', paddingTop: '20px', borderTop: '1px solid #334155', opacity: 0, animationFillMode: 'forwards', animationDelay: '0.5s' }}>
                    <p style={{ color: '#64748b', fontSize: '14px' }}>© 2025 UserLooker by BoyAomGame</p>
                    <p style={{ color: '#a78bfa', fontSize: '14px' }}>Made With ❤️ for the Community</p>
                    <Link to="/"><button style={{ marginTop: '20px' }}>← Back to Home</button></Link>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default Contact;
