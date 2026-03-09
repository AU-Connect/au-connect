import React from 'react';
import { Check, X, FileText, Eye, PenTool, PauseCircle } from 'lucide-react';

const StatusStepper = ({ currentStatus, adminRemarks, timestamp }) => {
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

    const currentIndex = getStatusIndex(currentStatus || 'Reported');

    // Format the timestamp cleanly
    const formattedDate = timestamp ? new Date(timestamp.seconds * 1000).toLocaleString('en-US', {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    }) : '';

    return (
        <div className="py-2">
            {steps.map((step, index) => {
                const isActive = index <= currentIndex;
                const isCurrent = index === currentIndex;
                const isLast = index === steps.length - 1;

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
                        <div className={`pb-8 pt-1 ${isCurrent ? 'opacity-100' : 'opacity-60'}`}>
                            <h4 className={`text-sm font-bold ${isCurrent ? 'text-slate-800' : 'text-slate-500'}`}>
                                {step.label}
                            </h4>

                            {/* Show Admin Remarks and Timestamp ONLY for the current active step */}
                            {isCurrent && (
                                <div className="mt-1 animate-in fade-in slide-in-from-top-1 duration-300">
                                    {formattedDate && (
                                        <p className="text-[11px] text-slate-400 font-medium mb-3">
                                            {formattedDate}
                                        </p>
                                    )}
                                    {adminRemarks && (
                                        <div className="mt-2 bg-slate-50 border border-slate-100 p-3.5 rounded-xl text-xs text-slate-600 leading-relaxed shadow-sm w-full">
                                            <span className="font-bold text-slate-700 block mb-1 text-[11px] uppercase tracking-wider">
                                                Admin Message
                                            </span>
                                            {adminRemarks}
                                        </div>
                                    )}
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
