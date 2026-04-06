import React, { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { ShieldCheck, Zap, Clock, MessageSquare, BarChart3, Bell } from 'lucide-react';
import Background from '../components/Background';
import FeatureCard from '../components/FeatureCard';

const Home = () => {
    const { currentUser, userData, loading } = useAuth();
    const navigate = useNavigate();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-app-bg">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    React.useEffect(() => {
        if (userData?.role === 'admin') {
            navigate('/admin');
        }
    }, [userData, navigate]);

    const features = useMemo(() => [
        {
            icon: <Zap className="text-yellow-500" />,
            title: "AI Identification",
            description: "Advanced Gemini AI instantly categorizes your issues for precise departmental routing."
        },
        {
            icon: <Clock className="text-blue-500" />,
            title: "Real-time Tracking",
            description: "Follow the exact progress of your grievance with instant status and timeline updates."
        },
        {
            icon: <ShieldCheck className="text-green-500" />,
            title: "Verified Evidence",
            description: "Attach photo proof with every report to ensure total transparency and direct admin accountability."
        },
        {
            icon: <MessageSquare className="text-purple-500" />,
            title: "Community Voices",
            description: "Upvote and highlight major campus issues so that top student concerns are resolved first."
        },
        {
            icon: <BarChart3 className="text-orange-500" />,
            title: "Smart Routing",
            description: "Automatically directs your reports to the specific Head of Department (HOD) for review."
        },
        {
            icon: <Bell className="text-red-500" />,
            title: "Instant AI Support",
            description: "Enlist help from our specialized UniBot anytime for campus rules, fees or grievance steps."
        }
    ], []);

    return (
        <div className="bg-app-bg min-h-screen font-sans relative overflow-hidden">
            <Background />

            {/* Hero Section */}
            <div className="min-h-[70vh] flex flex-col items-center justify-center px-6 text-center relative z-10 pt-20">
                {/* Welcome Message */}
                {currentUser && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.6 }}
                        className="mb-4 flex items-center justify-center gap-2 cursor-default"
                    >
                        <span className="text-slate-500 text-lg font-medium tracking-wide">
                            Welcome back, <span className="text-primary font-bold">{userData?.name || currentUser.displayName || 'Student'}</span>
                        </span>
                        <motion.span 
                            animate={{ rotate: [0, 20, 0, 20, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 1 }}
                            className="inline-block text-2xl"
                        >👋</motion.span>
                    </motion.div>
                )}

                {/* Main Tagline */}
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.1 }}
                    className="text-4xl md:text-7xl font-black text-heading leading-tight tracking-tight flex flex-col items-center"
                >
                    <div className="relative mb-2 flex flex-col md:block items-center">
                        <motion.span
                            initial={{ scale: 0.8, opacity: 0, x: -20 }}
                            animate={{ scale: 1, opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: 0.4 }}
                            className="md:absolute md:right-[calc(100%+1.5rem)] md:top-1/2 md:-translate-y-1/2 px-4 py-1 rounded-full bg-primary/10 text-primary font-bold text-sm md:text-xl tracking-widest uppercase border border-primary/30 shadow-[0_0_15px_rgba(52,193,227,0.4)] backdrop-blur-sm whitespace-nowrap mb-2 md:mb-0"
                        >
                            Smart
                        </motion.span>
                        Campus
                    </div>
                    <span className="bg-primary-gradient bg-clip-text text-transparent">Grievance Redressal System</span>
                </motion.h1>

                {/* Description */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1, delay: 0.3 }}
                    className="mt-4 text-lg md:text-xl text-body-text max-w-2xl leading-relaxed mx-auto font-medium"
                >
                    The digital bridge for Andhra University. Resolve grievances,
                    track progress, and build a better campus together.
                </motion.p>

                {/* Call to Action Buttons */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                    className="mt-8 flex flex-col sm:flex-row gap-5 items-center justify-center"
                >
                    <Link
                        to="/report"
                        className="bg-primary-gradient px-10 py-4 rounded-[12px] text-white font-bold text-lg shadow-xl hover:shadow-primary/20 hover:scale-105 active:scale-95 transition-all duration-300 min-w-[200px] flex items-center justify-center gap-2 group"
                    >
                        Report Issue
                        <Zap className="w-5 h-5 group-hover:fill-current transition-all" />
                    </Link>

                    {currentUser && (
                        <Link
                            to="/feed"
                            className="glass-card px-10 py-4 rounded-[12px] text-heading font-bold text-lg shadow-lg hover:bg-white hover:scale-105 active:scale-95 transition-all duration-300 min-w-[200px] border border-border-custom flex items-center justify-center"
                        >
                            Track complaints
                        </Link>
                    )}
                </motion.div>
            </div>

            {/* Features Section */}
            <section className="py-16 px-6 max-w-7xl mx-auto relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-10"
                >
                    <h2 className="text-3xl md:text-4xl font-extrabold text-heading mb-4 tracking-tight font-sans">Why AU Connect?</h2>
                    <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: 128 }} // 32 * 4 = 128px (w-32)
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="h-1.5 bg-primary-gradient mx-auto rounded-full"
                    ></motion.div>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {features.map((feature, index) => (
                        <FeatureCard
                            key={index}
                            {...feature}
                            index={index}
                        />
                    ))}
                </div>
            </section>
        </div>
    );
};

export default Home;
