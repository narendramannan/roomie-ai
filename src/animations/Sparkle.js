import React from 'react';
import { motion } from 'framer-motion';

const Sparkle = () => {
  const sparkles = Array.from({ length: 8 }).map((_, i) => ({
    id: i,
    x: (Math.random() - 0.5) * 100,
    y: (Math.random() - 0.5) * 100,
  }));

  return (
    <div className="absolute inset-0 pointer-events-none">
      {sparkles.map(s => (
        <motion.span
          key={s.id}
          initial={{ opacity: 1, scale: 0 }}
          animate={{ opacity: 0, scale: 1, x: s.x, y: s.y }}
          transition={{ duration: 1.2 }}
          className="absolute text-yellow-400 text-xl"
        >
          ✨
        </motion.span>
      ))}
    </div>
  );
};

export default Sparkle;
