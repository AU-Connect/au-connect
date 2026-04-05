import React from 'react';
import { MapPin, ThumbsUp, Calendar, AlertCircle, Clock, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

const AdminIssueCard = ({ issue, onClick }) => {
    // Helper to get status color and icon
    const getStatusDetails = (status) => {
        switch (status) {
            case 'Reported':
                return { color: 'text-blue-600 bg-blue-50 border-blue-100', icon: <AlertCircle size={14} /> };
            case 'Viewed':
                return { color: 'text-amber-600 bg-amber-50 border-amber-100', icon: <Clock size={14} /> };
            case 'InProgress':
                return { color: 'text-purple-600 bg-purple-50 border-purple-100', icon: <Clock size={14} /> };
            case 'Resolved':
                return { color: 'text-emerald-600 bg-emerald-50 border-emerald-100', icon: <CheckCircle2 size={14} /> };
            case 'OnHold':
                return { color: 'text-orange-600 bg-orange-50 border-orange-100', icon: <AlertCircle size={14} /> };
            case 'Rejected':
                return { color: 'text-red-600 bg-red-50 border-red-100', icon: <AlertCircle size={14} /> };
            default:
                return { color: 'text-slate-600 bg-slate-50 border-slate-100', icon: <AlertCircle size={14} /> };
        }
    };

    const statusStyle = getStatusDetails(issue.status);
    const date = issue.timestamp?.toDate ? issue.timestamp.toDate().toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    }) : 'Just now';

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => onClick(issue)}
            className="bg-white/95 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/50 flex flex-col h-full shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:-translate-y-1 transition-all duration-300 cursor-pointer group"
        >
            {/* Project Image */}
            <div className="h-48 w-full bg-slate-100 relative shrink-0">
                <img
                    src={issue.imageUrl}
                    alt={issue.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute top-3 right-3">
                    <span className="bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-bold text-primary shadow-sm border border-white/20">
                        {issue.category || 'Uncategorized'}
                    </span>
                </div>
            </div>

            {/* Content Section */}
            <div className="p-5 flex flex-col flex-grow">
                <div className="flex flex-col mb-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 block mb-1">
                        ID: {issue.id?.slice(-6)}
                    </span>
                    <div className="flex items-start justify-between gap-3">
                        <h3 className="font-bold text-lg line-clamp-1 flex-grow" style={{ color: '#1E293B' }}>
                            {issue.title}
                        </h3>
                        <span className={`shrink-0 px-2.5 py-1 rounded-md text-[10px] uppercase font-bold tracking-wider ${issue.status === 'Resolved' ? 'bg-green-100 text-green-700' :
                            issue.status === 'InProgress' ? 'bg-blue-100 text-blue-700' :
                            issue.status === 'Reported' ? 'bg-orange-100 text-orange-700' :
                            statusStyle.color}`}>
                            {issue.status || 'Reported'}
                        </span>
                    </div>
                </div>

                <p className="text-sm line-clamp-2 mb-4 leading-relaxed" style={{ color: '#475569' }}>
                    {issue.description}
                </p>

                {/* Footer Section */}
                <div className="mt-auto">
                    <div className="flex items-center justify-between pt-4 pb-3 mb-1">
                        <div className="flex items-center text-slate-400 text-xs gap-1.5 max-w-[50%]">
                            <MapPin size={14} className="shrink-0" />
                            <span className="truncate">{issue.location?.manualAddress || issue.manualLocation || issue.department}</span>
                        </div>

                        <div className="flex items-center text-slate-400 text-xs gap-3 shrink-0">
                            <div className="flex items-center gap-1.5 sm:flex">
                                <Clock size={14} />
                                <span>{date}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                        <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 shadow-sm">
                            <div className="bg-primary/10 p-1 rounded-md">
                                <ThumbsUp size={14} className="text-primary" />
                            </div>
                            <span className="text-sm font-black text-slate-700">
                                {issue.upvotes || 0}
                                <span className="text-[10px] font-bold text-slate-400 uppercase ml-1 tracking-tighter">Impact</span>
                            </span>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0 flex items-center gap-1">
                            Review Issue <span className="text-sm leading-none">&rarr;</span>
                        </span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default AdminIssueCard;
