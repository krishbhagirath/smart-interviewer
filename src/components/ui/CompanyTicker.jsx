'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

const ROLES = [
    { id: 'shopify-ml-intern', company: 'Shopify', role: 'ML Intern', color: 'bg-green-100 text-green-700 border-green-200' },
    { id: 'nokia-infra', company: 'Nokia', role: 'Infra Engineer', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    { id: 'full-stack', company: 'Netflix', role: 'Full Stack', color: 'bg-red-100 text-red-700 border-red-200' },
    { id: 'behavioral', company: 'Amazon', role: 'Leadership', color: 'bg-orange-100 text-orange-700 border-orange-200' },
    { id: 'technical', company: 'Google', role: 'System Design', color: 'bg-slate-100 text-slate-700 border-slate-200' },
    { id: 'shopify-ml-intern', company: 'Meta', role: 'AI Resident', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    { id: 'nokia-infra', company: 'Cisco', role: 'Network Eng', color: 'bg-cyan-100 text-cyan-700 border-cyan-200' },
    { id: 'full-stack', company: 'Tesla', role: 'Frontend', color: 'bg-neutral-100 text-neutral-700 border-neutral-200' },
];

export default function CompanyTicker() {
    const router = useRouter();

    const handleRoleClick = (roleId, roleName) => {
        // 1. Save Setup directly
        localStorage.setItem('interviewSetup', JSON.stringify({
            interviewType: roleId,
            experienceLevel: 'Mid-Senior', // Default
            customTitle: roleName
        }));
        // 2. Redirect
        router.push('/interview');
    };

    return (
        <div className="w-full py-8 border-y border-slate-100 bg-white/50 backdrop-blur-sm overflow-hidden flex flex-col items-center gap-4">
            <p className="text-sm font-semibold text-slate-400 uppercase tracking-widest text-center">
                Practice for real open roles
            </p>

            <div className="flex overflow-hidden w-full relative mask-gradient">
                {/* Gradient Masks */}
                <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-slate-50 to-transparent z-10 pointer-events-none" />
                <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-slate-50 to-transparent z-10 pointer-events-none" />

                <motion.div
                    className="flex gap-4 items-center whitespace-nowrap px-8"
                    animate={{ x: [0, -1000] }}
                    transition={{
                        repeat: Infinity,
                        duration: 40,
                        ease: "linear"
                    }}
                >
                    {[...ROLES, ...ROLES, ...ROLES].map((item, i) => (
                        <button
                            key={i}
                            onClick={() => handleRoleClick(item.id, `${item.company} ${item.role}`)}
                            className={`flex items-center gap-3 px-4 py-2 rounded-lg border ${item.color} 
                              hover:scale-105 hover:shadow-lg transition-transform duration-200 cursor-pointer`}
                        >
                            <span className="font-bold text-sm tracking-wide">{item.company}</span>
                            <span className="text-sm font-medium opacity-80 border-l border-current pl-2">{item.role}</span>
                        </button>
                    ))}
                </motion.div>
            </div>
        </div>
    );
}
