import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
    return (
        <footer className="site-footer">
            <div className="footer-copyright">
                Made With ❤️ By BoyAomGame
            </div>

            <div className="footer-disclaimer">
                This Project isn't affilated with "ชีวิตในรั้วทหารไทย"'s HQ or Developer
            </div>

            <div className="footer-links">
                <FooterLink to="/privacy">Privacy</FooterLink>
                <FooterLink to="/terms">Terms</FooterLink>
                <FooterLink to="/contact">Contact</FooterLink>
            </div>
        </footer>
    );
};

const FooterLink = ({ to, children }) => {
    return (
        <Link
            to={to}
            className="footer-link"
        >
            {children}
        </Link>
    );
};

export default Footer;
