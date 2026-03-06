import React from 'react';

const Background = () => {
    return (
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
            {/* Mesh Gradient Base */}
            <div className="absolute inset-0 bg-mesh-gradient opacity-60"></div>

            {/* Subtle Grid Pattern overlay */}
            <div className="absolute inset-0 grid-pattern opacity-40"></div>

            {/* Dynamic Animated Blobs */}
            <div className="absolute top-[10%] left-[5%] w-[500px] h-[500px] bg-primary animate-pulse-slow blur-[120px] rounded-full mix-blend-multiply opacity-15"></div>
            <div className="absolute bottom-[20%] right-[10%] w-[400px] h-[400px] bg-primary-gradient-start animate-[pulse-slow_10s_infinite] blur-[100px] rounded-full mix-blend-multiply opacity-15"></div>

            {/* Additional depth bloom */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-sky-400/10 blur-[150px] rounded-full opacity-20 animate-pulse"></div>
        </div>
    );
};

export default React.memo(Background);
