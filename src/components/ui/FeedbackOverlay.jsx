'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function FeedbackOverlay({ feedback, isLoading }) {
    const [isExpanded, setIsExpanded] = useState(false);

    if (!feedback && !isLoading) return null;

    return (
        <div className="absolute top-4 left-4 z-30 max-w-[90%] md:max-w-[400px]">
            <AnimatePresence>
                {isLoading ? (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="bg-black/60 backdrop-blur-md border border-white/10 rounded-full px-4 py-2 flex items-center gap-3"
                    >
                        <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-white/80 text-sm font-medium">Analyzing response...</span>
                    </motion.div>
                ) : (
                    <motion.div
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`
              bg-black/60 backdrop-blur-md border border-white/10 overflow-hidden cursor-pointer
              transition-all duration-300 ease-in-out
              ${isExpanded ? 'rounded-2xl p-4' : 'rounded-full px-5 py-2 hover:bg-black/70'}
            `}
                        onClick={() => setIsExpanded(!isExpanded)}
                    >
                        <motion.div layout="position" className="flex items-start gap-3">
                            <div className="mt-1 w-2 h-2 rounded-full bg-green-400 flex-shrink-0 shadow-[0_0_10px_rgba(74,222,128,0.5)]"></div>

                            <div className="flex-1">
                                {!isExpanded ? (
                                    <motion.p layout="position" className="text-white/90 text-sm font-medium truncate">
                                        AI Feedback: <span className="text-white/70 font-normal ml-1">Click to view insights</span>
                                    </motion.p>
                                ) : (
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center mb-1">
                                            <h4 className="text-green-400 text-xs uppercase tracking-wider font-bold">Feedback</h4>
                                        </div>
                                        <p className="text-white/90 text-sm leading-relaxed">
                                            {feedback}
                                        </p>
                                        <p className="text-white/50 text-xs italic pt-2">
                                            Click to collapse
                                        </p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
