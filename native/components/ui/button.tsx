import React from 'react';
import { Pressable, StyleProp, ViewStyle, StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { brightenHexColor } from '@/lib/colors';

interface ButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

export default function Button({
  children,
  onPress,
  style,
  containerStyle,
  disabled = false,
}: ButtonProps) {
  const scale = useSharedValue(1);

  // Flatten the style prop to safely extract backgroundColor
  const flattenedStyle = StyleSheet.flatten(style);
  const combinedStaticStyle = StyleSheet.flatten([styles.button, flattenedStyle]);
  const backgroundColor = (flattenedStyle && typeof flattenedStyle === 'object' && 'backgroundColor' in flattenedStyle)
    ? flattenedStyle.backgroundColor
    : '#000000';
  // const glowColor = brightenHexColor(
  //   typeof backgroundColor === 'string' ? backgroundColor : '#000000',
  //   0.3);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const handlePressIn = () => {
    scale.value = withTiming(0.95, { duration: 100 });
  };

  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: 100 });
  };

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={[
        disabled && styles.disabled,
        containerStyle,
      ]}
    >
      <View style={StyleSheet.flatten([combinedStaticStyle])}>
        {children}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    // shadowOffset: { width: 0, height: 0 },
    // shadowOpacity: 0.2,
    // shadowRadius: 8,
    // elevation: 4,
  },
  disabled: {
    opacity: 0.5,
  },
});
