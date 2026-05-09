import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Database, Shield, Zap, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

const Landing: React.FC = () => {
  const navigate = useNavigate();

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 100 } }
  };

  return (
    <div className="min-h-screen bg-[#f4f5f7] dark:bg-[#09090b] text-zinc-900 dark:text-white selection:bg-white selection:text-black font-sans flex flex-col relative overflow-hidden transition-colors duration-200">
      
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-zinc-300/40 dark:bg-white/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-zinc-300/40 dark:bg-white/5 blur-[120px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 w-full px-6 py-5 flex items-center justify-between border-b border-zinc-200 dark:border-white/10 bg-white/60 dark:bg-black/20 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5 text-zinc-900 dark:text-white" />
          <span className="font-semibold tracking-tight text-zinc-900 dark:text-white">SchemaForge</span>
        </div>
        <button 
          onClick={() => navigate('/login')}
          className="text-xs font-semibold px-4 py-2 border border-zinc-300 dark:border-white/20 rounded-full text-zinc-700 dark:text-white hover:bg-zinc-900 hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
        >
          Sign In
        </button>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 max-w-5xl mx-auto w-full pt-16 pb-24">
        
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="text-center flex flex-col items-center"
        >
          <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-zinc-300 dark:border-white/10 bg-zinc-100 dark:bg-white/5 mb-6">
            <span className="flex h-2 w-2 rounded-full bg-zinc-700 dark:bg-white animate-pulse" />
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">v2.0 Architectural Update Live</span>
          </motion.div>

          <motion.h1 variants={itemVariants} className="text-5xl sm:text-7xl font-extrabold tracking-tighter mb-6 text-transparent bg-clip-text bg-gradient-to-b from-zinc-900 to-zinc-400 dark:from-white dark:to-zinc-500">
            Oracle to PostgreSQL
          </motion.h1>
          
          <motion.p variants={itemVariants} className="text-lg sm:text-xl text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Enterprise-grade AST schema parsing. Instantly analyze, convert, and validate massive Oracle deployments into highly optimized PostgreSQL DDL structures.
          </motion.p>

          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 mb-20 w-full justify-center">
            <button
              onClick={() => navigate('/login')}
              className="group inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-zinc-900 dark:bg-white text-white dark:text-black font-semibold rounded-full hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-all shadow-[0_0_20px_rgba(0,0,0,0.15)]"
            >
              Access Dashboard
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-transparent border border-zinc-300 dark:border-white/20 text-zinc-700 dark:text-white font-semibold rounded-full hover:bg-zinc-100 dark:hover:bg-white/5 transition-all"
            >
              View Documentation
            </button>
          </motion.div>

          <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left">
            {[
              { icon: Shield, title: 'AST Parsing Engine', desc: 'JSQLParser-powered analysis engine safely processing multi-schema variables and dot-qualified identifiers.' },
              { icon: Zap, title: 'Intelligent Conversion', desc: 'Context-aware transformations. 1-click translation for constraints, sequences, and proprietary functions.' },
              { icon: Activity, title: 'Live DB Validation', desc: 'End-to-end testing with native JDBC connectivity, verifying structural integrity directly against live instances.' },
            ].map(({ icon: Icon, title, desc }) => (
              <motion.div key={title} variants={itemVariants} className="group p-6 rounded-2xl bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5 hover:border-zinc-400 dark:hover:border-white/20 hover:shadow-md transition-all">
                <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-white/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Icon className="h-5 w-5 text-zinc-700 dark:text-white" />
                </div>
                <h3 className="font-semibold text-zinc-900 dark:text-white mb-2 text-lg">{title}</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
};

export default Landing;
