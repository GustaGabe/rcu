import { createContext, useContext } from 'react';

interface OnboardingControls {
  /** Marca a introdução como vista e libera o app. */
  complete: () => Promise<void>;
  /** Mostra a introdução de novo (tela Sobre). */
  restart: () => Promise<void>;
}

export const OnboardingContext = createContext<OnboardingControls | null>(null);

export function useOnboarding(): OnboardingControls {
  const controls = useContext(OnboardingContext);
  if (!controls) throw new Error('useOnboarding precisa estar dentro do layout raiz.');
  return controls;
}
