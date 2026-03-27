import { Link } from 'react-router-dom';
import Footer from './Footer';

const Privacy = () => {
    const sections = [
        {
            title: "1. Information We Collect",
            content: "We collect and process the following types of information:",
            subsections: [
                { subtitle: "A. Discord Data", items: ["Discord User IDs", "Discord Usernames", "Discord Nicknames (server-specific)", "Message content from public Discord channels", "Message timestamps"] },
                { subtitle: "B. Roblox Data", items: ["Roblox Usernames (extracted from Discord nicknames)", "Military rank information (as displayed in Discord nicknames)"] },
                { subtitle: "C. Derived Information", items: ["First and last message dates", "Total message counts", "Number of servers (guilds) where a user was found", "Rank change history"] }
            ]
        },
        {
            title: "2. How We Collect Data",
            content: "Data is collected through DiscordChatExporter (DCE) JSON exports of public Discord server channels. We do not:",
            items: ["Access private messages or DMs", "Connect to Discord's API in real-time", "Collect passwords or authentication tokens", "Access any private or restricted channels"],
            note: "All data comes from publicly visible messages in Discord servers."
        },
        {
            title: "3. How We Use Your Data",
            content: "We use collected data for the following purposes:",
            items: ["Linking Discord accounts to Roblox usernames", "Tracking military rank progression over time", "Providing user lookup functionality", "Maintaining historical records of user activity", "Analyzing user patterns with AI (optional feature)"]
        },
        {
            title: "4. Data Storage and Security",
            items: ["Data is stored in MongoDB databases", "Access is restricted to authorized personnel only", "We implement reasonable security measures to protect data", "Data is stored on secure servers"]
        },
        {
            title: "5. Data Retention",
            items: ["User data is retained indefinitely for historical tracking purposes", "You may request deletion of your data (see Section 7)", "Deleted data may persist in backups for up to 30 days"]
        },
        {
            title: "6. Data Sharing",
            content: "We do NOT sell, rent, or share your personal data with third parties except:",
            items: ["When required by law or legal process", "To protect our rights or safety", "With your explicit consent"]
        },
        {
            title: "7. Your Rights",
            content: "You have the right to:",
            items: ["Access - Request a copy of your stored data", "Correction - Request correction of inaccurate data", "Deletion - Request deletion of your data", "Objection - Object to processing of your data"],
            note: "To exercise these rights, please contact us (see Section 10)."
        },
        {
            title: "8. Cookies and Tracking",
            content: "Our web application does NOT use:",
            items: ["Cookies", "Tracking pixels", "Analytics services", "Third-party advertising"]
        },
        {
            title: "9. Children's Privacy",
            content: "Our service is not intended for users under the age of 13. We do not knowingly collect data from children under 13. If you believe we have collected data from a child, please contact us immediately."
        },
        {
            title: "10. Contact Us",
            content: "For privacy-related inquiries or to exercise your rights, contact:",
            contact: { developer: "BoyAomGame", platform: "Discord" }
        },
        {
            title: "11. Changes to This Policy",
            content: "We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated \"Last Updated\" date. Continued use of the service after changes constitutes acceptance of the updated policy."
        },
        {
            title: "12. Disclaimer",
            content: "UserLooker is a community tool for tracking Discord/Roblox user data. All data processed comes from publicly accessible Discord messages. We are not affiliated with Discord Inc. or Roblox Corporation."
        }
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100%' }}>
            <div style={{ flex: 1, padding: '40px 20px', maxWidth: '800px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
                {/* Header */}
                <div className="animate-fade-in-up" style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <h1 style={{ marginBottom: '10px' }}>Privacy Policy</h1>
                    <p style={{ color: '#64748b', fontSize: '14px' }}>Last Updated: December 20, 2025</p>
                    <p style={{ color: '#94a3b8', marginTop: '20px' }}>
                        Welcome to UserLooker. This Privacy Policy explains how we collect, use, and protect information when you use our service.
                    </p>
                </div>

                {/* Sections */}
                {sections.map((section, index) => (
                    <div
                        key={index}
                        className="card animate-fade-in-up"
                        style={{
                            marginBottom: '20px',
                            opacity: 0,
                            animationFillMode: 'forwards',
                            animationDelay: `${0.1 + index * 0.05}s`
                        }}
                    >
                        <h2 style={{ fontSize: '1.25rem', marginTop: 0, marginBottom: '16px', color: '#60a5fa' }}>
                            {section.title}
                        </h2>

                        {section.content && (
                            <p style={{ color: '#cbd5e1', marginBottom: section.items || section.subsections ? '12px' : 0 }}>
                                {section.content}
                            </p>
                        )}

                        {section.subsections && (
                            <div>
                                {section.subsections.map((sub, subIndex) => (
                                    <div key={subIndex} style={{ marginBottom: '16px' }}>
                                        <h3 style={{ fontSize: '1rem', color: '#a78bfa', marginBottom: '8px' }}>{sub.subtitle}</h3>
                                        <ul style={{ margin: 0, paddingLeft: '20px', color: '#94a3b8' }}>
                                            {sub.items.map((item, itemIndex) => (
                                                <li key={itemIndex} style={{ marginBottom: '4px' }}>{item}</li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        )}

                        {section.items && (
                            <ul style={{ margin: 0, paddingLeft: '20px', color: '#94a3b8' }}>
                                {section.items.map((item, itemIndex) => (
                                    <li key={itemIndex} style={{ marginBottom: '6px' }}>{item}</li>
                                ))}
                            </ul>
                        )}

                        {section.note && (
                            <p style={{ color: '#64748b', fontStyle: 'italic', marginTop: '12px', marginBottom: 0, fontSize: '14px' }}>
                                {section.note}
                            </p>
                        )}

                        {section.contact && (
                            <div style={{ marginTop: '12px', color: '#94a3b8' }}>
                                <p style={{ margin: '4px 0' }}><strong>Developer:</strong> {section.contact.developer}</p>
                                <p style={{ margin: '4px 0' }}><strong>Contact:</strong> {section.contact.platform}</p>
                            </div>
                        )}
                    </div>
                ))}

                {/* Footer note */}
                <div
                    className="animate-fade-in"
                    style={{ textAlign: 'center', marginTop: '40px', paddingTop: '20px', borderTop: '1px solid #334155', opacity: 0, animationFillMode: 'forwards', animationDelay: '0.8s' }}
                >
                    <p style={{ color: '#64748b', fontSize: '14px' }}>© 2025 UserLooker by BoyAomGame</p>
                    <Link to="/"><button style={{ marginTop: '20px' }}>← Back to Home</button></Link>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default Privacy;
