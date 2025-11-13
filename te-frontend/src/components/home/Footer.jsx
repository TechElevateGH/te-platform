import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLinkedin, faGithub, faTwitter, faFacebook, faInstagram } from '@fortawesome/free-brands-svg-icons';

const navigation = {
    platform: [
        { name: 'Features', href: '#features' },
        { name: 'How It Works', href: '/how-it-works' },
        { name: 'Success Stories', href: '#testimonials' },
        { name: 'Pricing', href: '/pricing' },
    ],
    company: [
        { name: 'About Us', href: '#team' },
        { name: 'Our Team', href: '#team' },
        { name: 'Careers', href: '/careers' },
        { name: 'Contact', href: '/contact' },
    ],
    resources: [
        { name: 'Learning Hub', href: '/learning' },
        { name: 'Blog', href: '/blog' },
        { name: 'Help Center', href: '/help' },
        { name: 'Community', href: '/community' },
    ],
    legal: [
        { name: 'Privacy Policy', href: '/privacy' },
        { name: 'Terms of Service', href: '/terms' },
        { name: 'Cookie Policy', href: '/cookies' },
    ],
};

const socialLinks = [
    { name: 'LinkedIn', icon: faLinkedin, href: 'https://linkedin.com', color: 'hover:text-blue-500' },
    { name: 'GitHub', icon: faGithub, href: 'https://github.com/TechElevateGH', color: 'hover:text-gray-900' },
    { name: 'Twitter', icon: faTwitter, href: 'https://twitter.com', color: 'hover:text-blue-400' },
    { name: 'Facebook', icon: faFacebook, href: 'https://facebook.com', color: 'hover:text-blue-600' },
    { name: 'Instagram', icon: faInstagram, href: 'https://instagram.com', color: 'hover:text-pink-600' },
];

const Footer = () => {
    return (
        <footer className="bg-gray-900" aria-labelledby="footer-heading">
            <h2 id="footer-heading" className="sr-only">
                Footer
            </h2>
            <div className="mx-auto max-w-7xl px-6 pb-8 pt-16 sm:pt-24 lg:px-8 lg:pt-32">
                <div className="xl:grid xl:grid-cols-3 xl:gap-8">
                    {/* Brand section */}
                    <div className="space-y-8">
                        <div className="flex items-center space-x-2">
                            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg">
                                <span className="text-white font-bold text-2xl">TE</span>
                            </div>
                            <span className="text-2xl font-bold text-white">TechElevate</span>
                        </div>
                        <p className="text-sm leading-6 text-gray-300">
                            Empowering marginalized talent worldwide to excel in tech careers through mentorship, resources, and opportunities.
                        </p>
                        <div className="flex space-x-4">
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
                        </div>
                    </div>
                </div>

                {/* Bottom section */}
                <div className="mt-8 border-t border-white/10 pt-8 md:flex md:items-center md:justify-between">
                    <p className="text-xs leading-5 text-gray-400">
                        &copy; {new Date().getFullYear()} TechElevate. All rights reserved. <br /> Built with ❤️
                    </p>
                    <div className="mt-4 flex space-x-6 md:mt-0">
                        <span className="text-xs text-gray-400">
                            Made by TechElevate
                        </span>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
