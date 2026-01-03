import React, { useEffect } from 'react';
import Svg, { Path, Ellipse, G } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  useAnimatedProps,
} from 'react-native-reanimated';

const AnimatedG = Animated.createAnimatedComponent(G);

const LogoIcon = ({ size = 120, color = '#EAE8FF', stroke = '#121418', floatingY = 16 }: { size?: number, color?: string, stroke?: string, floatingY?: number }) => {
  const translateY = useSharedValue(0);
  const blink = useSharedValue(0);

  useEffect(() => {
    // Floating animation
    translateY.value = withRepeat(
      withTiming(-floatingY, {
        duration: 1200,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    );

    // Blinking animation
    blink.value = withRepeat(
      withSequence(
        withDelay(4000, withTiming(1, { duration: 0 })), // Switch to closed eyes instantly
        withDelay(150, withTiming(0, { duration: 0 }))   // Switch back to open eyes instantly
      ),
      -1,
      false
    );
  }, [translateY, blink, floatingY]);

  const containerStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  const openEyesProps = useAnimatedProps(() => {
    return {
      opacity: blink.value < 0.5 ? 1 : 0,
    };
  });

  const closedEyesProps = useAnimatedProps(() => {
    return {
      opacity: blink.value >= 0.5 ? 1 : 0,
    };
  });

  return (
    <Animated.View style={containerStyle}>
      <Svg width={size} height={size * 239 / 231} viewBox="0 0 231 239" fill="none">
        <Path d="M225.472 127.618C225.472 65.8365 176.225 15.7225 115.472 15.7225C54.7192 15.7225 5.47223 65.8256 5.47223 127.618V208.259C5.47223 222.621 20.3332 231.963 32.9722 225.543C37.969 222.997 43.5725 221.84 49.1836 222.196C54.7947 222.552 60.2023 224.407 64.8282 227.564C70.0134 231.105 76.168 233.002 82.4722 233.002C88.7765 233.002 94.9311 231.105 100.116 227.564L103.999 224.934C107.375 222.641 111.375 221.413 115.472 221.413C119.569 221.413 123.57 222.641 126.945 224.934L130.828 227.564C136.013 231.105 142.168 233.002 148.472 233.002C154.776 233.002 160.931 231.105 166.116 227.564C170.743 224.405 176.153 222.548 181.766 222.192C187.38 221.837 192.985 222.995 197.983 225.543C210.611 231.963 225.472 222.621 225.472 208.259V127.618Z" fill={color} stroke={stroke} strokeWidth="10.9444" strokeLinecap="round" />
        
        {/* Open Eyes */}
        <AnimatedG animatedProps={openEyesProps} opacity={1}>
          <Ellipse cx="118" cy="113" rx="10" ry="14" fill={stroke} />
          <Ellipse cx="171" cy="113" rx="10" ry="14" fill={stroke} />
        </AnimatedG>

        {/* Closed Eyes */}
        <AnimatedG animatedProps={closedEyesProps} opacity={0}>
          <Path d="M103.746 110.575C103.746 110.575 112.074 115.105 118.223 114.985C124.002 114.872 131.665 110.575 131.665 110.575" stroke={stroke} strokeWidth="7" strokeLinecap="round" />
          <Path d="M157.35 110.575C157.35 110.575 165.678 115.105 171.827 114.985C177.606 114.872 185.269 110.575 185.269 110.575" stroke={stroke} strokeWidth="7" strokeLinecap="round" />
        </AnimatedG>

        <Ellipse cx="49.5839" cy="130.98" rx="27.3604" ry="38.6029" fill={stroke} />
        <Path d="M45.1169 100.098C45.1169 100.098 37.858 76.3843 51.8174 46.0534C65.7768 15.7225 95.9291 8.00192 95.9291 8.00192" stroke={stroke} strokeWidth="16" strokeLinecap="round" />
        <Ellipse cx="43.4418" cy="130.98" rx="16.7513" ry="25.3676" fill={color} />
      </Svg>
    </Animated.View>
  );
};

export default LogoIcon;
