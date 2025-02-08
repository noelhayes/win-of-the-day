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
