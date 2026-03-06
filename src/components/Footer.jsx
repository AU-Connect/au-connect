import React from 'react';

const Footer = () => {
    return (
        <footer className="w-full bg-surface border-t border-border-custom py-8 px-6 mt-auto">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
                <p className="text-body-text font-medium">
                    © 2026 Andhra University. All rights reserved.
                </p>

                <div className="flex gap-6">
                    <a
                        href="https://www.andhrauniversity.edu.in/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-body-text hover:text-primary transition-colors font-medium"
                    >
                        University Website
                    </a>
                    <a
                        href="#"
                        className="text-body-text hover:text-primary transition-colors font-medium"
                    >
                        Privacy Policy
                    </a>
                    <a
                        href="#"
                        className="text-body-text hover:text-primary transition-colors font-medium"
                    >
                        Contact Support
                    </a>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
