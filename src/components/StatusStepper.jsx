import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, FileText, Eye, PenTool, PauseCircle, Clock } from 'lucide-react';

const StatusStepper = ({ issue }) => {
    if (!issue) return null;

    const currentStatus = issue.status || 'Reported';

    // Base configuration for steps
    let steps = [
        { id: 'Reported', label: 'Reported', activeColor: 'bg-blue-500', shadow: 'shadow-blue-500/40', icon: <FileText size={18} /> },
        { id: 'Viewed', label: 'Viewed', activeColor: 'bg-amber-500', shadow: 'shadow-amber-500/40', icon: <Eye size={18} /> },
        { id: 'InProgress', label: 'Work in Progress', activeColor: 'bg-purple-500', shadow: 'shadow-purple-500/40', icon: <PenTool size={18} /> },
        { id: 'Resolved', label: 'Resolved', activeColor: 'bg-emerald-500', shadow: 'shadow-emerald-500/40', icon: <Check size={18} /> }
    ];

    // Exception Logic: OnHold
    if (currentStatus === 'OnHold') {
        steps[2] = { id: 'OnHold', label: 'Action Paused', activeColor: 'bg-orange-500', shadow: 'shadow-orange-500/40', icon: <PauseCircle size={18} /> };
    }

    // Exception Logic: Rejected
    if (currentStatus === 'Rejected') {
        steps[2] = { id: 'Rejected', label: 'Issue Rejected', activeColor: 'bg-rose-500', shadow: 'shadow-rose-500/40', icon: <X size={18} /> };
        steps = steps.slice(0, 3);
    }

    const getStatusIndex = (status) => {
        switch (status) {
            case 'Reported': return 0;
            case 'Viewed': return 1;
            case 'InProgress':
            case 'OnHold':
            case 'Rejected': return 2;
            case 'Resolved': return 3;
            default: return 0;
        }
    };

    const currentIndex = getStatusIndex(currentStatus);

    const getStepDetails = (stepId, index) => {
        if (index > currentIndex) return { timestamp: null, remarks: null };
        
        // Use the timeline array as the new Source of Truth
        if (issue.timeline && Array.isArray(issue.timeline)) {
            // Find the entry that matches this step ID
            const match = issue.timeline.find(t => t.status === stepId);
            if (match) {
                return { 
                    // Fallback to top-level timestamp ONLY for Reported if missing in timeline
                    timestamp: match.timestamp || (stepId === 'Reported' ? issue.timestamp : null), 
                    // Remarks logic: Current status shows current admin remarks, previous steps show message fragments
                    remarks: stepId === currentStatus ? issue.adminRemarks : (match.message?.includes(':') ? match.message.split(':').slice(1).join(':') : null) 
                };
            }
        }

        // Fallbacks for legacy/incomplete data
        if (stepId === 'Reported') return { timestamp: issue.timestamp, remarks: null };
        if (stepId === currentStatus) return { timestamp: issue.lastUpdatedAt || issue.resolvedAt || issue.timestamp, remarks: issue.adminRemarks };
        return { timestamp: null, remarks: null };
    };

    const formatTime = (ts) => {
        if (!ts) return null;
        try {
            let dateObj;
            if (ts.seconds) dateObj = new Date(ts.seconds * 1000);
            else if (ts.toMillis) dateObj = new Date(ts.toMillis());
            else if (ts instanceof Date) dateObj = ts;
            // Handle ISO strings from our manual timeline entries
            else dateObj = new Date(ts);
            
            if (isNaN(dateObj.getTime())) return null;

            return dateObj.toLocaleString('en-US', {
                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
            });
        } catch (e) {
            return null;
        }
    };

    return (
        <div className="py-4 px-2">
            <div className="flex flex-col">
                {steps.map((step, index) => {
                    const isActive = index <= currentIndex;
                    const isCurrent = index === currentIndex;
                    const isLast = index === steps.length - 1;

                    const { timestamp, remarks } = getStepDetails(step.id, index);
                    const formattedDate = formatTime(timestamp);

                    return (
                        <div key={step.id} className="flex gap-6 relative">
                            {/* Animated Connecting Line */}
                            {!isLast && (
                                <div className="absolute top-10 bottom-[-10px] left-[17px] w-[2px] bg-slate-200">
                                    <motion.div 
                                        initial={{ height: 0 }}
                                        whileInView={{ height: index < currentIndex ? '100%' : '0%' }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.8, delay: index * 0.15 }}
                                        className={`w-full ${step.activeColor} shadow-sm`}
                                    />
                                </div>
                            )}

                            {/* Status Node (Circle) */}
                            <div className="flex flex-col items-center shrink-0">
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center z-10 transition-all duration-500 ${
                                    isActive 
                                        ? `${step.activeColor} ${step.shadow} text-white ring-4 ring-white shadow-xl` 
                                        : 'bg-white border-2 border-slate-200 text-slate-400'
                                }`}>
                                    {isActive ? step.icon : <Clock size={16} />}
                                </div>
                            </div>

                            {/* Content Card */}
                            <div className={`pb-10 pt-1 flex-grow ${isActive ? 'opacity-100' : 'opacity-70'}`}>
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                                    <div className="flex items-center gap-2">
                                        <h4 className={`text-sm font-semibold ${isActive ? 'text-slate-800' : 'text-slate-500'}`}>
                                            {step.label}
                                        </h4>
                                        {isCurrent && (
                                            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                                        )}
                                    </div>
                                    
                                    {formattedDate && (
                                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 bg-slate-100/80 px-3 py-1 rounded-lg border border-slate-200 backdrop-blur-sm self-start">
                                            <Clock size={10} className="text-slate-400" />
                                            {formattedDate}
                                        </div>
                                    )}
                                </div>

                                {isActive && remarks && (
                                    <div className="mt-3 overflow-hidden">
                                        <div className="bg-white border border-slate-100 p-4 rounded-2xl rounded-tl-none shadow-sm ring-1 ring-slate-100 flex flex-col gap-2 relative">
                                            <div className="absolute top-0 left-0 w-1 h-full bg-primary-gradient opacity-10" />
                                            <div className="flex items-center gap-2">
                                                <div className={`w-1.5 h-1.5 rounded-full ${step.activeColor}`} />
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                                                    Admin Message
                                                </span>
                                            </div>
                                            <p className="text-[13px] text-slate-600 font-medium leading-relaxed font-sans whitespace-pre-wrap">
                                                {remarks}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default StatusStepper;
