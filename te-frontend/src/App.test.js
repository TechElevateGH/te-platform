import { render, screen } from '@testing-library/react';
import App from './App';

jest.mock('axios', () => ({
  __esModule: true,
  default: {
    create: () => ({
      defaults: { baseURL: 'http://localhost:8000/v1/' },
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() },
      },
    }),
  },
}));

test('renders the TechElevate landing experience', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: /make your next move count/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /start building for free/i })).toBeInTheDocument();
});
