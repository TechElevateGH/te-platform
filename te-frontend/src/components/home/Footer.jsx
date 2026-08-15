import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLinkedin, faSlack } from '@fortawesome/free-brands-svg-icons';
import { ArrowRightIcon } from 'icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Footer = () => {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();

    return (
        <footer className="border-t border-white/10 bg-[#071a12] text-white" aria-labelledby="footer-heading">
            <h2 id="footer-heading" className="sr-only">Footer</h2>
            <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-20">
                <div className="grid gap-14 lg:grid-cols-[1.25fr_0.75fr_0.75fr]">
                    <div className="max-w-md">
                        <button onClick={() => navigate('/')} className="flex items-center gap-3">
                            <img src="/te-mark.svg" alt="" className="h-10 w-10 rounded-xl" />
                            <span className="te-wordmark text-lg text-white">TechElevate</span>
                        </button>
                        <p className="mt-5 text-sm leading-7 text-white/50">
                            A community-powered career platform helping ambitious technologists build skills, confidence, relationships, and real opportunity.
                        </p>
                        <button
                            onClick={() => navigate(isAuthenticated ? '/workspace' : '/register')}
                            className="group mt-7 inline-flex items-center gap-2 text-sm font-extrabold text-[#6fdda5]"
                        >
                            {isAuthenticated ? 'Return to your workspace' : 'Build your future with us'}
                            <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </button>
                    </div>

                    <div>
                        <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-white/35">Explore</p>
                        <div className="mt-5 flex flex-col items-start gap-3">
                            <button onClick={() => navigate('/documentation')} className="text-sm font-semibold text-white/60 hover:text-white">Resources</button>
                            <button onClick={() => navigate(isAuthenticated ? '/workspace' : '/login')} className="text-sm font-semibold text-white/60 hover:text-white">Workspace</button>
                            <button onClick={() => navigate('/register')} className="text-sm font-semibold text-white/60 hover:text-white">Join the community</button>
                        </div>
                    </div>

                    <div>
                        <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-white/35">Connect</p>
                        <div className="mt-5 flex items-center gap-2">
                            <a
                                href="https://www.linkedin.com/company/techelevategh/"
                                className="grid h-11 w-11 place-items-center rounded-xl border border-white/10 text-white/55 hover:-translate-y-0.5 hover:bg-white/10 hover:text-white"
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="TechElevate on LinkedIn"
                            >
                                <FontAwesomeIcon icon={faLinkedin} className="h-5 w-5" />
                            </a>
                            {isAuthenticated && (
                                <a
                                    href="https://join.slack.com/t/techelevateworkspace/shared_invite/zt-3ig9yhi07-XZpHhVVnlv0Cj3lTyJLAuw"
                                    className="grid h-11 w-11 place-items-center rounded-xl border border-white/10 text-white/55 hover:-translate-y-0.5 hover:bg-white/10 hover:text-white"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label="Join the TechElevate Slack workspace"
                                >
                                    <FontAwesomeIcon icon={faSlack} className="h-5 w-5" />
                                </a>
                            )}
                        </div>
                        <p className="mt-5 text-xs leading-5 text-white/35">A focused career platform<br />for ambitious talent</p>
                    </div>
                </div>

                <div className="mt-16 flex flex-col gap-3 border-t border-white/10 pt-7 text-xs font-semibold text-white/30 sm:flex-row sm:items-center sm:justify-between">
                    <p>&copy; {new Date().getFullYear()} TechElevate. All rights reserved.</p>
                    <p>Built for talent that deserves to be seen.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
