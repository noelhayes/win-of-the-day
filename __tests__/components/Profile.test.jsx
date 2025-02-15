import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import EditProfilePage from '../../app/(authenticated)/profile/edit/page';
import ProfilePage from '../../app/(authenticated)/profile/page';
import { createClient } from '../../utils/supabase/client';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
  }),
}));

// Mock Supabase client
jest.mock('../../utils/supabase/client', () => ({
  createClient: jest.fn(),
}));

describe('Profile Management', () => {
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
  };

  const mockProfile = {
    id: 'test-user-id',
    name: 'Test User',
    bio: 'Original bio',
    profile_image: 'https://example.com/image.jpg',
  };

  const mockSupabaseClient = {
    auth: {
      getUser: jest.fn(),
      onAuthStateChange: jest.fn().mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } }),
    },
    from: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    createClient.mockImplementation(() => mockSupabaseClient);
    
    // Setup auth mock to return a user
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });
  });

  test('updates user profile with valid data', async () => {
    // Mock successful profile fetch and update
    const updateMock = jest.fn().mockResolvedValue({ error: null });
    mockSupabaseClient.from.mockImplementation((table) => ({
      select: jest.fn().mockReturnThis(),
      update: jest.fn(() => ({
        eq: jest.fn().mockResolvedValue({ error: null }),
      })),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: mockProfile,
        error: null,
      }),
    }));

    render(<EditProfilePage />);

    // Wait for profile data to load
    await waitFor(() => {
      expect(screen.getByDisplayValue('Test User')).toBeInTheDocument();
    });

    // Update form fields
    const nameInput = screen.getByDisplayValue('Test User');
    const bioInput = screen.getByDisplayValue('Original bio');
    const submitButton = screen.getByRole('button', { name: /save changes/i });

    fireEvent.change(nameInput, { target: { value: 'Updated Name' } });
    fireEvent.change(bioInput, { target: { value: 'Updated bio information' } });

    // Submit form
    fireEvent.click(submitButton);

    // Verify profile update was attempted
    await waitFor(() => {
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('profiles');
    });
  });

  test('displays correct user information on profile page', async () => {
    // Mock successful profile and related data fetch
    mockSupabaseClient.from.mockImplementation((table) => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: {
          ...mockProfile,
          goals: [],
          posts: [],
        },
        error: null,
      }),
    }));

    render(<ProfilePage />);

    // Wait for profile data to load and verify display
    await waitFor(() => {
      // Verify user name is displayed
      expect(screen.getByText('Test User')).toBeInTheDocument();
      
      // Verify edit profile button is present
      expect(screen.getByRole('button', { name: /edit profile/i })).toBeInTheDocument();
      
      // Verify profile sections are present
      expect(screen.getByRole('heading', { name: /target wins of the year/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /add goal/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /daily habits/i })).toBeInTheDocument();
    });

    // Verify stats are displayed
    expect(screen.getByText(/total wins/i)).toBeInTheDocument();
    expect(screen.getByText(/completed goals/i)).toBeInTheDocument();
    expect(screen.getByText(/in progress/i)).toBeInTheDocument();
  });

  test('handles profile loading error gracefully', async () => {
    // Mock profile fetch error
    mockSupabaseClient.from.mockImplementation((table) => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: null,
        error: new Error('Failed to load profile'),
      }),
    }));

    render(<ProfilePage />);

    // Verify error state is handled
    await waitFor(() => {
      expect(screen.getByText(/profile not found/i)).toBeInTheDocument();
      expect(screen.getByText(/please sign in to view your profile/i)).toBeInTheDocument();
    });
  });
});
