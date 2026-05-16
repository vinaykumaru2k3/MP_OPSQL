import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Database, Shield, Zap, Activity, ChevronRight, Code2 } from 'lucide-react';
import { motion } from 'framer-motion';

const Landing: React.FC = () => {
  const navigate = useNavigate();

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 80, damping: 15 } }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#0a0a0c] text-zinc-900 dark:text-zinc-100 selection:bg-indigo-500/30 selection:text-indigo-900 dark:selection:text-indigo-200 font-sans flex flex-col relative overflow-hidden transition-colors duration-300">
      
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Glow orbs */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[60%] rounded-full bg-indigo-500/20 dark:bg-indigo-600/10 blur-[140px] mix-blend-multiply dark:mix-blend-screen" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[60%] rounded-full bg-violet-500/20 dark:bg-violet-600/10 blur-[140px] mix-blend-multiply dark:mix-blend-screen" />
        <div className="absolute top-[30%] right-[10%] w-[30%] h-[40%] rounded-full bg-fuchsia-500/20 dark:bg-fuchsia-600/10 blur-[120px] mix-blend-multiply dark:mix-blend-screen" />
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMTI4LCAxMjgsIDEyOCwgMC4xNSkiLz48L3N2Zz4=')] opacity-50 dark:opacity-20 [mask-image:linear-gradient(to_bottom,white,transparent)]" />
      </div>

      {/* Header */}
      <header className="relative z-20 w-full px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Database className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight text-zinc-900 dark:text-white">SchemaForge</span>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/login')}
            className="text-sm font-semibold text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors"
          >
            Sign In
          </button>
          <button 
            onClick={() => navigate('/login')}
            className="group relative text-sm font-semibold px-5 py-2.5 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 overflow-hidden shadow-lg hover:shadow-xl transition-all"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-violet-600 opacity-0 group-hover:opacity-10 transition-opacity" />
            Get Started
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 max-w-6xl mx-auto w-full pt-12 pb-24">
        
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="text-center flex flex-col items-center w-full"
        >
          <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-indigo-500/20 bg-indigo-50/50 dark:bg-indigo-500/10 backdrop-blur-md mb-8 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 uppercase tracking-widest">Multi-Tenant Auth Live</span>
          </motion.div>

          <motion.h1 variants={itemVariants} className="text-5xl sm:text-7xl lg:text-8xl font-extrabold tracking-tighter mb-6">
            <span className="text-transparent bg-clip-text bg-gradient-to-br from-zinc-900 via-zinc-700 to-zinc-500 dark:from-white dark:via-zinc-200 dark:to-zinc-500">
              Migrate Databases
            </span>
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500">
              Without the Friction
            </span>
          </motion.h1>
          
          <motion.p variants={itemVariants} className="text-lg sm:text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
            Enterprise-grade AST parsing. Instantly analyze, convert, and validate massive Oracle deployments into highly optimized PostgreSQL DDL structures.
          </motion.p>

          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 mb-24 w-full justify-center items-center">
            <button
              onClick={() => navigate('/login')}
              className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-semibold rounded-full hover:from-indigo-400 hover:to-violet-500 transition-all shadow-[0_0_30px_rgba(99,102,241,0.4)] hover:shadow-[0_0_40px_rgba(99,102,241,0.6)] hover:-translate-y-0.5 w-full sm:w-auto"
            >
              Access Workspace
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold rounded-full hover:bg-white dark:hover:bg-zinc-800 transition-all shadow-sm w-full sm:w-auto"
            >
              <Code2 className="h-4 w-4 text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-300 transition-colors" />
              View Documentation
            </button>
          </motion.div>

          <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left relative z-20">
            {[
              { 
                icon: Shield, 
                title: 'AST Parsing Engine', 
                desc: 'JSQLParser-powered engine safely processes multi-schema variables and complex dot-qualified identifiers with zero data loss.',
                color: 'text-indigo-500',
                bg: 'bg-indigo-500/10'
              },
              { 
                icon: Zap, 
                title: 'Intelligent Conversion', 
                desc: 'Context-aware transformations. 1-click translation for constraints, sequences, and proprietary PL/SQL functions.',
                color: 'text-violet-500',
                bg: 'bg-violet-500/10'
              },
              { 
                icon: Activity, 
                title: 'Live DB Validation', 
                desc: 'End-to-end testing with native JDBC connectivity, verifying structural integrity directly against live database instances.',
                color: 'text-fuchsia-500',
                bg: 'bg-fuchsia-500/10'
              },
            ].map(({ icon: Icon, title, desc, color, bg }) => (
              <motion.div 
                key={title} 
                variants={itemVariants} 
                className="group relative p-8 rounded-3xl bg-white/60 dark:bg-zinc-900/40 backdrop-blur-xl border border-zinc-200/50 dark:border-white/5 hover:border-zinc-300 dark:hover:border-white/10 hover:shadow-2xl hover:shadow-indigo-500/5 transition-all overflow-hidden"
              >
                {/* Hover gradient background */}
                <div className="absolute inset-0 bg-gradient-to-br from-zinc-50 to-white dark:from-zinc-800/50 dark:to-zinc-900/50 opacity-0 group-hover:opacity-100 transition-opacity -z-10" />
                
                <div className={`w-12 h-12 rounded-2xl ${bg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500`}>
                  <Icon className={`h-6 w-6 ${color}`} />
                </div>
                <h3 className="font-bold text-zinc-900 dark:text-white mb-3 text-xl tracking-tight group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors">{title}</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium">{desc}</p>
                
                <div className="mt-6 flex items-center gap-1 text-sm font-semibold text-zinc-400 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0">
                  Learn more <ChevronRight className="h-4 w-4" />
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
};

export default Landing;
