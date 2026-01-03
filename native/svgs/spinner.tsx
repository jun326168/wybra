import React, { useEffect } from 'react';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

const AnimatedSvg = Animated.createAnimatedComponent(Svg);

const LoadingSpinner = ({ 
  size = 24, 
  color = '#FFFFFF',
  strokeWidth = 4 
}: { 
  size?: number; 
  color?: string;
  strokeWidth?: number;
}) => {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, {
        duration: 1000,
        easing: Easing.linear,
      }),
      -1,
      false
    );
  }, [rotation]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    };
  });

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;
  // Show about 30% of the circle as the visible arc
  const visibleLength = circumference * 0.3;
  const gapLength = circumference * 0.7;

  return (
    <AnimatedSvg 
      width={size} 
      height={size} 
      style={animatedStyle}
    >
      <Circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={`${visibleLength} ${gapLength}`}
        strokeDashoffset={0}
      />
    </AnimatedSvg>
  );
};

export default LoadingSpinner;

