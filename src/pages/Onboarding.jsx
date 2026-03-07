import React from 'react';

const Onboarding = () => {
    return (
        <div className="min-h-[calc(100vh-64px)] bg-app-bg flex items-center justify-center p-6 text-center">
            <div className="bg-white p-8 rounded-3xl shadow-subtle max-w-md w-full animate-in fade-in zoom-in duration-500 border border-border-custom">
                <h1 className="text-3xl font-bold text-heading mb-4">Complete Your Profile</h1>
                <p className="text-body-text mb-6">Welcome to AU-Connect! Please provide a few more details to get started.</p>
                <div className="animate-pulse bg-slate-50 border border-dashed border-slate-200 h-64 rounded-xl flex items-center justify-center text-slate-400">
                    Onboarding Form Coming Soon...
                </div>
            </div>
        </div>
    );
};

export default Onboarding;
