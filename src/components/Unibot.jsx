import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Loader2 } from 'lucide-react';
import { getUnibotResponse } from '../aiService';
import botIcon from '../assets/unibot.png';
import { useUnibotStore } from '../hooks/useUnibotStore';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Unibot = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { currentUser, userData, isOnboarded } = useAuth();
    // Global state to toggle the visibility of the chat window
    const { isOpen, setIsOpen } = useUnibotStore();
    const [messages, setMessages] = useState([
        { 
            role: 'bot', 
            text: "Hello! I'm your AU-Connect assistant. How can I help you today?", 
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
        }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    
    // Auto-scroll logic
    const messagesEndRef = useRef(null);
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    const handleSendMessage = async () => {
        if (!inputValue.trim() || isTyping) return;

        const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const userMsg = { role: 'user', text: inputValue, time: currentTime };
        setMessages(prev => [...prev, userMsg]);
        const currentInput = inputValue;
        setInputValue('');
        setIsTyping(true);

        try {
            const botResponse = await getUnibotResponse(currentInput);
            const botMsg = { 
                role: 'bot', 
                text: botResponse, 
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
            };
            setMessages(prev => [...prev, botMsg]);
        } catch (error) {
            console.error("Unibot Error:", error);
            const errorMsg = { 
                role: 'bot', 
                text: "I'm having trouble connecting right now. Please try again later.", 
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsTyping(false);
        }
    };

    // Character visibility logic: 
    // - Show character on Home (/) for everyone
    // - Show character on Feed (/feed) only if logged in
    const isCharacterVisible = location.pathname === '/' || (currentUser && location.pathname === '/feed');

    return (
        <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end">
            
            {/* The Chat Screen Modal */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[10000] flex items-center justify-center p-0 sm:p-10 bg-slate-900/40 backdrop-blur-xl"
                        onClick={() => setIsOpen(false)} // Close when clicking backdrop
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
                            className="w-full h-full max-w-5xl max-h-screen sm:max-h-[85vh] bg-white rounded-none sm:rounded-[32px] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] flex flex-col overflow-hidden border border-white/20"
                        >
                            {/* Styled Header: Reduced height and added stylish tooltip */}
                            <div className="bg-gradient-to-r from-[#1E293B] via-[#2D3748] to-[#1E293B] p-4 sm:p-5 flex items-center justify-between text-white shadow-[0_10px_30px_rgba(0,0,0,0.1)] z-10 shrink-0 relative">
                                {/* Subtle Light Beam Effect in Header */}
                                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_-20%,rgba(52,193,227,0.15),transparent)] pointer-events-none"></div>
                                
                                <div className="flex items-center gap-4 relative z-10">
                                    <div className="relative group">
                                        <div className="w-12 h-12 rounded-[18px] bg-white/5 backdrop-blur-md flex items-center justify-center overflow-hidden border border-[#00F0FF]/30 shadow-[0_0_20px_rgba(0,240,255,0.3)] transition-transform duration-500 group-hover:rotate-[10deg] group-hover:shadow-[0_0_30px_rgba(0,240,255,0.5)]">
                                            <img src={botIcon} alt="Unibot" className="w-full h-full object-cover brightness-110 contrast-125 drop-shadow-[0_0_8px_rgba(0,240,255,0.4)]" />
                                        </div>
                                        {/* Real-time Status Glow */}
                                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#1A2234] rounded-full flex items-center justify-center border border-[#00FF66]/20 shadow-[0_0_10px_rgba(0,255,102,0.2)]">
                                            <div className="w-2 h-2 bg-[#00FF66] rounded-full animate-pulse shadow-[0_0_15px_#00FF66,0_0_5px_#00FF66]"></div>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <h3 className="text-lg sm:text-xl tracking-tight leading-tight flex items-center">
                                            <span className="text-white font-black drop-shadow-[0_0_12px_rgba(255,255,255,0.7)]">Uni</span>
                                            <span className="text-[#00F0FF] font-black drop-shadow-[0_0_15px_rgba(0,240,255,0.8)]">Bot</span>
                                        </h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[9px] text-[#00F0FF] font-black uppercase tracking-[0.3em] drop-shadow-[0_0_8px_rgba(0,240,255,0.7)]">Online</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="relative group/tooltip inline-block">
                                    <button 
                                        onClick={() => setIsOpen(false)}
                                        className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-xl transition-all text-slate-300 hover:text-white border border-white/5 hover:border-white/10 group active:scale-90"
                                    >
                                        <X size={22} className="group-hover:rotate-90 transition-transform duration-500" />
                                    </button>
                                    
                                    {/* Stylish Tooltip */}
                                    <div className="absolute top-full right-0 mt-3 w-max opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-300 z-50 group-hover/tooltip:-translate-y-1 transform translate-y-0">
                                        <div className="bg-[#1E293B] text-white text-[11px] font-bold py-2 px-3 rounded-xl shadow-2xl text-center leading-relaxed border border-white/10 backdrop-blur-md">
                                            Minimize Chat
                                            {/* Arrow */}
                                            <div className="absolute -top-1 right-4 w-2 h-2 bg-[#1E293B] rotate-45 rounded-sm border-t border-l border-white/10"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Message Area: Immersive Full Depth */}
                            <div className="flex-grow p-6 sm:p-10 overflow-y-auto bg-slate-50/50 flex flex-col gap-6 custom-scrollbar">
                                {messages.map((msg, idx) => (
                                    <div key={idx} className={`flex flex-col ${msg.role === 'bot' ? 'items-start' : 'items-end self-end'} max-w-[80%]`}>
                                        <div className={`px-6 py-4 rounded-3xl text-sm sm:text-base leading-relaxed shadow-sm ring-1 ${
                                            msg.role === 'bot' 
                                                ? 'bg-white text-slate-700 rounded-bl-none ring-[#34C1E3]/20 border-l-4 border-[#34C1E3]' 
                                                : 'bg-[#1E293B] text-white rounded-br-none ring-slate-800'
                                        }`}>
                                            {msg.text}
                                        </div>
                                        <span className={`text-[9px] text-slate-400 mt-1.5 font-bold tracking-widest ${msg.role === 'bot' ? 'ml-3' : 'mr-3'}`}>
                                            {msg.time}
                                        </span>
                                    </div>
                                ))}

                                {isTyping && (
                                    <div className="flex flex-col items-start max-w-[80%] pl-2">
                                        <div className="bg-white px-6 py-4 rounded-3xl rounded-bl-none border-l-4 border-[#34C1E3] shadow-sm flex items-center gap-2">
                                            <div className="flex gap-1.5 px-1 py-1">
                                                {[0, 1, 2].map((i) => (
                                                    <motion.div
                                                        key={i}
                                                        initial={{ y: 0 }}
                                                        animate={{ y: [-4, 4, -4] }}
                                                        transition={{
                                                            duration: 0.8,
                                                            repeat: Infinity,
                                                            ease: "easeInOut",
                                                            delay: i * 0.15
                                                        }}
                                                        className="w-2 h-2 rounded-full bg-[#34C1E3] shadow-[0_0_8px_rgba(52,193,227,0.4)]"
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Highlighted Input Command Bar */}
                            <div className="p-6 sm:p-8 bg-[#F8FAFC] border-t border-slate-200 flex items-center gap-4 shrink-0 shadow-[0_-15px_40px_-15px_rgba(0,0,0,0.1)] relative z-10">
                                <div className="flex-grow relative group">
                                    <input 
                                        type="text"
                                        placeholder={isTyping ? "Unibot is processing..." : "Ask about fees, schedules, or grievances..."}
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                        disabled={isTyping}
                                        className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 text-sm sm:text-base focus:ring-4 focus:ring-[#34C1E3]/15 focus:border-[#34C1E3]/40 outline-none transition-all disabled:opacity-50 font-medium placeholder:text-slate-400 shadow-sm"
                                    />
                                    {!inputValue && !isTyping && (
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                                            <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-2 py-1 rounded-lg uppercase tracking-tighter border border-slate-200">Enter to send</span>
                                        </div>
                                    )}
                                </div>
                                <button 
                                    onClick={handleSendMessage}
                                    disabled={isTyping || !inputValue.trim()}
                                    className="h-14 w-14 bg-[#34C1E3] text-white rounded-2xl flex items-center justify-center shadow-xl shadow-[#34C1E3]/30 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 group border border-[#34C1E3]/20"
                                >
                                    <Send size={24} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* The Floating Action Button (FAB) - Visible only on Home/Feed */}
            {isCharacterVisible && (
                <motion.button
                    onClick={() => {
                        if (!currentUser) {
                            navigate('/login', { state: { from: 'unibot' } });
                        } else if (!userData) {
                            navigate('/onboarding', { state: { from: 'unibot' } });
                        } else {
                            setIsOpen(!isOpen);
                        }
                    }}
                    animate={{
                        y: isOpen ? 0 : [0, -10, 2, -8, 0],
                        rotate: isOpen ? 0 : [0, 2, -2, 1, 0],
                        scale: isOpen ? 0.9 : [1, 1.05, 1]
                    }}
                    transition={{
                        duration: 6,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    whileHover={{ 
                        scale: 1.15,
                        transition: { type: "spring", stiffness: 400, damping: 10 }
                    }}
                    whileTap={{ scale: 0.9 }}
                    className="w-16 h-16 flex items-center justify-center relative cursor-pointer outline-none bg-transparent rounded-full overflow-hidden border-none grow-0 shadow-2xl"
                >
                    <div className="w-full h-full rounded-full overflow-hidden bg-transparent">
                        <img 
                            src={botIcon} 
                            alt="Unibot" 
                            className={`w-full h-full object-cover transition-all duration-300 ${isOpen ? 'brightness-110 contrast-110' : ''}`} 
                        />
                    </div>
                    
                    {/* Subtle indicator that it's clickable when open */}
                    {isOpen && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-2 border-white flex items-center justify-center shadow-lg"
                        >
                            <X size={10} className="text-white font-bold" />
                        </motion.div>
                    )}
                </motion.button>
            )}

        </div>
    );
};;

export default Unibot;
