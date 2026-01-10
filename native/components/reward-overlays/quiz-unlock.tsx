import { View, StyleSheet, Animated, Text } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import { Image } from 'expo-image'
import * as Haptics from 'expo-haptics'
import { colors } from '@/lib/colors'
import LogoIcon from '@/svgs/logo'
import Button from '@/components/ui/button' // Assuming you have this
import type { User } from '@/lib/types'

interface QuizUnlockProps {
  visible: boolean;
  onStartQuiz: () => void;
  onClose: () => void; // To minimize if they aren't ready
  otherUser: User | null;
}

const QuizUnlock = ({ visible, onStartQuiz, onClose, otherUser }: QuizUnlockProps) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const [shouldRender, setShouldRender] = useState(false);
  
  // Ghost position states
  const [overlayDimensions, setOverlayDimensions] = useState<{ width: number; height: number } | null>(null);
  const [overlaySize, setOverlaySize] = useState<number | null>(null);
  const [ghostPosition, setGhostPosition] = useState<{ x: number; y: number } | null>(null);

  const otherUserAvatarUrl = otherUser?.personal_info?.avatar_url;
  const otherUserColor = otherUser?.personal_info?.color as string || colors.primary;
  const otherUserLogoStrokeColor = otherUser?.personal_info?.color === colors.background ? colors.textSecondary : (otherUser?.personal_info?.color as string || colors.textSecondary);

  // Update ghost position when dimensions or user data changes
  useEffect(() => {
    if (overlayDimensions && otherUser?.personal_info?.ghost_pos) {
      const { width, height } = overlayDimensions;
      const savedGhostPos = otherUser.personal_info.ghost_pos as { x: number; y: number; size: number };
      const containerSize = Math.min(width, height);
      
      // Convert percentages to pixels
      const size = (savedGhostPos.size / 100) * containerSize;
      const x = (savedGhostPos.x / 100) * width;
      const y = (savedGhostPos.y / 100) * height;
      
      setOverlaySize(Math.max(20, size));
      setGhostPosition({ x, y });
    } else if (overlayDimensions && !otherUser?.personal_info?.ghost_pos) {
      // Default: center, 50% size
      const { width, height } = overlayDimensions;
      const containerSize = Math.min(width, height);
      const size = containerSize * 0.5;
      setOverlaySize(size);
      setGhostPosition({ x: (width - size) / 2, y: (height - size) / 2 });
    }
  }, [otherUser?.personal_info?.ghost_pos, overlayDimensions]);

  useEffect(() => {
    if (visible) {
      setShouldRender(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); // "Alert" feeling

      // 1. Enter: Fade In & Scale Up
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, friction: 6, useNativeDriver: true })
      ]).start(() => {
        // 2. Loop: Gentle Shake/Vibration (Energy building up)
        Animated.loop(
          Animated.sequence([
            Animated.timing(shakeAnim, { toValue: -5, duration: 100, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 5, duration: 100, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
            Animated.delay(3000)
          ])
        ).start();
      });

    } else if (shouldRender) {
      Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true })
        .start(() => setShouldRender(false));
    }
  }, [visible, shouldRender, fadeAnim, scaleAnim, shakeAnim]);

  if (!shouldRender) return null;

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.backdrop} />

      <View style={styles.content}>
        {/* The "Locked" Avatar */}
        <Animated.View style={[
          styles.avatarContainer,
          {
            borderColor: otherUserColor,
            transform: [
              { scale: scaleAnim },
              { translateX: shakeAnim } // Shaking effect
            ]
          }
        ]}>
          <Image source={{ uri: otherUserAvatarUrl }} style={styles.avatarImage} />
          {/* Heavy Overlay */}
          <View 
            style={[styles.overlay, { backgroundColor: colors.background + '80' }]}
            onLayout={(e) => {
              const { width, height } = e.nativeEvent.layout;
              setOverlayDimensions({ width, height });
            }}
          >
            {ghostPosition && overlaySize && (
              <View 
                style={[
                  styles.lockedStateContent,
                  {
                    position: 'absolute',
                    left: ghostPosition.x,
                    top: ghostPosition.y,
                    width: overlaySize,
                    height: overlaySize,
                  }
                ]}
              >
                <LogoIcon
                  size={overlaySize}
                  floatingY={0}
                  stroke={otherUserLogoStrokeColor}
                />
              </View>
            )}
          </View>
        </Animated.View>

        {/* Text Content */}
        <View style={styles.textContainer}>
          <Text style={styles.title}>契合度爆表！</Text>
          <Text style={styles.subtitle}>
            通過 {otherUser?.username} 的默契大考驗，{'\n'}
            揭開最終的面紗。
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <Button onPress={onStartQuiz} style={styles.button}>
            <Text style={styles.buttonText}>開始挑戰</Text>
          </Button>
          <Button onPress={onClose} style={styles.buttonSecondary}>
            <Text style={styles.buttonTextSecondary}>稍後再說</Text>
          </Button>
        </View>
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, zIndex: 2000, justifyContent: 'center', alignItems: 'center' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.8)' },
  content: { width: '85%', alignItems: 'center', padding: 24, backgroundColor: colors.card, borderRadius: 32 },
  avatarContainer: { width: 140, height: 140, borderRadius: 56, borderWidth: 4, overflow: 'hidden', marginBottom: 24 },
  avatarImage: { width: '100%', height: '100%' },
  overlay: { ...StyleSheet.absoluteFillObject },
  lockedStateContent: { alignItems: 'center', gap: 8 },
  textContainer: { alignItems: 'center', marginBottom: 32 },
  title: { fontSize: 24, fontWeight: 'bold', color: colors.text, marginBottom: 12 },
  subtitle: { fontSize: 16, color: colors.textSecondary, textAlign: 'center', lineHeight: 24 },
  actions: { width: '100%', gap: 12 },
  button: { width: '100%', paddingVertical: 16, paddingHorizontal: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary + '20', borderColor: colors.primary, borderWidth: 1 },
  buttonText: { fontSize: 16, fontWeight: 'bold', color: colors.primary },
  buttonSecondary: { width: '100%', paddingVertical: 16, paddingHorizontal: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.textSecondary + '20', borderColor: colors.textSecondary + '40', borderWidth: 1 },
  buttonTextSecondary: { fontSize: 16, color: colors.textSecondary },
});

export default QuizUnlock;