import { useColorScheme } from 'react-native';
import Colors from '@/constants/colors';

export function useColors() {
  const scheme = useColorScheme();
  return scheme === 'light' ? Colors.light : Colors.dark;
}
