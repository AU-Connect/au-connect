import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.png';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Navbar = () => {
    const { currentUser, userData, isOnboarded, logout } = useAuth();
    const location = useLocation();

    const navLinks = userData?.role === 'admin'
        ? [{ name: 'Dashboard', path: '/admin' }]
        : [
            { name: 'Home', path: '/' },
            { name: 'Feed', path: '/feed' },
            { name: 'Report Issue', path: '/report' },
            { name: 'Unibot', path: '/unibot' },
        ];

    const isActiveProfile = location.pathname === '/profile';

    return (
        <nav className="sticky top-0 z-[1001] w-full bg-surface border-b border-border-custom px-6 py-3 flex items-center justify-between shadow-sm">
            {/* Left side: Logo */}
            <Link to="/" className="flex items-center gap-2">
                <img src={logo} alt="AU-Connect Logo" className="h-10 w-auto" />
            </Link>

            {/* Right side: Navigation Links */}
            <div className="flex items-center gap-8">
                {navLinks.map((link) => {
                    const isActive = location.pathname === link.path;
                    return (
                        <Link
                            key={link.path}
                            to={link.path}
                            className={`transition-all duration-300 font-medium relative py-1 px-2 rounded-md ${isActive
                                ? "text-primary bg-primary/5 shadow-[0_0_20px_rgba(52,193,227,0.4)] border border-primary/20 [text-shadow:0_0_8px_rgba(52,193,227,0.4)]"
                                : "text-body-text hover:text-primary hover:bg-slate-50"
                                }`}
                        >
                            {link.name}
                            {isActive && (
                                <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-primary-gradient rounded-full shadow-[0_0_8px_#34C1E3]" />
                            )}
                        </Link>
                    );
                })}

                {currentUser ? (
                    <Link
                        to="/profile"
                        className={`flex items-center gap-2 transition-all relative group`}
                    >
                        <div className={`rounded-full p-[2px] transition-all duration-300 ${isActiveProfile
                            ? "bg-primary-gradient shadow-[0_0_15px_rgba(52,193,227,0.6)]"
                            : "bg-transparent group-hover:bg-primary/20"
                            }`}>
                            <div className="bg-surface p-0.5 rounded-full shadow-sm">
                                {currentUser.photoURL ? (
                                    <img src={currentUser.photoURL} alt="User Profile" className="h-8 w-8 rounded-full" />
                                ) : (
                                    <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm">
                                        {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : 'U'}
                                    </div>
                                )}
                            </div>
                        </div>
                    </Link>
                ) : (
                    <Link
                        to="/login"
                        className="bg-primary-gradient px-6 py-2 rounded-[6px] text-white font-semibold shadow-subtle hover:brightness-110 transition-all font-sans"
                    >
                        Login
                    </Link>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
