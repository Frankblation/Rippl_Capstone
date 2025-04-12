"use client"

import type React from "react"
import { useRef, useEffect } from "react"
import { Animated, type ViewProps } from "react-native"

interface ScaleInViewProps extends ViewProps {
  duration?: number
  delay?: number
  initialScale?: number
  finalScale?: number
}

const ScaleInView: React.FC<ScaleInViewProps> = ({
  children,
  duration = 300,
  delay = 0,
  initialScale = 0.9,
  finalScale = 1,
  style,
  ...props
}) => {
  const scale = useRef(new Animated.Value(initialScale)).current

  useEffect(() => {
    Animated.timing(scale, {
      toValue: finalScale,
      duration: duration,
      delay: delay,
      useNativeDriver: true,
    }).start()
  }, [scale, duration, delay, finalScale])

  return (
    <Animated.View
      style={[
        {
          transform: [{ scale }],
        },
        style,
      ]}
      {...props}
    >
      {children}
    </Animated.View>
  )
}

export default ScaleInView
