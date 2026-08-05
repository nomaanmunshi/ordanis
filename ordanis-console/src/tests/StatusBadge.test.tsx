import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { StatusBadge } from '../components/StatusBadge'

describe('StatusBadge', () => {
  it('renders status as text so colour is not the only signal', () => {
    render(<StatusBadge status="RETRY_WAIT" />)
    expect(screen.getByText('RETRY WAIT')).toBeInTheDocument()
  })
})
