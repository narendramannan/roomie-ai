import React, { createContext, useContext } from 'react';

export const theme = {
  colors: {
    background: '#fefae0', // soft yellow
    surface: '#ffffff',
    primary: '#a8dadc', // soft blue
    secondary: '#b5e48c', // soft green
    text: '#2f3e46'
  },
  typography: {
    fonts: {
      body: "'Helvetica Neue', Arial, sans-serif",
      heading: "'Georgia', serif"
    },
    sizes: {
      body: '1rem',
      heading: '1.25rem',
      title: '2rem'
    },
    weights: {
      regular: 400,
      bold: 700
    }
  }
};

const ThemeContext = createContext(theme);

export const ThemeProvider = ({ children }) => (
  <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
);

export const useTheme = () => useContext(ThemeContext);

export default theme;
