import React, { createContext, useContext } from 'react';

export const theme = {
  colors: {
    background: '#f0f4f8',
    surface: '#ffffff',
    primary: '#7cb1e8',
    secondary: '#a8e6cf',
    accent: '#fff3b0',
    success: '#81c784',
    danger: '#ff8a80',
    textPrimary: '#2d3142',
    textSecondary: '#4f5d75'
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem'
  },
  typography: {
    fonts: {
      body: "'Inter', 'Helvetica Neue', Arial, sans-serif",
      heading: "'Georgia', serif"
    },
    sizes: {
      small: '0.875rem',
      body: '1rem',
      heading: '1.25rem',
      title: '2rem'
    },
    weights: {
      light: 300,
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
