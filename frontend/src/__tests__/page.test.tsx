import { render, screen } from '@testing-library/react'
import Home from '../app/page'

describe('Home Page', () => {
  it('renders PayPilot heading', () => {
    render(<Home />)
    
    const heading = screen.getByRole('heading', { name: /paypilot/i })
    expect(heading).toBeInTheDocument()
  })

  it('renders description text', () => {
    render(<Home />)
    
    const description = screen.getByText(/non-custodial payment platform/i)
    expect(description).toBeInTheDocument()
  })
})