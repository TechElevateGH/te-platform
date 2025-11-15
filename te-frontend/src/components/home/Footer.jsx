import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLinkedin, faGithub, faTwitter, faFacebook, faInstagram, faSlack } from '@fortawesome/free-brands-svg-icons';
import { useAuth } from '../../context/AuthContext';

const socialLinks = [
    { name: 'LinkedIn', icon: faLinkedin, href: 'https://www.linkedin.com/company/techelevategh/', color: 'hover:text-blue-500' },
    { name: 'GitHub', icon: faGithub, href: 'https://github.com/TechElevateGH', color: 'hover:text-gray-900 dark:hover:text-gray-300' },
    { name: 'Twitter', icon: faTwitter, href: 'https://twitter.com', color: 'hover:text-blue-400' },
    { name: 'Facebook', icon: faFacebook, href: 'https://facebook.com', color: 'hover:text-blue-600' },
    { name: 'Instagram', icon: faInstagram, href: 'https://instagram.com', color: 'hover:text-pink-600' },
];

const Footer = () => {
    const { isAuthenticated } = useAuth();
    return (
        <footer className="bg-gray-900" aria-labelledby="footer-heading">
            <h2 id="footer-heading" className="sr-only">
                Footer
            </h2>
            <div className="mx-auto max-w-7xl px-6 pb-8 pt-16 sm:pt-24 lg:px-8 lg:pt-32">
                <div className="flex flex-col items-center text-center space-y-8">
                    {/* Brand section */}
                    <div className="flex flex-col items-center space-y-3">
                        <img
                            src="/te-logo.png"
                            alt="TechElevate Logo"
                            className="h-12 w-12 rounded-xl shadow-lg"
                        />
                        <span className="text-2xl font-bold text-white">TechElevate</span>
                        <p className="max-w-2xl text-sm leading-6 text-gray-300">
                            Empowering marginalized talent worldwide to excel in tech careers through mentorship, resources, and opportunities.
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-4">
                        {socialLinks.map((item) => (
                            <a
                                key={item.name}
                                href={item.href}
                                className={`text-gray-400 ${item.color} transition-colors duration-300`}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <span className="sr-only">{item.name}</span>
                                <FontAwesomeIcon icon={item.icon} className="h-6 w-6" />
                            </a>
                        ))}
                        {/* Slack link for authenticated users */}
                        {isAuthenticated && (
                            <a
                                href="https://join.slack.com/t/techelevateworkspace/shared_invite/zt-3ig9yhi07-XZpHhVVnlv0Cj3lTyJLAuw"
                                className="text-gray-400 hover:text-purple-500 transition-colors duration-300"
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Join our Slack workspace"
                            >
                                <span className="sr-only">Slack</span>
                                <FontAwesomeIcon icon={faSlack} className="h-6 w-6" />
                            </a>
                        )}
                    </div>
                </div>

                {/* Bottom section */}
                <div className="mt-12 border-t border-white/10 pt-8 flex flex-col items-center gap-4 text-center">
                    <p className="text-xs leading-5 text-gray-400">
                        &copy; {new Date().getFullYear()} TechElevate. All rights reserved.
                    </p>
                    <span className="text-xs text-gray-400">
                        Built with ❤️
                    </span>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
