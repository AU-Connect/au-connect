import React from 'react';
import { motion } from 'framer-motion';

const Background = () => {
    return (
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden bg-slate-50">
            {/* Mesh Gradient Base */}
            <div className="absolute inset-0 bg-mesh-gradient opacity-40"></div>

            {/* Subtle Grid Pattern overlay */}
            <div className="absolute inset-0 grid-pattern opacity-30"></div>

            {/* Aurora Blobs */}
            {/* Cyan Blob */}
            <motion.div
                animate={{
                    x: [0, 400, -300, 200, 0],
                    y: [0, -250, 300, -100, 0],
                    scale: [1, 1.25, 0.85, 1.15, 1],
                }}
                transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
                className="absolute top-[10%] left-[5%] w-[600px] h-[600px] bg-cyan-400/20 blur-[100px] rounded-full will-change-transform transform-gpu"
            />

            {/* Blue Blob */}
            <motion.div
                animate={{
                    x: [0, -350, 450, -200, 0],
                    y: [0, 300, -450, 250, 0],
                    scale: [1, 0.85, 1.25, 0.9, 1],
                }}
                transition={{
                    duration: 25,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
                className="absolute bottom-[15%] right-[5%] w-[700px] h-[700px] bg-blue-500/10 blur-[120px] rounded-full will-change-transform transform-gpu"
            />

            {/* Purple Blob */}
            <motion.div
                animate={{
                    x: [0, 550, -450, 300, 0],
                    y: [0, 400, -550, 200, 0],
                    rotate: [0, 180, 360],
                }}
                transition={{
                    duration: 30,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
                className="absolute top-1/4 left-1/3 w-[550px] h-[550px] bg-purple-500/10 blur-[110px] rounded-full will-change-transform transform-gpu"
            />

            {/* Depth Bloom */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] bg-sky-200/5 blur-[160px] rounded-full opacity-30"></div>
        </div>
    );
};

export default React.memo(Background);