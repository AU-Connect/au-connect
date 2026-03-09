import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, query, or, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import ComplaintCard from '../components/ComplaintCard';
import Background from '../components/Background';

const Feed = () => {
    const { currentUser, userData } = useAuth();
    const [issues, setIssues] = useState([]);
    const [activeFilter, setActiveFilter] = useState('My Department');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        // Wait until user data is fully loaded
        if (!currentUser || !userData?.department) return;

        // Build the specific query logic for the feed
        // Included General Department to ensure those issues are fetched for the new filter tab
        const q = query(
            collection(db, "issues"),
            or(
                where("userId", "==", currentUser.uid),
                where("department", "==", userData.department),
                where("department", "==", "GENERAL/PRINCIPAL OFFICE DEPARTMENT")
            ),
            orderBy("timestamp", "desc")
        );

        // Fetch using a realtime listener
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            setIssues(fetchedList);
            setLoading(false);
            setError("");
        }, (err) => {
            console.error("Firebase fetch error:", err);
            setError(err.message);
            setLoading(false);
        });

        // Cleanup the listener when the component unmounts
        return () => unsubscribe();
    }, [currentUser, userData]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8">
                <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100">
                    <h3 className="font-bold">Error loading feed</h3>
                    <p className="text-sm mt-1">{error}</p>
                    {error.includes("index") && (
                        <p className="text-sm font-semibold mt-2 underline">
                            This requires creating a new Firestore Database Index. Check the browser console log for the exact Firebase link!
                        </p>
                    )}
                </div>
            </div>
        );
    }

    const filteredIssues = issues.filter(issue => {
        if (activeFilter === 'My Department') return issue.department === userData?.department;
        if (activeFilter === 'General Department') return issue.department === 'GENERAL/PRINCIPAL OFFICE DEPARTMENT';
        if (activeFilter === 'My Reported Issues') return issue.userId === currentUser.uid;
        return true;
    });

    return (
        <div className="min-h-[calc(100vh-64px)] w-full flex flex-col p-4 md:p-8 relative overflow-hidden bg-app-bg">
            <Background />

            <div className="max-w-7xl mx-auto w-full relative z-10">
                <div className="mb-8 pt-4">
                    <div className="inline-block">
                        <h1 className="text-3xl md:text-4xl font-black text-[#1E293B] tracking-tight">
                            Campus <span className="text-transparent bg-clip-text bg-primary-gradient">Feed</span>
                        </h1>
                        <div className="h-1 w-1/3 bg-primary-gradient rounded-full mt-2"></div>
                    </div>
                </div>

                {/* Filter Bar */}
                <div className="flex flex-wrap items-center gap-3 mb-8">
                    {['My Department', 'General Department', 'My Reported Issues'].map((filterTab) => (
                        <button
                            key={filterTab}
                            onClick={() => setActiveFilter(filterTab)}
                            className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${activeFilter === filterTab
                                ? 'bg-primary text-white shadow-md shadow-primary/20 scale-105'
                                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/60 hover:border-slate-300'
                                }`}
                        >
                            {filterTab}
                        </button>
                    ))}
                </div>

                {/* Complaint Cards Grid */}
                {filteredIssues.length === 0 ? (
                    <div className="bg-white p-12 rounded-3xl border border-slate-100 text-center shadow-sm">
                        <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-3xl">📭</span>
                        </div>
                        <h3 className="text-xl font-bold text-slate-700 mb-2">No Issues Found</h3>
                        <p className="text-slate-500 max-w-sm mx-auto">There are no reports matching this filter right now. You're all caught up!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredIssues.map((issue, index) => (
                            <ComplaintCard key={issue.id} issue={issue} index={index} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Feed;
