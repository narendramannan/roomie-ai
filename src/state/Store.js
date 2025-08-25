import React, { createContext, useReducer, useContext } from 'react';

// Initial global state
const initialState = {
  user: null,
  profile: null,
  match: null,
};

// Reducer function to handle state changes
function reducer(state, action) {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'SET_PROFILE':
      return { ...state, profile: action.payload };
    case 'SET_MATCH':
      return { ...state, match: action.payload };
    default:
      return state;
  }
}

// Create context
const StoreContext = createContext();

// Provider component
export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const setUser = (user) => dispatch({ type: 'SET_USER', payload: user });
  const setProfile = (profile) => dispatch({ type: 'SET_PROFILE', payload: profile });
  const setMatch = (match) => dispatch({ type: 'SET_MATCH', payload: match });

  return (
    <StoreContext.Provider value={{ state, setUser, setProfile, setMatch }}>
      {children}
    </StoreContext.Provider>
  );
}

// Custom hook to use the store
export function useStore() {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}

export default StoreContext;
