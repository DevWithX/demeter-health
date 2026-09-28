import { fireEvent, render, screen } from '@testing-library/react';
import App from './App';
jest.mock('./ExerciseDemo', () => () => null);
beforeEach(() => {
  localStorage.clear();
  Element.prototype.scrollIntoView = jest.fn();
});
test('starts onboarding with the selected coach', () => {
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: /begin your journey/i }));
  fireEvent.click(screen.getByRole('button', { name: /the zen guide/i }));
  expect(screen.getByText(/what is your name/i)).toBeInTheDocument();
});
test('allows a returning user to clear their saved profile', () => {
  localStorage.setItem('demeter_user_profile', JSON.stringify({ name: 'Amina' }));
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: /begin your journey/i }));
  expect(screen.getByText(/welcome back, Amina/i)).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /clear saved profile/i }));
  expect(localStorage.getItem('demeter_user_profile')).toBeNull();
  expect(screen.queryByText(/welcome back/i)).not.toBeInTheDocument();
});
