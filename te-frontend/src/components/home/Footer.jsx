import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLinkedin, faSlack } from '@fortawesome/free-brands-svg-icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Footer = () => {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();

    return (
        <footer className="bg-[var(--te-bg)] border-t border-[var(--te-border)]" aria-labelledby="footer-heading">
            <h2 id="footer-heading" className="sr-only">Footer</h2>
            <div className="mx-auto max-w-7xl px-6 lg:px-8 py-14">
                <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
                    {/* Brand */}
                    <div className="max-w-sm">
                        <div className="flex items-center gap-2.5">
                            <img src="/te-mark.svg" alt="TechElevate" className="h-8 w-8 rounded-[9px]" />
                            <span className="te-wordmark text-[15px] text-[var(--te-text)]">techelevate</span>
                        </div>
                        <p className="mt-4 text-sm leading-6 text-[var(--te-text-dim)]">
                            The career workspace for aspiring engineers — mentorship, resources, and
                            opportunities to help marginalized talent excel in tech.
                        </p>
                    </div>

                    {/* Links */}
                    <div className="flex flex-col gap-3">
                        <span className="te-eyebrow">{'// navigate'}</span>
                        <button onClick={() => navigate('/documentation')} className="text-left text-sm text-[var(--te-text-dim)] hover:text-[var(--te-text)] transition-colors">Documentation</button>
                        <button onClick={() => navigate(isAuthenticated ? '/workspace' : '/login')} className="text-left text-sm text-[var(--te-text-dim)] hover:text-[var(--te-text)] transition-colors">Workspace</button>
                        <button onClick={() => navigate('/register')} className="text-left text-sm text-[var(--te-text-dim)] hover:text-[var(--te-text)] transition-colors">Get started</button>
                    </div>

                    {/* Social */}
                    <div className="flex flex-col gap-3">
                        <span className="te-eyebrow">{'// connect'}</span>
                        <div className="flex items-center gap-2">
                            <a
                                href="https://www.linkedin.com/company/techelevategh/"
                                className="te-icon-btn"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <span className="sr-only">LinkedIn</span>
                                <FontAwesomeIcon icon={faLinkedin} className="h-5 w-5" />
                            </a>
                            {isAuthenticated && (
                                <a
                                    href="https://join.slack.com/t/techelevateworkspace/shared_invite/zt-3ig9yhi07-XZpHhVVnlv0Cj3lTyJLAuw"
                                    className="te-icon-btn"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title="Join our Slack workspace"
                                >
                                    <span className="sr-only">Slack</span>
                                    <FontAwesomeIcon icon={faSlack} className="h-5 w-5" />
                                </a>
                            )}
                        </div>
                    </div>
                </div>

                {/* Bottom */}
                <div className="mt-12 border-t border-[var(--te-border)] pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <p className="font-mono text-xs text-[var(--te-text-dim)]">
                        &copy; {new Date().getFullYear()} techelevate — all rights reserved
                    </p>
                    <span className="font-mono text-xs text-[var(--te-text-dim)]">
                        built with care · v1.0
                    </span>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
