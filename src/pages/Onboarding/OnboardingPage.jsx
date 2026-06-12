import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useSpace } from '../../context/SpaceContext';
import { Users, Copy, ArrowLeft, Check, Sparkles, LogIn } from 'lucide-react';
import Button from '../../components/ui/Button';

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { user, linkPartnerMock } = useSpace();
  const [mode, setMode] = useState('choice'); // choice, create, join
  const [generatedCode] = useState(() => Math.random().toString(36).substring(2, 8).toUpperCase());
  const [inputCode, setInputCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleJoinSubmit = (e) => {
    e.preventDefault();
    if (inputCode.trim().length !== 6) return;
    
    setIsConnecting(true);
    // Simulate real-time validation lag for interactive immersion
    setTimeout(() => {
      linkPartnerMock(inputCode.toUpperCase());
      setIsConnecting(false);
      navigate('/room');
    }, 2000);
  };

  // Shared framer motion wrapper animations
  const cardVariants = {
    hidden: { opacity: 0, scale: 0.96, x: mode === 'choice' ? -20 : 20 },
    visible: { opacity: 1, scale: 1, x: 0, transition: { duration: 0.4, ease: "easeOut" } },
    exit: { opacity: 0, scale: 0.96, x: mode === 'choice' ? 20 : -20, transition: { duration: 0.3 } }
  };

  return (
    <div className="flex-grow flex items-center justify-center p-4 min-h-[calc(100vh-100px)]">
      <div className="w-full max-w-md relative">
        
        {/* Top Floating User Meta Badge */}
        {user && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-[-55px] left-1/2 -translate-x-1/2 flex items-center gap-2 glass-panel py-1.5 px-4 rounded-full text-xs border border-white/5"
          >
            <span className="text-base">{user.avatar}</span>
            <span className="text-cozy-muted">Logged in as</span>
            <span className="text-white font-medium">{user.name}</span>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {/* STATE A: THE INITIAL LINK CHOICE CHASSIS */}
          {mode === 'choice' && (
            <motion.div 
              key="choice" variants={cardVariants} initial="hidden" animate="visible" exit="exit"
              className="glass-card rounded-3xl p-8 border border-white/5"
            >
              <div className="text-center mb-8">
                <div className="w-12 h-12 rounded-2xl bg-accent-purple/10 flex items-center justify-center mx-auto mb-4 text-accent-purple">
                  <Users className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-bold text-white tracking-wide">Connect Your Duo</h2>
                <p className="text-cozy-muted text-sm mt-2 font-light">
                  Establish an exclusive, persistent real-time portal to your favorite person.
                </p>
              </div>

              <div className="space-y-4">
                <button 
                  onClick={() => setMode('create')}
                  className="w-full glass-panel hover:bg-cozy-soft/50 p-5 rounded-2xl border border-white/5 hover:border-accent-purple/30 text-left transition-all duration-300 group cursor-pointer"
                >
                  <h4 className="text-white font-semibold flex items-center gap-2 text-base">
                    Create New Space
                  </h4>
                  <p className="text-cozy-muted text-xs mt-1 font-light leading-relaxed">
                    Generate a secret space key to invite your best friend, partner, or duo partner.
                  </p>
                </button>

                <button 
                  onClick={() => setMode('join')}
                  className="w-full glass-panel hover:bg-cozy-soft/50 p-5 rounded-2xl border border-white/5 hover:border-accent-pink/30 text-left transition-all duration-300 group cursor-pointer"
                >
                  <h4 className="text-white font-semibold flex items-center gap-2 text-base">
                    Enter Invite Code
                  </h4>
                  <p className="text-cozy-muted text-xs mt-1 font-light leading-relaxed">
                    Have an entry code from your partner? Enter it here to instantly load your shared world.
                  </p>
                </button>
              </div>
            </motion.div>
          )}

          {/* STATE B: GENERATED CODE VIEW (CREATOR WAITING LOBBY) */}
          {mode === 'create' && (
            <motion.div 
              key="create" variants={cardVariants} initial="hidden" animate="visible" exit="exit"
              className="glass-card rounded-3xl p-8 border border-white/5 relative"
            >
              <button onClick={() => setMode('choice')} className="absolute top-6 left-6 text-cozy-muted hover:text-white transition-colors cursor-pointer">
                <ArrowLeft className="w-5 h-5" />
              </button>

              <div className="text-center mt-4 mb-8">
                <h3 className="text-xl font-bold text-white">Your Secret Key</h3>
                <p className="text-cozy-muted text-xs mt-1 font-light">Share this code with your favorite person.</p>
              </div>

              <div className="glass-panel p-4 rounded-2xl flex items-center justify-between border border-white/5 bg-cozy-dark/40 mb-8">
                <span className="font-mono text-2xl tracking-widest text-accent-pink font-bold pl-2">{generatedCode}</span>
                <Button variant="secondary" className="!p-2.5 !rounded-xl" onClick={copyToClipboard}>
                  {copied ? <Check className="w-4 h-4 text-accent-cyan" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>

              <div className="flex flex-col items-center justify-center p-6 glass-panel rounded-2xl border border-white/5 bg-cozy-soft/20">
                <div className="relative flex items-center justify-center mb-4">
                  <div className="w-8 h-8 rounded-full bg-accent-purple/30 animate-ping absolute" />
                  <div className="w-4 h-4 rounded-full bg-accent-purple" />
                </div>
                <p className="text-xs font-mono text-cozy-muted uppercase tracking-widest text-center animate-pulse">
                  Waiting for partner to link...
                </p>
              </div>
            </motion.div>
          )}

          {/* STATE C: CODE INPUT PANEL (JOINER FLOW) */}
          {mode === 'join' && (
            <motion.div 
              key="join" variants={cardVariants} initial="hidden" animate="visible" exit="exit"
              className="glass-card rounded-3xl p-8 border border-white/5 relative"
            >
              <button onClick={() => setMode('choice')} className="absolute top-6 left-6 text-cozy-muted hover:text-white transition-colors cursor-pointer">
                <ArrowLeft className="w-5 h-5" />
              </button>

              <div className="text-center mt-4 mb-8">
                <h3 className="text-xl font-bold text-white">Enter Duo Key</h3>
                <p className="text-cozy-muted text-xs mt-1 font-light">Input the 6-digit key sent by your partner.</p>
              </div>

              <form onSubmit={handleJoinSubmit} className="space-y-6">
                <div className="relative">
                  <input 
                    type="text"
                    maxLength={6}
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                    placeholder="E.G. X8Y2KA"
                    disabled={isConnecting}
                    className="w-full bg-cozy-dark/60 border border-white/10 rounded-2xl py-4 px-6 text-center font-mono text-2xl tracking-widest font-bold text-white focus:outline-none focus:border-accent-purple transition-all placeholder:text-cozy-soft uppercase placeholder:font-sans placeholder:text-sm placeholder:tracking-normal"
                  />
                </div>

                <Button 
                  type="submit" 
                  variant="primary" 
                  disabled={inputCode.length !== 6 || isConnecting}
                  className="w-full !py-3.5 text-sm font-semibold tracking-wide disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isConnecting ? (
                    <div className="flex items-center gap-2 uppercase text-xs tracking-wider font-mono">
                      <Sparkles className="w-4 h-4 animate-spin text-accent-cyan" /> Connecting World...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <LogIn className="w-4 h-4" /> Link With Partner
                    </div>
                  )}
                </Button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}