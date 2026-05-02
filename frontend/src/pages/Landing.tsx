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
    <div className="min-h-screen bg-[#09090b] text-white selection:bg-white selection:text-black font-sans flex flex-col relative overflow-hidden">
      
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-white/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-white/5 blur-[120px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 w-full px-6 py-5 flex items-center justify-between border-b border-white/10 bg-black/20 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5 text-white" />
          <span className="font-semibold tracking-tight text-white">SchemaForge</span>
        </div>
        <button 
          onClick={() => navigate('/login')}
          className="text-xs font-semibold px-4 py-2 border border-white/20 rounded-full hover:bg-white hover:text-black transition-colors"
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
          <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 mb-6">
            <span className="flex h-2 w-2 rounded-full bg-white animate-pulse" />
            <span className="text-xs font-medium text-zinc-300">v2.0 Architectural Update Live</span>
          </motion.div>

          <motion.h1 variants={itemVariants} className="text-5xl sm:text-7xl font-extrabold tracking-tighter mb-6 text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-500">
            Oracle to PostgreSQL
          </motion.h1>
          
          <motion.p variants={itemVariants} className="text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Enterprise-grade AST schema parsing. Instantly analyze, convert, and validate massive Oracle deployments into highly optimized PostgreSQL DDL structures.
          </motion.p>

          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 mb-20 w-full justify-center">
            <button
              onClick={() => navigate('/login')}
              className="group inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-white text-black font-semibold rounded-full hover:bg-zinc-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)]"
            >
              Access Dashboard
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-transparent border border-white/20 text-white font-semibold rounded-full hover:bg-white/5 transition-all"
            >
              View Documentation
            </button>
          </motion.div>

          <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left">
            <motion.div variants={itemVariants} className="group p-6 rounded-2xl bg-zinc-900/50 border border-white/5 hover:border-white/20 hover:bg-zinc-900 transition-all">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <h3 className="font-semibold text-white mb-2 text-lg">AST Parsing Engine</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">JSQLParser-powered analysis engine safely processing multi-schema variables and dot-qualified identifiers.</p>
            </motion.div>

            <motion.div variants={itemVariants} className="group p-6 rounded-2xl bg-zinc-900/50 border border-white/5 hover:border-white/20 hover:bg-zinc-900 transition-all">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <h3 className="font-semibold text-white mb-2 text-lg">Intelligent Conversion</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">Context-aware transformations. 1-click translation for constraints, sequences, and proprietary functions.</p>
            </motion.div>

            <motion.div variants={itemVariants} className="group p-6 rounded-2xl bg-zinc-900/50 border border-white/5 hover:border-white/20 hover:bg-zinc-900 transition-all">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Activity className="h-5 w-5 text-white" />
              </div>
              <h3 className="font-semibold text-white mb-2 text-lg">Live DB Validation</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">End-to-end testing with native JDBC connectivity, verifying structural integrity directly against live instances.</p>
            </motion.div>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
};

export default Landing;
