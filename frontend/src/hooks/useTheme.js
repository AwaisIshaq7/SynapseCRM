import { useAuthContext } from '../context/AuthContext'

/**
 * Custom hook to access theme and toggle functionality.
 * Wraps useAuthContext for theme-specific operations.
 */
export function useTheme() {
  const { theme, toggleTheme } = useAuthContext()
  return { theme, toggleTheme }
}