import React from 'react';
import { motion } from 'framer-motion';

const AnimatedButton = ({ children, ...props }) => {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      {...props}
    >
      {children}
    </motion.button>
  );
};

export default AnimatedButton;
