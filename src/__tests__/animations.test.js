import { render, screen } from '@testing-library/react';
import AnimatedButton from '../animations/AnimatedButton';
import Sparkle from '../animations/Sparkle';
import PageTransition from '../animations/PageTransition';

describe('animation components', () => {
  it('renders AnimatedButton', () => {
    render(<AnimatedButton>Press Me</AnimatedButton>);
    expect(screen.getByText('Press Me')).toBeInTheDocument();
  });

  it('renders Sparkle', () => {
    render(<div style={{ position: 'relative' }}><Sparkle /></div>);
    expect(screen.getAllByText('✨').length).toBeGreaterThan(0);
  });

  it('renders PageTransition', () => {
    render(<PageTransition><div>Page</div></PageTransition>);
    expect(screen.getByText('Page')).toBeInTheDocument();
  });
});
