import { Link } from 'react-router-dom';
import Footer from './Footer';

const Terms = () => {
    const sections = [
        {
            title: "1. Acceptance of Terms",
            content: "By accessing or using UserLooker, you agree to:",
            items: ["These Terms of Service", "Our Privacy Policy", "All applicable laws and regulations"],
            note: "If you do not agree with any part of these Terms, you may not use our service."
        },
        {
            title: "2. Description of Service",
            content: "UserLooker is a Discord user data lookup and tracking service that:",
            items: ["Links Discord accounts to Roblox usernames", "Tracks military rank changes over time", "Provides searchable user information", "Stores message history for analysis"],
            note: "The service is provided \"as is\" and \"as available\" without warranties."
        },
        {
            title: "3. Eligibility",
            content: "To use UserLooker, you must:",
            items: ["Be at least 13 years of age", "Have the legal capacity to enter into a binding agreement", "Not be prohibited from using the service under applicable laws"]
        },
        {
            title: "4. Acceptable Use",
            content: "You agree NOT to use UserLooker to:",
            subsections: [
                { subtitle: "A. Harassment", items: ["Stalk, harass, or intimidate any individual", "Dox or expose personal information maliciously", "Target users for discrimination or abuse"] },
                { subtitle: "B. Illegal Activities", items: ["Engage in any unlawful activities", "Violate Discord's Terms of Service", "Violate Roblox's Terms of Service"] },
                { subtitle: "C. Technical Abuse", items: ["Attempt to hack, exploit, or disrupt the service", "Use automated tools to scrape data excessively", "Overwhelm servers with excessive requests (DoS)", "Reverse engineer or decompile the application"] },
                { subtitle: "D. Misrepresentation", items: ["Impersonate others or misrepresent your identity", "Provide false information", "Create fake or misleading data entries"] }
            ]
        },
        {
            title: "5. User Responsibilities",
            content: "You are responsible for:",
            items: ["Your use of the service and any consequences thereof", "Maintaining the confidentiality of any access credentials", "Reporting any security vulnerabilities or misuse", "Using data obtained from the service responsibly and ethically"]
        },
        {
            title: "6. Intellectual Property",
            items: ["UserLooker and its original content are owned by BoyAomGame", "The source code is available on GitHub under applicable licenses", "User-submitted data remains the property of respective users", "Discord and Roblox are trademarks of their respective owners"]
        },
        {
            title: "7. Data Accuracy",
            items: ["We strive to maintain accurate data but cannot guarantee accuracy", "Data is extracted from Discord exports and may contain errors", "Rank and username information reflects historical snapshots", "We are not responsible for decisions made based on this data"]
        },
        {
            title: "8. Limitation of Liability",
            content: "TO THE MAXIMUM EXTENT PERMITTED BY LAW:",
            items: ["UserLooker is provided \"AS IS\" without warranties of any kind", "We do not guarantee uninterrupted or error-free service", "We are not liable for any damages arising from use of the service", "Our total liability shall not exceed the amount you paid (if any)"],
            note: "This includes direct, indirect, incidental, or consequential damages, loss of data, profits, or business opportunities."
        },
        {
            title: "9. Indemnification",
            content: "You agree to indemnify and hold harmless UserLooker, its developer, and affiliates from any claims, damages, or expenses arising from:",
            items: ["Your use of the service", "Your violation of these Terms", "Your violation of any third-party rights", "Any content you submit or transmit through the service"]
        },
        {
            title: "10. Termination",
            content: "We reserve the right to:",
            items: ["Suspend or terminate access at any time, for any reason", "Remove or modify any content or data", "Discontinue the service with or without notice"],
            note: "Upon termination, your right to use the service ceases immediately."
        },
        {
            title: "11. Changes to Terms",
            content: "We may modify these Terms at any time by:",
            items: ["Posting the revised Terms on this page", "Updating the \"Last Updated\" date", "Notifying users of material changes (when practical)"],
            note: "Continued use after changes constitutes acceptance of the new Terms."
        },
        {
            title: "12. Third-Party Services",
            content: "UserLooker may interact with third-party services including:",
            items: ["Discord (data source)", "Roblox (username references)", "MongoDB (data storage)", "Backblaze B2 (optional cloud storage)", "Google Gemini AI (optional analysis)"],
            note: "We are not responsible for the practices of these third parties."
        },
        {
            title: "13. Governing Law",
            content: "These Terms shall be governed by and construed in accordance with applicable laws. Any disputes shall be resolved through appropriate legal channels."
        },
        {
            title: "14. Severability",
            content: "If any provision of these Terms is found unenforceable, the remaining provisions shall continue in full force and effect."
        },
        {
            title: "15. Entire Agreement",
            content: "These Terms, together with our Privacy Policy, constitute the entire agreement between you and UserLooker regarding use of the service."
        },
        {
            title: "16. Contact",
            content: "For questions about these Terms of Service, please contact:",
            contact: { developer: "BoyAomGame", platform: "Discord" }
        }
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100%' }}>
            <div style={{ flex: 1, padding: '40px 20px', maxWidth: '800px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
                {/* Header */}
                <div className="animate-fade-in-up" style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <h1 style={{ marginBottom: '10px' }}>Terms of Service</h1>
                    <p style={{ color: '#64748b', fontSize: '14px' }}>Last Updated: December 20, 2025</p>
                    <p style={{ color: '#94a3b8', marginTop: '20px' }}>
                        Please read these Terms of Service carefully before using UserLooker. By accessing or using our service, you agree to be bound by these Terms.
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
                            animationDelay: `${0.1 + index * 0.03}s`
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
                                        <h3 style={{ fontSize: '1rem', color: '#f87171', marginBottom: '8px' }}>{sub.subtitle}</h3>
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

export default Terms;
