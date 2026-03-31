import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Background from '../components/Background';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

const Login = () => {
    const { login, userData } = useAuth();
    const navigate = useNavigate();

    React.useEffect(() => {
        if (userData?.role === 'admin') {
            navigate('/admin');
        } else if (userData?.role === 'student') {
            navigate('/feed');
        }
    }, [userData, navigate]);

    const handleLogin = async () => {
        try {
            const result = await login();
            const user = result.user;

            // Day 4: Role Checking Logic
            // Once Google verifies the user, check the users collection in Firestore
            const userDocRef = doc(db, "users", user.email);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists()) {
                const userData = userDoc.data();

                // Scenario A: Preloaded Admin
                if (userData.role === 'admin') {
                    navigate('/admin');
                }
                // Scenario B: Returning Student
                else if (userData.role === 'student') {
                    navigate('/feed');
                }
                else {
                    // Fallback if role is not strictly defined
                    navigate('/');
                }
            } else {
                // Scenario C: Brand New Student - Redirect to Onboarding
                navigate('/onboarding');
            }
        } catch (error) {
            console.error("Login failed:", error);
        }
    };

    return (
        <div className="min-h-[calc(100vh-64px)] bg-app-bg flex items-center justify-center px-4 relative overflow-hidden">
            <Background />

            <Card className="w-full max-w-md border border-primary/20 shadow-2xl bg-white relative z-10 rounded-3xl overflow-hidden ring-1 ring-primary/5 shadow-[0_0_50px_rgba(29,78,216,0.08)]">
                {/* Subtle Decorative Corner Accents */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary-gradient opacity-[0.03] blur-3xl pointer-events-none -z-10" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary-gradient opacity-[0.03] blur-3xl pointer-events-none -z-10" />

                <CardHeader className="flex flex-col items-center pt-10 pb-6">
                    <img
                        src={logo}
                        alt="AU-Connect Logo"
                        className="h-20 w-auto mb-6 hover:scale-105 transition-transform duration-300"
                    />
                    <CardTitle className="text-3xl font-bold text-heading">Welcome Back</CardTitle>
                    <CardDescription className="text-body-text text-center mt-2 px-6">
                        Sign in to access your dashboard, report issues, and tracking complaints at Andhra University.
                    </CardDescription>
                </CardHeader>

                <CardContent className="pb-12 px-10">
                    <Button
                        onClick={handleLogin}
                        className="w-full h-14 bg-primary-gradient text-white font-bold text-lg rounded-[6px] shadow-subtle hover:brightness-110 hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-3 active:scale-[0.98]"
                    >
                        <svg viewBox="0 0 24 24" className="size-9 shrink-0" xmlns="http://www.w3.org/2000/svg">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.67-.35-1.39-.35-2.09s.13-1.42.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        Sign in with Google
                    </Button>

                    <div className="mt-8 pt-6 border-t border-border-custom text-center">
                        <p className="text-sm text-body-text">
                            By continuing, you agree to the AU Connect terms and conditions.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default Login;