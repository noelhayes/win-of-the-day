import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import NewPostForm from '../../components/NewPostForm';
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

describe('NewPostForm', () => {
  const mockOnPostCreated = jest.fn();
  const mockSupabaseClient = {
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(),
  };

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup Supabase client mock
    createClient.mockImplementation(() => mockSupabaseClient);
    
    // Setup auth mock to return a user
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: 'test-user-id' } },
    });
    
    // Setup database query mocks
    mockSupabaseClient.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
      order: jest.fn().mockReturnThis(),
    });
  });

  test('creates a new post with valid input', async () => {
    // Mock successful post creation
    mockSupabaseClient.from.mockImplementation((table) => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: {
          id: 'test-post-id',
          content: 'Test post content',
          user_id: 'test-user-id',
          category_id: 'test-category-id',
        },
      }),
      order: jest.fn().mockReturnThis(),
    }));

    render(<NewPostForm onPostCreated={mockOnPostCreated} />);

    // Find the textarea and submit button
    const textarea = screen.getByPlaceholderText("What's your win of the day?");
    const submitButton = screen.getByRole('button', { name: /post win/i });

    // Type in the post content
    fireEvent.change(textarea, { target: { value: 'Test post content' } });

    // Submit the form
    fireEvent.click(submitButton);

    // Wait for the post to be created
    await waitFor(() => {
      // Verify that the post was created
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('posts');
      expect(mockOnPostCreated).toHaveBeenCalled();
      // Verify the textarea was cleared
      expect(textarea.value).toBe('');
    });
  });

  test('enforces maximum character limit for posts', async () => {
    // Mock error response for long content
    mockSupabaseClient.from.mockImplementation((table) => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockRejectedValue(new Error('Content too long')),
      order: jest.fn().mockReturnThis(),
    }));

    render(<NewPostForm onPostCreated={mockOnPostCreated} />);

    const textarea = screen.getByPlaceholderText("What's your win of the day?");
    const submitButton = screen.getByRole('button', { name: /post win/i });

    // Create a string that's too long (e.g., 1000 characters)
    const longContent = 'a'.repeat(1000);
    
    // Type the long content
    fireEvent.change(textarea, { target: { value: longContent } });

    // Try to submit the form
    fireEvent.click(submitButton);

    // Verify that an error message is displayed
    await waitFor(() => {
      expect(screen.getByText(/content too long/i)).toBeInTheDocument();
    });

    // Verify that the post wasn't created
    expect(mockSupabaseClient.from).toHaveBeenCalledWith('posts');
    expect(mockOnPostCreated).not.toHaveBeenCalled();
  });

  test('disables submit button when content is empty', () => {
    render(<NewPostForm onPostCreated={mockOnPostCreated} />);

    const submitButton = screen.getByRole('button', { name: /post win/i });

    // Button should be disabled initially
    expect(submitButton).toBeDisabled();

    // Type some content
    const textarea = screen.getByPlaceholderText("What's your win of the day?");
    fireEvent.change(textarea, { target: { value: 'Valid content' } });

    // Button should be enabled
    expect(submitButton).not.toBeDisabled();

    // Clear the content
    fireEvent.change(textarea, { target: { value: '' } });

    // Button should be disabled again
    expect(submitButton).toBeDisabled();
  });
});
