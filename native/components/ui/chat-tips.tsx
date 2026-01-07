import { View, Text, StyleSheet, Pressable, Animated } from 'react-native'
import React, { useEffect, useRef } from 'react'
import { colors } from '@/lib/colors'
import LogoIcon from '@/svgs/logo'
import Button from './button';

interface ChatTipsProps {
  visible: boolean;
  children?: React.ReactNode;
  onPress: () => void;
}

const ChatTips = ({ visible, children, onPress }: ChatTipsProps) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const [shouldRender, setShouldRender] = React.useState(false);

  useEffect(() => {
    if (visible) {
      setShouldRender(true);
      // Ghost fades in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();

      // Text bubble scales in from ghost position with a slight delay
      Animated.spring(scaleAnim, {
        toValue: 1,
        delay: 200,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();
    } else if (shouldRender) {
      // Fade out
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setShouldRender(false);
      });
    }
  }, [visible, fadeAnim, scaleAnim, shouldRender]);

  if (!shouldRender) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Ghost Logo */}
        <View>
          <LogoIcon
            size={40}
            floatingY={4}
            stroke={colors.background}
          />
        </View>

        {/* Speech Bubble */}
        <Animated.View
          style={[
            styles.bubbleContainer,
            {
              opacity: scaleAnim,
              transform: [
                { scale: scaleAnim },
                {
                  translateX: scaleAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-40, 0], // Scale from ghost position
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.bubble}>
            {children}
            <View style={styles.bubbleButtonContainer}>
              <Button style={styles.bubbleButton} onPress={onPress}>
                <Text style={styles.bubbleButtonText}>知道了</Text>
              </Button>
            </View>
          </View>
        </Animated.View>
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 120,
    left: 0,
    right: 0,
    paddingHorizontal: 30,
    zIndex: 100,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  bubbleContainer: {
    flex: 1,
    transformOrigin: 'left bottom',
    marginBottom: 10,
  },
  bubble: {
    backgroundColor: colors.border,
    padding: 16,
    borderRadius: 20,
    borderBottomLeftRadius: 4,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    position: 'relative',
    gap: 16,
  },
  bubbleText: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 20,
  },
  bubbleButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  bubbleButton: {
    backgroundColor: colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  bubbleButtonText: {
    fontSize: 13,
    color: colors.text,
    fontWeight: '600',
  },
});

export default ChatTips;