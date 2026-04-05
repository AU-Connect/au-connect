import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Clock, ThumbsUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { doc, updateDoc, increment, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../firebase';

const ComplaintCard = ({ issue, index, onClick }) => {
    const { currentUser, userData } = useAuth();
    const [hasUpvoted, setHasUpvoted] = useState(false);
    const [isVoting, setIsVoting] = useState(false);

    // Check if user is allowed to upvote
    const isGeneral = issue.department === 'GENERAL/PRINCIPAL OFFICE DEPARTMENT';
    const isSameDept = issue.department === userData?.department;
    const canUpvote = isGeneral || isSameDept;

    useEffect(() => {
        // Prevent double voting using Firestore native source-of-truth
        if (currentUser && issue.upvotedBy && Array.isArray(issue.upvotedBy)) {
            setHasUpvoted(issue.upvotedBy.includes(currentUser.uid));
        } else if (currentUser && issue.id) {
            // Fallback for legacy issues that only used local storage
            const upvoted = localStorage.getItem(`upvote_${issue.id}_${currentUser.uid}`);
            if (upvoted === 'true') {
                setHasUpvoted(true);
            } else {
                setHasUpvoted(false);
            }
        }
    }, [issue.upvotedBy, issue.id, currentUser]);

    const handleUpvote = async (e) => {
        e.stopPropagation();
        if (!canUpvote || isVoting || !issue.id) return;

        setIsVoting(true);
        try {
            const issueRef = doc(db, 'issues', issue.id);

            if (hasUpvoted) {
                // Undo upvote globally
                await updateDoc(issueRef, {
                    upvotes: increment(-1),
                    upvotedBy: arrayRemove(currentUser.uid)
                });
                setHasUpvoted(false);
                if (currentUser) {
                    localStorage.removeItem(`upvote_${issue.id}_${currentUser.uid}`); // Clean up legacy state
                }
            } else {
                // Add upvote globally
                await updateDoc(issueRef, {
                    upvotes: increment(1),
                    upvotedBy: arrayUnion(currentUser.uid)
                });
                setHasUpvoted(true);
            }
        } catch (error) {
            console.error("Failed to toggle upvote:", error);
        } finally {
            setIsVoting(false);
        }
    };

    // Format the date if timestamp exists
    const date = issue.timestamp ? new Date(issue.timestamp.seconds * 1000).toLocaleDateString("en-US", {
        month: "short", day: "numeric"
    }) : "Just now";

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            onClick={onClick}
            className="bg-white/95 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/50 flex flex-col h-full shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:-translate-y-1 transition-all duration-300 cursor-pointer"
        >
            <div className="h-48 w-full bg-slate-100 relative shrink-0">
                <img
                    src={issue.imageUrl}
                    alt={issue.title}
                    className="w-full h-full object-cover"
                />
                <div className="absolute top-3 right-3">
                    <span className="bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-bold text-primary shadow-sm border border-white/20">
                        {issue.category || 'Uncategorized'}
                    </span>
                </div>
            </div>

            <div className="p-5 flex flex-col flex-grow">
                <div className="flex flex-col mb-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 block mb-1">
                        ID: {issue.id?.slice(-6)}
                    </span>
                    <div className="flex items-start justify-between gap-3">
                        <h3 className="font-bold text-lg line-clamp-1 flex-grow" style={{ color: '#1E293B' }}>
                            {issue.title}
                        </h3>
                        <span className={`shrink-0 px-2.5 py-1 rounded-md text-[10px] uppercase font-bold tracking-wider ${
                            issue.status === 'Resolved' ? 'bg-emerald-100 text-emerald-700' :
                            issue.status === 'InProgress' ? 'bg-blue-100 text-blue-700' :
                            issue.status === 'Viewed' ? 'bg-indigo-100 text-indigo-700' :
                            issue.status === 'OnHold' ? 'bg-amber-100 text-amber-700' :
                            issue.status === 'Rejected' ? 'bg-rose-100 text-rose-700' :
                            'bg-violet-100 text-violet-700'
                        }`}>
                            {issue.status || 'Reported'}
                        </span>
                    </div>
                </div>

                <p className="text-sm line-clamp-2 mb-4 leading-relaxed" style={{ color: '#475569' }}>
                    {issue.description}
                </p>

                <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-auto">
                    <div className="flex items-center text-slate-400 text-xs gap-1.5 max-w-[50%]">
                        <MapPin size={14} className="shrink-0" />
                        <span className="truncate">{issue.location?.manualAddress || issue.department}</span>
                    </div>
                    <div className="flex items-center text-slate-400 text-xs gap-3 shrink-0">
                        <div className="flex items-center gap-1.5 hidden sm:flex">
                            <Clock size={14} />
                            <span>{date}</span>
                        </div>
                        <div className="relative group inline-block">
                            <button
                                onClick={handleUpvote}
                                disabled={!canUpvote || isVoting}
                                className={`flex items-center gap-1.5 px-2 py-1 rounded transition-colors ${hasUpvoted ? 'text-primary bg-primary/10' :
                                    canUpvote ? 'hover:bg-slate-100 hover:text-slate-700 text-slate-500' :
                                        'opacity-50 cursor-not-allowed text-slate-400'
                                    }`}
                            >
                                <ThumbsUp size={14} className={hasUpvoted ? "fill-primary text-primary" : ""} />
                                <span className="font-semibold">{issue.upvotes || 0}</span>
                            </button>

                            {/* Stylish Tooltip */}
                            <div className="absolute bottom-full right-0 mb-2 w-max max-w-[240px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 group-hover:-translate-y-1 transform translate-y-0">
                                <div className="bg-[#1E293B] text-white text-[11px] font-medium py-2 px-3 rounded-xl shadow-2xl text-center leading-relaxed">
                                    {!canUpvote
                                        ? "You can only upvote issues in your department or general office."
                                        : hasUpvoted
                                            ? "Remove upvote"
                                            : "Upvote this issue"}
                                    {/* Arrow */}
                                    <div className="absolute -bottom-1 right-4 w-2.5 h-2.5 bg-[#1E293B] rotate-45 rounded-sm"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default ComplaintCard;
