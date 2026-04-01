import React from 'react';
import { Check, X, FileText, Eye, PenTool, PauseCircle } from 'lucide-react';

const StatusStepper = ({ issue }) => {
    if (!issue) return null;

    const currentStatus = issue.status || 'Reported';

    // Base configuration for steps
    let steps = [
        { id: 'Reported', label: 'Reported', activeColor: 'bg-blue-500', icon: <FileText size={16} className="text-white" /> },
        { id: 'Viewed', label: 'Viewed', activeColor: 'bg-yellow-500', icon: <Eye size={16} className="text-white" /> },
        { id: 'InProgress', label: 'Work in Progress', activeColor: 'bg-purple-500', icon: <PenTool size={16} className="text-white" /> },
        { id: 'Resolved', label: 'Resolved', activeColor: 'bg-green-500', icon: <Check size={16} className="text-white" /> }
    ];

    // Exception Logic: OnHold
    if (currentStatus === 'OnHold') {
        steps[2] = { id: 'OnHold', label: 'Action Paused', activeColor: 'bg-orange-500', icon: <PauseCircle size={16} className="text-white" /> };
    }

    // Exception Logic: Rejected
    if (currentStatus === 'Rejected') {
        steps[2] = { id: 'Rejected', label: 'Issue Rejected', activeColor: 'bg-red-500', icon: <X size={16} className="text-white" /> };
        steps = steps.slice(0, 3); // We remove the 'Resolved' step since it's rejected
    }

    // Determine numerical index of the current status
    const getStatusIndex = (status) => {
        switch (status) {
            case 'Reported': return 0;
            case 'Viewed': return 1;
            case 'InProgress':
            case 'OnHold':
            case 'Rejected': return 2;
            case 'Resolved': return 3;
            default: return 0; // Default to 'Reported'
        }
    };

    const currentIndex = getStatusIndex(currentStatus);

    // Smart logic to resolve time and remarks for each historical step
    const getStepDetails = (stepId, index) => {
        // If step isn't reached yet, it has no history
        if (index > currentIndex) return { timestamp: null, remarks: null };

        // 1. Try to find the exact historical array entry for this step
        if (issue.statusHistory && Array.isArray(issue.statusHistory)) {
            // Sort by timestamp if possible, get the latest entry for this status
            const matches = issue.statusHistory.filter(h => h.status === stepId);
            if (matches.length > 0) {
                const latestMatch = matches[matches.length - 1]; // arrayUnion appends to end
                return { timestamp: latestMatch.timestamp, remarks: latestMatch.remarks };
            }
        }

        // 2. Fallbacks for Old Documents without `statusHistory` arrays
        if (stepId === 'Reported') {
            return { timestamp: issue.timestamp, remarks: null };
        }
        
        // If it's the current status, fallback to the root metadata
        if (stepId === currentStatus) {
            return { timestamp: issue.lastUpdatedAt || issue.resolvedAt || issue.timestamp, remarks: issue.adminRemarks };
        }

        // If it's a past status but no history is stored, just return null details
        return { timestamp: null, remarks: null };
    };

    const formatTime = (ts) => {
        if (!ts) return null;
        let dateObj;
        if (ts.seconds) dateObj = new Date(ts.seconds * 1000);
        else if (ts.toMillis) dateObj = new Date(ts.toMillis());
        else if (ts instanceof Date) dateObj = ts;
        else dateObj = new Date(ts);
        
        return dateObj.toLocaleString('en-US', {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <div className="py-2">
            {steps.map((step, index) => {
                const isActive = index <= currentIndex;
                const isCurrent = index === currentIndex;
                const isLast = index === steps.length - 1;

                const { timestamp, remarks } = getStepDetails(step.id, index);
                const formattedDate = formatTime(timestamp);

                return (
                    <div key={step.id} className="flex gap-4 relative">
                        {/* Thin Grey Connecting Line */}
                        {!isLast && (
                            <div className="absolute top-8 bottom-[-16px] left-[15px] w-[2px] bg-slate-200" />
                        )}

                        {/* Step Circle */}
                        <div className="relative flex flex-col items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 transition-all duration-300 shadow-sm ${isActive ? step.activeColor : 'bg-slate-100 border-2 border-slate-200'}`}>
                                {isActive ? step.icon : null}
                            </div>
                        </div>

                        {/* Step Content */}
                        <div className={`pb-8 pt-1 w-full pr-2 ${isActive ? 'opacity-100' : 'opacity-60'}`}>
                            <div className="flex justify-between items-start gap-2">
                                <h4 className={`text-sm font-bold ${isActive ? 'text-slate-800' : 'text-slate-500'}`}>
                                    {step.label}
                                </h4>
                                {formattedDate && (
                                    <span className="text-[10px] sm:text-[11px] text-slate-500 font-semibold bg-white px-2.5 py-0.5 rounded-md border border-slate-200 shadow-sm shrink-0 mt-0.5 whitespace-nowrap">
                                        {formattedDate}
                                    </span>
                                )}
                            </div>

                            {/* Show Admin Remarks for ANY active step that has data */}
                            {isActive && remarks && (
                                <div className="mt-2.5 animate-in fade-in slide-in-from-top-1 duration-300 mr-2 md:mr-8">
                                    <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl rounded-tl-sm text-xs text-slate-600 leading-relaxed shadow-sm relative">
                                        {/* CSS Dialogue Tail */}
                                        <div className="absolute -top-[1px] -left-[1px] w-2 h-2 bg-slate-50 border-t border-l border-slate-200 rounded-tl-sm"></div>
                                        <span className="flex items-center gap-1.5 font-bold text-slate-400 block mb-1 text-[9px] uppercase tracking-widest relative z-10">
                                            Admin Message
                                        </span>
                                        <span className="relative z-10 font-medium block whitespace-pre-wrap">{remarks}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default StatusStepper;
