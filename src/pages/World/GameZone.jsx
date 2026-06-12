// src/pages/World/GameZone.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Gamepad2, Dice5, Swords } from 'lucide-react';

export default function GameZone() {
  const [activeTab, setActiveTab] = useState('ttt');
  const [board, setBoard] = useState(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);

  const checkWinner = (squares) => {
    const lines = [
      [0,1,2], [3,4,5], [6,7,8],
      [0,3,6], [1,4,7], [2,5,8],
      [0,4,8], [2,4,6]
    ];
    for (let line of lines) {
      const [a, b, c] = line;
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a];
      }
    }
    return squares.includes(null) ? null : 'Draw';
  };

  const handleCellClick = (index) => {
    if (board[index] || checkWinner(board)) return;
    const nextBoard = [...board];
    nextBoard[index] = isXNext ? '🧁' : '🐱';
    setBoard(nextBoard);
    setIsXNext(!isXNext);
  };

  const winner = checkWinner(board);

  return (
    <div className="min-h-full w-full bg-[#FFDF80] text-[#2C2512] p-6 font-sans selection:bg-pink-300">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* High-Energy Cartoon Header */}
        <div className="bg-[#FF6B97] border-4 border-[#2C2512] p-6 rounded-3xl shadow-[8px_8px_0px_#2C2512] text-white flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="w-16 h-16 bg-[#36D399] border-4 border-[#2C2512] rounded-2xl flex items-center justify-center text-3xl rotate-[-6deg]">
              🕹️
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight uppercase">Arcade Zone!</h1>
              <p className="text-sm font-bold text-yellow-200">Play together, earn massive XP upgrades!</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setActiveTab('ttt')} className={`px-4 py-2 border-4 border-[#2C2512] rounded-xl font-black uppercase text-xs shadow-[4px_4px_0px_#2C2512] active:translate-y-1 transition-all ${activeTab === 'ttt' ? 'bg-yellow-400 text-black' : 'bg-white text-black'}`}>Tic-Tac-Duo</button>
            <button onClick={() => setActiveTab('truth')} className={`px-4 py-2 border-4 border-[#2C2512] rounded-xl font-black uppercase text-xs shadow-[4px_4px_0px_#2C2512] active:translate-y-1 transition-all ${activeTab === 'truth' ? 'bg-yellow-400 text-black' : 'bg-white text-black'}`}>Duo Truths</button>
          </div>
        </div>

        {/* Game Arenas */}
        <AnimatePresence mode="wait">
          {activeTab === 'ttt' ? (
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white border-4 border-[#2C2512] p-8 rounded-[2rem] shadow-[8px_8px_0px_#2C2512] flex flex-col items-center">
              <h3 className="text-xl font-black uppercase tracking-wider mb-4">
                {winner ? (winner === 'Draw' ? "It's a Tie! 🤝" : `Winner: ${winner} 🎉`) : `Next Turn: ${isXNext ? '🧁' : '🐱'}`}
              </h3>
              
              <div className="grid grid-cols-3 gap-3 w-72 h-72">
                {board.map((cell, idx) => (
                  <button key={idx} onClick={() => handleCellClick(idx)} className="bg-[#F4F3F8] hover:bg-pink-100 active:scale-95 border-4 border-[#2C2512] rounded-2xl text-4xl flex items-center justify-center font-black transition-all shadow-[4px_4px_0px_#2C2512]">
                    {cell}
                  </button>
                ))}
              </div>

              {winner && (
                <button onClick={() => { setBoard(Array(9).fill(null)); setIsXNext(true); }} className="mt-6 px-6 py-2 bg-[#36D399] border-4 border-[#2C2512] font-black uppercase rounded-xl shadow-[4px_4px_0px_#2C2512]">
                  Play Again!
                </button>
              )}
            </motion.div>
          ) : (
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white border-4 border-[#2C2512] p-8 rounded-[2rem] shadow-[8px_8px_0px_#2C2512] text-center space-y-4">
              <Swords className="w-12 h-12 text-[#FF6B97] mx-auto" />
              <h3 className="text-2xl font-black uppercase">Truth or Dare Battle</h3>
              <p className="text-sm font-medium text-gray-600 max-w-md mx-auto">"If you could teleport to your partner right now for exactly 1 hour, what is the very first thing you would do together?"</p>
              <button className="px-6 py-2 bg-[#8B5CF6] text-white border-4 border-[#2C2512] font-black uppercase rounded-xl shadow-[4px_4px_0px_#2C2512]">Draw Next Prompt 🎲</button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}