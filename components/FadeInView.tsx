"use client"

import type React from "react"
import { useRef, useEffect } from "react"
import { Animated, type ViewProps } from "react-native"

interface FadeInViewProps extends ViewProps {
  duration?: number
  delay?: number
  initialOpacity?: number
  finalOpacity?: number
}

const FadeInView: React.FC<FadeInViewProps> = ({
  children,
  duration = 300,
  delay = 0,
  initialOpacity = 0,
  finalOpacity = 1,
  style,
  ...props
}) => {
  const opacity = useRef(new Animated.Value(initialOpacity)).current

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: finalOpacity,
      duration: duration,
      delay: delay,
      useNativeDriver: true,
    }).start()
  }, [opacity, duration, delay, finalOpacity])

  return (
    <Animated.View
      style={[
        {
          opacity,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </Animated.View>
  )
}

export default FadeInView
