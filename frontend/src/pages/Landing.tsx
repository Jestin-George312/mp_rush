import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Activity, Shield, FolderArchive, ArrowRight, Sparkles } from 'lucide-react';

// Animation variants with proper easing types
const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: (delay: number = 0) => ({
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.6,
            delay,
            ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
        },
    }),
};

const scaleIn = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: (delay: number = 0) => ({
        opacity: 1,
        scale: 1,
        transition: {
            duration: 0.5,
            delay,
            ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
        },
    }),
};

// Feature data
const features = [
    {
        icon: Activity,
        title: 'Real-time Tracking',
        description: 'Monitor project progress with live updates, milestones, and deadline notifications.',
        gradient: 'from-blue-500 to-cyan-400',
    },
    {
        icon: Shield,
        title: 'Role-Based Access',
        description: 'Secure, tailored experiences for Students, Guides, and Coordinators.',
        gradient: 'from-violet-500 to-purple-400',
    },
    {
        icon: FolderArchive,
        title: 'Digital Repository',
        description: 'Centralized document management with version control and approvals.',
        gradient: 'from-orange-500 to-amber-400',
    },
];

const Landing: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#0a0a0f] text-white overflow-hidden relative">
            {/* Background Effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {/* Radial gradient */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1200px] bg-[radial-gradient(circle,rgba(99,102,241,0.15)_0%,transparent_50%)]" />
                {/* Accent glow spots */}
                <div className="absolute top-20 right-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl" />
                <div className="absolute bottom-20 left-1/4 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl" />
                {/* Grid pattern */}
                <div
                    className="absolute inset-0 opacity-[0.03]"
                    style={{
                        backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
                        backgroundSize: '64px 64px',
                    }}
                />
            </div>

            {/* Main Content */}
            <div className="relative z-10 max-w-7xl mx-auto px-6 py-12 lg:py-20">
                {/* Hero Section */}
                <section className="text-center pt-16 pb-24 lg:pt-24 lg:pb-32">
                    {/* Badge */}
                    <motion.div
                        variants={fadeInUp}
                        initial="hidden"
                        animate="visible"
                        custom={0}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8"
                    >
                        <Sparkles size={16} className="text-amber-400" />
                        <span className="text-sm text-gray-300">Empowering Academic Excellence</span>
                    </motion.div>

                    {/* Main Heading */}
                    <motion.h1
                        variants={fadeInUp}
                        initial="hidden"
                        animate="visible"
                        custom={0.1}
                        className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight tracking-tight"
                    >
                        <span className="block text-white mb-2">Academic Project</span>
                        <span className="block bg-gradient-to-r from-blue-400 via-violet-400 to-purple-500 bg-clip-text text-transparent">
                            Monitoring System
                        </span>
                    </motion.h1>

                    {/* Acronym highlight */}
                    <motion.div
                        variants={fadeInUp}
                        initial="hidden"
                        animate="visible"
                        custom={0.2}
                        className="mt-6 mb-8"
                    >
                        <span className="text-6xl md:text-8xl lg:text-9xl font-black bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent opacity-20">
                            APMS
                        </span>
                    </motion.div>

                    {/* Subtext */}
                    <motion.p
                        variants={fadeInUp}
                        initial="hidden"
                        animate="visible"
                        custom={0.3}
                        className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed"
                    >
                        Streamlining collaboration between{' '}
                        <span className="text-blue-400 font-medium">Students</span>,{' '}
                        <span className="text-violet-400 font-medium">Guides</span>, and{' '}
                        <span className="text-purple-400 font-medium">Coordinators</span>.
                    </motion.p>

                    {/* CTA Button */}
                    <motion.div
                        variants={fadeInUp}
                        initial="hidden"
                        animate="visible"
                        custom={0.4}
                        className="mt-12"
                    >
                        <motion.button
                            onClick={() => navigate('/login')}
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            animate={{
                                scale: [1, 1.02, 1],
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: 'easeInOut',
                            }}
                            className="group relative inline-flex items-center gap-3 px-8 py-4 text-lg font-semibold rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-2xl shadow-purple-500/25 transition-shadow hover:shadow-purple-500/40"
                        >
                            <span>Get Started</span>
                            <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
                            {/* Glow effect */}
                            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 blur-xl opacity-40 -z-10" />
                        </motion.button>
                    </motion.div>
                </section>

                {/* Features Section */}
                <section className="pb-24">
                    <motion.h2
                        variants={fadeInUp}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: '-100px' }}
                        custom={0}
                        className="text-center text-2xl md:text-3xl font-bold mb-16"
                    >
                        <span className="text-gray-300">Everything you need to</span>{' '}
                        <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
                            succeed
                        </span>
                    </motion.h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                        {features.map((feature, index) => (
                            <motion.div
                                key={feature.title}
                                variants={scaleIn}
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true, margin: '-50px' }}
                                custom={index * 0.15}
                                whileHover={{ y: -8, transition: { duration: 0.3 } }}
                                className="group relative p-8 rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-sm transition-colors hover:bg-white/[0.06] hover:border-white/[0.15]"
                            >
                                {/* Icon */}
                                <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br ${feature.gradient} mb-6 shadow-lg`}>
                                    <feature.icon size={28} className="text-white" />
                                </div>

                                {/* Title */}
                                <h3 className="text-xl font-semibold text-white mb-3">
                                    {feature.title}
                                </h3>

                                {/* Description */}
                                <p className="text-gray-400 leading-relaxed">
                                    {feature.description}
                                </p>

                                {/* Hover glow */}
                                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity -z-10`} />
                            </motion.div>
                        ))}
                    </div>
                </section>

                {/* Footer */}
                <motion.footer
                    variants={fadeInUp}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    custom={0}
                    className="text-center py-8 border-t border-white/[0.08]"
                >
                    <p className="text-gray-500 text-sm">
                        © {new Date().getFullYear()} APMS — Academic Project Monitoring System
                    </p>
                </motion.footer>
            </div>
        </div>
    );
};

export default Landing;
