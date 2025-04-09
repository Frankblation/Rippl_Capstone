// components/AnimationContext.tsx
import React, { createContext, useState, useContext, ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';

type AnimationContextType = {
  showAnimationOverlay: (component: ReactNode) => void;
  hideAnimationOverlay: () => void;
};

const AnimationContext = createContext<AnimationContextType | undefined>(undefined);

export const AnimationProvider = ({ children }: { children: ReactNode }) => {
  const [overlayContent, setOverlayContent] = useState<ReactNode | null>(null);

  const showAnimationOverlay = (component: ReactNode) => {
    setOverlayContent(component);
  };

  const hideAnimationOverlay = () => {
    setOverlayContent(null);
  };

  return (
    <AnimationContext.Provider value={{ showAnimationOverlay, hideAnimationOverlay }}>
      {children}
      {overlayContent && (
        <View style={[StyleSheet.absoluteFillObject, { zIndex: 9999 }]}>{overlayContent}</View>
      )}
    </AnimationContext.Provider>
  );
};

export const useAnimation = () => {
  const context = useContext(AnimationContext);
  if (context === undefined) {
    throw new Error('useAnimation must be used within an AnimationProvider');
  }
  return context;
};
