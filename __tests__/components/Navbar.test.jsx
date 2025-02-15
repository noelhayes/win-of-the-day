import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Navbar from '../../components/Navbar';
import { createClient } from '../../utils/supabase/client';

// Mock next/navigation
const mockPush = jest.fn();
const mockPathname = jest.fn().mockReturnValue('/feed');
jest.mock('next/navigation', () => ({
  usePathname: () => mockPathname(),
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href, className }) => {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    );
  };
});

// Mock Supabase client
jest.mock('../../utils/supabase/client', () => ({
  createClient: jest.fn(),
}));

describe('Navbar', () => {
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
  };

  const mockSupabaseClient = {
    auth: {
      getUser: jest.fn(),
      signOut: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    createClient.mockImplementation(() => mockSupabaseClient);
    
    // Setup auth mock to return a user by default
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
    });

    // Mock window.matchMedia for responsive design testing
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
  });

  test('renders all navigation links for authenticated users', async () => {
    render(<Navbar />);

    // Wait for user data to load
    await waitFor(() => {
      // Check for main navigation links
      expect(screen.getByText('WOTD')).toBeInTheDocument();
      expect(screen.getByText('Feed')).toBeInTheDocument();
      expect(screen.getByText('Profile')).toBeInTheDocument();
      expect(screen.getByText('Sign Out')).toBeInTheDocument();
      
      // Check if links have correct hrefs
      expect(screen.getByText('WOTD').closest('a')).toHaveAttribute('href', '/feed');
      expect(screen.getByText('Feed').closest('a')).toHaveAttribute('href', '/feed');
      expect(screen.getByText('Profile').closest('a')).toHaveAttribute('href', '/profile/test-user-id');
    });

    // Verify search bar is present
    expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
  });

  test('renders minimal navigation for unauthenticated users', async () => {
    // Mock user as not authenticated
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: null },
    });

    render(<Navbar />);

    await waitFor(() => {
      // Check that only public navigation elements are present
      expect(screen.getByText('WOTD')).toBeInTheDocument();
      expect(screen.getByText('Feed')).toBeInTheDocument();
      
      // Verify authenticated-only links are not present
      expect(screen.queryByText('Profile')).not.toBeInTheDocument();
      expect(screen.queryByText('Sign Out')).not.toBeInTheDocument();
    });
  });

  test('handles sign out correctly', async () => {
    mockSupabaseClient.auth.signOut.mockResolvedValue({ error: null });

    render(<Navbar />);

    // Wait for the sign out button to be available
    const signOutButton = await waitFor(() => screen.getByText('Sign Out'));
    
    // Click sign out
    fireEvent.click(signOutButton);

    // Verify sign out was called and redirect happened
    await waitFor(() => {
      expect(mockSupabaseClient.auth.signOut).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith('/');
    });
  });

  test('handles sign out error gracefully', async () => {
    // Mock console.error to verify error logging
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Mock sign out to return an error
    mockSupabaseClient.auth.signOut.mockResolvedValue({ 
      error: new Error('Sign out failed') 
    });

    render(<Navbar />);

    // Click sign out
    const signOutButton = await waitFor(() => screen.getByText('Sign Out'));
    fireEvent.click(signOutButton);

    // Verify error was logged
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error signing out:', 
        expect.any(Error)
      );
    });

    consoleSpy.mockRestore();
  });
});
