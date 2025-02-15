# Testing Documentation

This document outlines the testing strategy and practices for the Win of the Day project.

## Testing Stack

- **Jest**: Primary testing framework
- **React Testing Library**: Component testing
- **@testing-library/user-event**: User interaction simulation
- **jest-environment-jsdom**: DOM environment for component testing

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (recommended during development)
npm run test:watch

# Generate test coverage report
npm run test:coverage
```

## Test Structure

Tests are organized following the component structure:

```
__tests__/                  # Global test configurations and utilities
├── README.md              # This documentation
├── example.test.js        # Example test file
components/                # Component tests co-located with components
├── ComponentName/
│   ├── ComponentName.js
│   └── ComponentName.test.js
```

## Writing Tests

### Component Tests

```javascript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import YourComponent from './YourComponent'

describe('YourComponent', () => {
  it('should render correctly', () => {
    render(<YourComponent />)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('should handle user interactions', async () => {
    const user = userEvent.setup()
    render(<YourComponent />)
    await user.click(screen.getByRole('button'))
    // Add assertions here
  })
})
```

### Best Practices

1. **Test Description**
   - Use clear, descriptive test names
   - Follow the pattern: "should [expected behavior] when [condition]"

2. **Component Testing**
   - Test component rendering
   - Test user interactions
   - Test error states
   - Test loading states
   - Test edge cases

3. **API Testing**
   - Mock external API calls
   - Test success and error responses
   - Validate request/response formats

4. **Coverage**
   - Aim for high coverage of critical paths
   - Don't chase 100% coverage blindly
   - Focus on business-critical functionality

## Current Test Coverage

### Component Tests

#### Navbar (`__tests__/components/Navbar.test.jsx`)
Tests the main navigation component with focus on authentication states and user actions:

```javascript
// Authentication State Tests
test('renders all navigation links for authenticated users')
test('renders minimal navigation for unauthenticated users')

// User Action Tests
test('handles sign out correctly')
test('handles sign out error gracefully')
```

Key testing points:
- Authentication-based rendering
- Sign out functionality
- Error handling
- Navigation state management

#### Profile (`__tests__/components/Profile.test.jsx`)
Tests profile management functionality:

```javascript
// Profile Management Tests
test('updates user profile with valid data')
test('displays correct user information on profile page')
test('handles profile loading error gracefully')
```

Key testing points:
- Profile data updates
- Profile information display
- Error state handling
- Form validation

#### NewPostForm (`__tests__/components/NewPostForm.test.jsx`)
Tests post creation functionality:

```javascript
// Post Creation Tests
test('submits form with valid input')
test('validates character limit')
test('manages submit button state')
```

Key testing points:
- Form submission
- Input validation
- UI state management
- Error handling

### Common Test Patterns

1. **Authentication Testing**
   ```javascript
   // Mock authenticated user
   mockSupabaseClient.auth.getUser.mockResolvedValue({
     data: { user: mockUser },
   });

   // Test authenticated state
   await waitFor(() => {
     expect(screen.getByText('Profile')).toBeInTheDocument();
   });
   ```

2. **Form Submission**
   ```javascript
   // Simulate form input
   fireEvent.change(screen.getByRole('textbox'), {
     target: { value: 'Test input' },
   });

   // Submit form
   fireEvent.click(screen.getByRole('button', { name: /submit/i }));

   // Verify submission
   await waitFor(() => {
     expect(mockSubmit).toHaveBeenCalled();
   });
   ```

3. **Error Handling**
   ```javascript
   // Mock error response
   mockSupabaseClient.from().update.mockRejectedValue(new Error('Test error'));

   // Verify error handling
   await waitFor(() => {
     expect(console.error).toHaveBeenCalled();
   });
   ```

### Mocking Patterns

1. **Next.js Navigation**
   ```javascript
   jest.mock('next/navigation', () => ({
     usePathname: () => '/feed',
     useRouter: () => ({
       push: jest.fn(),
     }),
   }));
   ```

2. **Supabase Client**
   ```javascript
   jest.mock('../utils/supabase/client', () => ({
     createClient: jest.fn(() => ({
       auth: {
         getUser: jest.fn(),
         signOut: jest.fn(),
       },
       from: jest.fn(),
     })),
   }));
   ```

3. **Next.js Link Component**
   ```javascript
   jest.mock('next/link', () => {
     return ({ children, href, className }) => {
       return <a href={href} className={className}>{children}</a>;
     };
   });
   ```

## Testing Guidelines

1. **Component Testing**
   - Test both authenticated and unauthenticated states
   - Verify all user interactions
   - Test error states and loading states
   - Validate form inputs and submissions

2. **Mocking**
   - Mock external dependencies (Supabase, Next.js)
   - Use consistent mock patterns across tests
   - Reset mocks between tests

3. **Assertions**
   - Use semantic queries (getByRole, getByText)
   - Avoid implementation details
   - Test user-visible behavior

4. **Test Organization**
   - Group related tests with describe blocks
   - Use clear, descriptive test names
   - Follow the AAA pattern (Arrange, Act, Assert)

## Continuous Integration

Tests are automatically run on GitHub Actions:
- On every push to the `main` branch
- On every pull request
- Test results are visible in the GitHub PR interface

## Mocking

### API Mocks
```javascript
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    // Add other router methods as needed
  }),
}))
```

### Environment Variables
Create a `.env.test` file for test-specific environment variables.

## Debugging Tests

1. Use `screen.debug()` to print the current DOM state
2. Use `console.log()` within tests (removed in production)
3. Run specific tests using:
   ```bash
   npm run test -- -t "test name"
   ```

## Adding New Tests

1. Create test file adjacent to the component being tested
2. Import necessary testing utilities
3. Write test cases covering:
   - Basic rendering
   - User interactions
   - Edge cases
   - Error states

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library Documentation](https://testing-library.com/docs/react-testing-library/intro/)
- [Testing Library Queries](https://testing-library.com/docs/queries/about)
