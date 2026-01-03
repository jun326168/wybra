import { Tabs } from 'expo-router';
import React, { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Easing,
  useAnimatedProps,
  SharedValue,
} from 'react-native-reanimated';

import { colors } from '@/lib/colors';
import Svg, { Path, G } from 'react-native-svg';

const AnimatedG = Animated.createAnimatedComponent(G);

// Animation triggers for each tab
const useAnimationTriggers = () => {
  const radarTrigger = useSharedValue(0);
  const chatsTrigger = useSharedValue(0);
  const profileTrigger = useSharedValue(0);

  const triggers: Record<string, SharedValue<number>> = {
    home: radarTrigger,
    chats: chatsTrigger,
    profile: profileTrigger,
  };

  const triggerAnimation = useCallback((tabName: string) => {
    const trigger = triggers[tabName];
    if (trigger) {
      trigger.value = 0;
      trigger.value = withTiming(1, { duration: 800, easing: Easing.inOut(Easing.quad) });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { triggers, triggerAnimation };
};

interface AnimatedIconProps {
  color: string;
  size: number;
  focused: boolean;
  trigger: SharedValue<number>;
}

// Animated Radar Icon - Spins 360 degrees
function AnimatedRadarIcon({ color, size, trigger }: AnimatedIconProps) {
  const containerStyle = useAnimatedStyle(() => {
    const rotate = interpolate(trigger.value, [0, 1], [0, 360]);
    return {
      transform: [{ rotate: `${rotate}deg` }],
    };
  });

  return (
    <Animated.View style={[{ width: size, height: size }, containerStyle]}>
      <Svg width={size} height={size} viewBox="0 0 18 18" fill="none">
        <Path d="M9.003 18C7.759 18 6.589 17.764 5.493 17.292C4.39767 16.8193 3.44467 16.178 2.634 15.368C1.82333 14.558 1.18167 13.606 0.709 12.512C0.236333 11.418 0 10.2483 0 9.003C0 7.75767 0.236333 6.58767 0.709 5.493C1.181 4.39767 1.82133 3.44467 2.63 2.634C3.43867 1.82333 4.391 1.18167 5.487 0.709C6.583 0.236333 7.753 0 8.997 0C10.241 0 11.411 0.236333 12.507 0.709C13.6023 1.181 14.5553 1.82167 15.366 2.631C16.1767 3.44033 16.8183 4.39267 17.291 5.488C17.7637 6.58333 18 7.753 18 8.997C18 10.241 17.764 11.411 17.292 12.507C16.82 13.603 16.1787 14.556 15.368 15.366C14.5573 16.176 13.6053 16.8177 12.512 17.291C11.4187 17.7643 10.249 18.0007 9.003 18ZM9 17C10.0167 17 10.9743 16.822 11.873 16.466C12.7717 16.1107 13.5757 15.6213 14.285 14.998L12.167 12.881C11.735 13.231 11.2483 13.505 10.707 13.703C10.1637 13.901 9.59467 14 9 14C7.61133 14 6.43067 13.5143 5.458 12.543C4.48533 11.5717 3.99933 10.3923 4 9.005C4.00067 7.61767 4.48633 6.436 5.457 5.46C6.42767 4.484 7.607 3.99733 8.995 4C10.383 4.00267 11.5643 4.48867 12.539 5.458C13.5137 6.42733 14.0007 7.608 14 9C14 9.59867 13.9 10.1683 13.7 10.709C13.5 11.249 13.225 11.737 12.875 12.173L14.992 14.291C15.6153 13.5817 16.1057 12.7783 16.463 11.881C16.8203 10.9837 16.9993 10.0233 17 9C17 6.76667 16.225 4.875 14.675 3.325C13.125 1.775 11.2333 1 9 1C6.76667 1 4.875 1.775 3.325 3.325C1.775 4.875 1 6.76667 1 9C1 11.2333 1.775 13.125 3.325 14.675C4.875 16.225 6.76667 17 9 17ZM9 13C9.45667 13 9.89433 12.9253 10.313 12.776C10.7317 12.6267 11.11 12.422 11.448 12.162L9.25 9.963C9.20933 9.97967 9.16833 9.99 9.127 9.994C9.08633 9.998 9.04533 10 9.004 10C8.73333 10 8.49833 9.90033 8.299 9.701C8.09967 9.50167 8 9.268 8 9C8 8.732 8.09967 8.49833 8.299 8.299C8.49833 8.09967 8.732 8 9 8C9.268 8 9.50167 8.09967 9.701 8.299C9.90033 8.49833 10 8.73067 10 8.996C10 9.04467 9.998 9.091 9.994 9.135C9.99 9.179 9.98 9.22133 9.964 9.262L12.156 11.454C12.416 11.1153 12.6217 10.7383 12.773 10.323C12.9243 9.90767 13 9.46667 13 9C13 7.9 12.6083 6.95833 11.825 6.175C11.0417 5.39167 10.1 5 9 5C7.9 5 6.95833 5.39167 6.175 6.175C5.39167 6.95833 5 7.9 5 9C5 10.1 5.39167 11.0417 6.175 11.825C6.95833 12.6083 7.9 13 9 13Z" fill={color} />
      </Svg>
    </Animated.View>
  );
}

// Animated Chat Icon - Squeezes vertically and bounces back like a cute ball
function AnimatedChatIcon({ color, size, trigger }: AnimatedIconProps) {
  const containerStyle = useAnimatedStyle(() => {
    // Squeeze down and bounce back with overshoot
    const scaleY = interpolate(
      trigger.value,
      [0, 0.3, 0.5, 0.7, 1],
      [1, 0.7, 1.15, 0.95, 1]
    );
    
    // Slightly expand width when squeezed (like a real ball)
    const scaleX = interpolate(
      trigger.value,
      [0, 0.3, 0.5, 0.7, 1],
      [1, 1.15, 0.95, 1.02, 1]
    );
    
    return {
      transform: [{ scaleY }, { scaleX }],
    };
  });

  return (
    <Animated.View style={[{ width: size, height: size }, containerStyle]}>
      <Svg width={size} height={size} viewBox="0 0 19 19" fill="none">
        <Path d="M9.5 18.5C11.28 18.5 13.0201 17.9722 14.5001 16.9832C15.9802 15.9943 17.1337 14.5887 17.8149 12.9442C18.4961 11.2996 18.6743 9.49002 18.3271 7.74419C17.9798 5.99836 17.1226 4.39472 15.864 3.13604C14.6053 1.87737 13.0016 1.0202 11.2558 0.672937C9.50998 0.32567 7.70038 0.5039 6.05585 1.18509C4.41131 1.86628 3.00571 3.01983 2.01677 4.49987C1.02784 5.97991 0.5 7.71997 0.5 9.5C0.5 10.94 0.838 12.3 1.44 13.507C1.893 14.418 1.263 15.647 1.023 16.544C0.96983 16.7424 0.96982 16.9513 1.02297 17.1497C1.07613 17.3481 1.18057 17.529 1.3258 17.6742C1.47103 17.8194 1.65194 17.9239 1.85033 17.977C2.04872 18.0302 2.25761 18.0302 2.456 17.977C3.353 17.737 4.582 17.107 5.493 17.561C6.73821 18.1793 8.10974 18.5007 9.5 18.5Z" stroke={color} strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M14.4475 9.99516C13.4563 12.1069 12.5944 13.0507 11.654 13.0507C10.4628 13.0507 9.76634 11.5665 9.02938 9.99516C8.72167 9.33492 8.39973 8.65485 8.07177 8.16915C7.79034 7.75369 7.53779 7.53433 7.34257 7.53433C7.17794 7.53433 6.55648 7.71189 5.48552 9.99516C5.42722 10.1194 5.32199 10.2153 5.19295 10.2619C5.12906 10.285 5.06125 10.2952 4.9934 10.2921C4.92554 10.289 4.85897 10.2725 4.79747 10.2436C4.67329 10.1853 4.57734 10.0801 4.53075 9.95105C4.48415 9.82202 4.49073 9.67976 4.54902 9.55558C5.54025 7.44382 6.40219 6.5 7.34257 6.5C8.53377 6.5 9.23021 7.98426 9.96717 9.55558C10.277 10.2158 10.5968 10.898 10.9248 11.3816C11.2062 11.797 11.4588 12.0164 11.6574 12.0164C11.8221 12.0164 12.4435 11.8389 13.5145 9.55558C13.5728 9.43139 13.678 9.33544 13.807 9.28885C13.9361 9.24226 14.0783 9.24883 14.2025 9.30712C14.3267 9.36541 14.4227 9.47065 14.4693 9.59969C14.5158 9.72872 14.5093 9.87098 14.451 9.99516H14.4475Z" fill={color} />
      </Svg>
    </Animated.View>
  );
}

// Animated Ghost Icon - Blink replacement effect
function AnimatedGhostIcon({ color, size, trigger }: AnimatedIconProps) {

  const openEyesProps = useAnimatedProps(() => {
    // Blink (show closed eyes) when trigger is between 0.3 and 0.5
    const isBlinking = trigger.value > 0.1 && trigger.value < 0.8;
    return {
      opacity: isBlinking ? 0 : 1,
    };
  });

  const closedEyesProps = useAnimatedProps(() => {
    const isBlinking = trigger.value > 0.1 && trigger.value < 0.8;
    return {
      opacity: isBlinking ? 1 : 0,
    };
  });

  return (
    <Svg width={size} height={size} viewBox="0 0 19 19" fill="none">
      {/* Open Eyes */}
      <AnimatedG animatedProps={openEyesProps}>
        <Path d="M13.5 8.44976C13.5 9.36054 13.0072 10.0997 12.4 10.0997C11.7928 10.0997 11.3 9.36054 11.3 8.44976C11.3 7.53899 11.7928 6.7998 12.4 6.7998C13.0072 6.7998 13.5 7.53899 13.5 8.44976Z" fill={color} />
        <Path d="M7.5 8.44976C7.5 9.36054 7.0072 10.0997 6.39999 10.0997C5.79279 10.0997 5.29999 9.36054 5.29999 8.44976C5.29999 7.53899 5.79279 6.7998 6.39999 6.7998C7.0072 6.7998 7.5 7.53899 7.5 8.44976Z" fill={color} />
      </AnimatedG>
      
      {/* Closed Eyes - Simple curved lines to match style */}
      <AnimatedG animatedProps={closedEyesProps}>
        {/* Right closed eye */}
        <Path d="M11.5 8.45 C11.5 8.45, 12.4 9.0, 13.3 8.45" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
        {/* Left closed eye */}
        <Path d="M5.5 8.45 C5.5 8.45, 6.4 9.0, 7.3 8.45" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
      </AnimatedG>

      {/* Body - static */}
      <Path d="M18.5 9.76972C18.5 4.65157 14.4707 0.5 9.5 0.5C4.5293 0.5 0.5 4.65067 0.5 9.76972V16.4502C0.5 17.64 1.7159 18.414 2.75 17.8821C3.15883 17.6711 3.6173 17.5753 4.07639 17.6048C4.53547 17.6343 4.97792 17.788 5.3564 18.0495C5.78064 18.3428 6.2842 18.5 6.8 18.5C7.3158 18.5 7.81936 18.3428 8.2436 18.0495L8.5613 17.8317C8.83746 17.6417 9.16478 17.5399 9.5 17.5399C9.83522 17.5399 10.1625 17.6417 10.4387 17.8317L10.7564 18.0495C11.1806 18.3428 11.6842 18.5 12.2 18.5C12.7158 18.5 13.2194 18.3428 13.6436 18.0495C14.0222 17.7878 14.4648 17.634 14.9241 17.6045C15.3833 17.575 15.842 17.671 16.2509 17.8821C17.2841 18.414 18.5 17.64 18.5 16.4502V13.1104" stroke={color} strokeLinecap="round" />
    </Svg>
  );
}

export default function TabLayout() {
  const { triggers, triggerAnimation } = useAnimationTriggers();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarShowLabel: false,
        tabBarLabelStyle: {
          fontSize: 11,
          marginTop: -4,
          marginBottom: 4,
        },
        tabBarStyle: {
          backgroundColor: colors.background,
          position: 'absolute',
          left: 20,
          right: 20,
          borderTopWidth: 2,
          borderLeftWidth: 2,
          borderRightWidth: 2,
          borderColor: colors.border,
          height: 100,
          paddingBottom: 8,
          paddingTop: 12,
          borderRadius: 40,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.1,
          shadowRadius: 20,
          elevation: 10,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        listeners={{
          tabPress: () => triggerAnimation('home'),
        }}
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.tabBarIcon, {
              backgroundColor: focused ? colors.primary + '15' : 'transparent',
              borderColor: focused ? colors.primary + '28' : 'transparent',
            }]}>
              <AnimatedRadarIcon color={color} size={focused ? 24 : 26} focused={focused} trigger={triggers.home} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="chats"
        listeners={{
          tabPress: () => triggerAnimation('chats'),
        }}
        options={{
          title: 'Chats',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.tabBarIcon, {
              backgroundColor: focused ? colors.primary + '15' : 'transparent',
              borderColor: focused ? colors.primary + '28' : 'transparent',
            }]}>
              <AnimatedChatIcon color={color} size={focused ? 24 : 26} focused={focused} trigger={triggers.chats} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        listeners={{
          tabPress: () => triggerAnimation('profile'),
        }}
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.tabBarIcon, {
              backgroundColor: focused ? colors.primary + '15' : 'transparent',
              borderColor: focused ? colors.primary + '28' : 'transparent',
            }]}>
              <AnimatedGhostIcon color={color} size={focused ? 24 : 26} focused={focused} trigger={triggers.profile} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarIcon: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 2,
  },
});
