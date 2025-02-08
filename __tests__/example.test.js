import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'

describe('Example Component', () => {
  it('should render a basic component', () => {
    // This is just a placeholder test
    const ExampleComponent = () => <div>Hello World</div>
    render(<ExampleComponent />)
    
    const element = screen.getByText('Hello World')
    expect(element).toBeInTheDocument()
  })
})
