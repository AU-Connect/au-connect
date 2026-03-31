import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import Background from '../components/Background';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserRoundPen, LogOut } from 'lucide-react';

const Profile = () => {
    const { currentUser, userData, isOnboarded, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-6 relative overflow-hidden bg-app-bg">
            <Background />

            <div className="w-full max-w-md relative z-10 flex flex-col items-center">
                {/* User Header Section */}
                <div className="flex items-center w-full gap-5 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="h-16 w-16 flex-shrink-0">
                        {currentUser?.photoURL ? (
                            <img
                                src={currentUser.photoURL}
                                alt="Profile"
                                className="h-full w-full rounded-full border-2 border-white shadow-lg"
                            />
                        ) : (
                            <div className="h-full w-full rounded-full bg-primary-gradient flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                                {currentUser?.displayName?.charAt(0)}
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col text-left">
                        <h1 className="text-2xl font-bold text-heading leading-tight">
                            {userData?.name || currentUser?.displayName}
                        </h1>
                        <p className="text-body-text text-md italic">
                            {currentUser?.email}
                        </p>
                    </div>
                </div>

                {/* Info Card Section */}
                <Card className="w-full border-none shadow-subtle bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden mb-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
                    <CardContent className="p-6 space-y-4">
                        {userData?.role === 'admin' ? (
                            <>
                                <div className="flex justify-between items-center px-1">
                                    <span className="text-sm text-slate-500 font-medium tracking-tight">Access Level:</span>
                                    <span className="px-3 py-1 bg-primary/10 text-primary font-bold rounded-full text-xs uppercase tracking-wider border border-primary/20">
                                        Campus Admin
                                    </span>
                                </div>
                                <div className="pt-3 border-t border-slate-100 px-1 space-y-1 text-left">
                                    <span className="text-xs text-slate-500 font-medium block">Department Incharge:</span>
                                    <span className="text-base text-primary font-black leading-snug block uppercase tracking-tight">
                                        {userData?.department_in_charge || "N/A"}
                                    </span>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="flex justify-between items-center px-1">
                                    <span className="text-sm text-slate-500 font-medium">Roll No:</span>
                                    <span className="text-base text-heading font-bold tracking-wider">
                                        {userData?.rollNumber || "Not Set"}
                                    </span>
                                </div>

                                <div className="flex justify-between items-center px-1">
                                    <span className="text-sm text-slate-500 font-medium">Degree:</span>
                                    <span className="text-base text-heading font-bold">
                                        {userData?.degree || "Not Set"}
                                    </span>
                                </div>

                                <div className="flex justify-between items-center px-1">
                                    <span className="text-sm text-slate-500 font-medium">Year:</span>
                                    <span className="text-base text-heading font-bold">
                                        {userData?.year || "Not Set"}
                                    </span>
                                </div>

                                <div className="pt-3 border-t border-slate-100 px-1 space-y-1 text-left">
                                    <span className="text-xs text-slate-500 font-medium block">Department:</span>
                                    <span className="text-base text-primary font-bold leading-snug block">
                                        {userData?.department || "Profile Incomplete"}
                                    </span>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Actions Section */}
                <div className="w-full space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-900 pt-2">
                    {userData?.role !== 'admin' && (
                        <Button
                            asChild
                            className="w-full h-12 bg-primary-gradient hover:brightness-110 text-white font-semibold rounded-xl flex items-center justify-center gap-3 transition-all shadow-md active:scale-[0.98]"
                        >
                            <Link to="/onboarding">
                                <UserRoundPen className="w-5 h-5" />
                                {isOnboarded ? "Edit Profile" : "Complete Profile Setup"}
                            </Link>
                        </Button>
                    )}

                    <Button
                        onClick={handleLogout}
                        variant="secondary"
                        className={`w-full h-12 ${userData?.role === 'admin' ? 'bg-primary-gradient text-white' : 'bg-white text-red-500 border border-slate-100'} hover:brightness-110 font-semibold rounded-xl flex items-center justify-center gap-3 transition-all shadow-sm active:scale-[0.98]`}
                    >
                        <LogOut className="w-5 h-5" />
                        Logout Session
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default Profile;
