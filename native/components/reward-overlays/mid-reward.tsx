import { View, StyleSheet, Animated, Text, Dimensions, Easing } from 'react-native'
import { Image } from 'expo-image'
import React, { useEffect, useRef, useState } from 'react'
import { colors } from '@/lib/colors'
import ChatTips from '../ui/chat-tips'
import LogoIcon, { LogoPersonality } from '@/svgs/logo'
import type { User } from '@/lib/types'
import * as Haptics from 'expo-haptics' // Assuming you have expo-haptics installed

interface MidRewardProps {
  visible: boolean;
  onClose: () => void;
  user: User | null;
  otherUser: User | null;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// 1. Simple Sparkle Component
const Sparkle = ({ delay, style }: { delay: number, style: any }) => {
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(scale, { toValue: 1, duration: 500, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(scale, { toValue: 0, duration: 500, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0, duration: 500, useNativeDriver: true }),
        ])
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={[styles.sparkle, style, { opacity, transform: [{ scale }] }]}>
      {/* Simple Cross Shape or Star */}
      <View style={styles.sparkleVertical} />
      <View style={styles.sparkleHorizontal} />
    </Animated.View>
  );
};

const MidReward = ({ visible, onClose, user, otherUser }: MidRewardProps) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const userAvatarScale = useRef(new Animated.Value(0)).current;
  const otherUserAvatarScale = useRef(new Animated.Value(0)).current;
  
  // 2. New Animations: Floating and Pulse
  const floatAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;

  const [shouldRender, setShouldRender] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const [containerHeight, setContainerHeight] = useState(0);
  
  // Ghost position states (Keep existing logic)
  const [userOverlayDimensions, setUserOverlayDimensions] = useState<{ width: number; height: number } | null>(null);
  const [userOverlaySize, setUserOverlaySize] = useState<number | null>(null);
  const [userGhostPosition, setUserGhostPosition] = useState<{ x: number; y: number } | null>(null);
  
  const [otherUserOverlayDimensions, setOtherUserOverlayDimensions] = useState<{ width: number; height: number } | null>(null);
  const [otherUserOverlaySize, setOtherUserOverlaySize] = useState<number | null>(null);
  const [otherUserGhostPosition, setOtherUserGhostPosition] = useState<{ x: number; y: number } | null>(null);
  
  const userAvatarUrl = user?.personal_info?.avatar_url;
  const otherUserAvatarUrl = otherUser?.personal_info?.avatar_url;
  const userLogoStrokeColor = user?.personal_info?.color === colors.background ? colors.textSecondary : (user?.personal_info?.color as string);
  const otherUserLogoStrokeColor = otherUser?.personal_info?.color === colors.background ? colors.textSecondary : (otherUser?.personal_info?.color as string);
  const userPersonality = (user?.personal_info?.personality as LogoPersonality) || 'headphone';
  const otherUserPersonality = (otherUser?.personal_info?.personality as LogoPersonality) || 'headphone';
  
  const userAvatarTop = 100;
  const otherUserAvatarTop = 240; // Increased spacing slightly for visuals

  // --- Existing Logic for Ghost Position Calculation ---
  useEffect(() => {
    if (userOverlayDimensions && user?.personal_info?.ghost_pos) {
      const { width, height } = userOverlayDimensions;
      const savedGhostPos = user.personal_info.ghost_pos as { x: number; y: number; size: number };
      const containerSize = Math.min(width, height);
      const size = (savedGhostPos.size / 100) * containerSize;
      const x = (savedGhostPos.x / 100) * width;
      const y = (savedGhostPos.y / 100) * height;
      setUserOverlaySize(Math.max(20, size));
      setUserGhostPosition({ x, y });
    } else if (userOverlayDimensions) {
      const { width, height } = userOverlayDimensions;
      const size = Math.min(width, height) * 0.5;
      setUserOverlaySize(size);
      setUserGhostPosition({ x: (width - size) / 2, y: (height - size) / 2 });
    }
  }, [user?.personal_info?.ghost_pos, userOverlayDimensions]);

  useEffect(() => {
    if (otherUserOverlayDimensions && otherUser?.personal_info?.ghost_pos) {
      const { width, height } = otherUserOverlayDimensions;
      const savedGhostPos = otherUser.personal_info.ghost_pos as { x: number; y: number; size: number };
      const containerSize = Math.min(width, height);
      const size = (savedGhostPos.size / 100) * containerSize;
      const x = (savedGhostPos.x / 100) * width;
      const y = (savedGhostPos.y / 100) * height;
      setOtherUserOverlaySize(Math.max(20, size));
      setOtherUserGhostPosition({ x, y });
    } else if (otherUserOverlayDimensions) {
      const { width, height } = otherUserOverlayDimensions;
      const size = Math.min(width, height) * 0.5;
      setOtherUserOverlaySize(size);
      setOtherUserGhostPosition({ x: (width - size) / 2, y: (height - size) / 2 });
    }
  }, [otherUser?.personal_info?.ghost_pos, otherUserOverlayDimensions]);
  // ----------------------------------------------------


  useEffect(() => {
    if (visible) {
      setShouldRender(true);
      setShowTips(true);
      userAvatarScale.setValue(0);
      otherUserAvatarScale.setValue(0);
      
      // Haptics for engagement
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Start the "Living" animations (Float & Pulse)
      Animated.loop(
        Animated.sequence([
          Animated.timing(floatAnim, { toValue: 10, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(floatAnim, { toValue: 0, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: true })
        ])
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.5, duration: 2000, easing: Easing.out(Easing.ease), useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 0, useNativeDriver: true }) // Reset instantly
        ])
      ).start();

      // Entry Animation
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start(() => {
        Animated.stagger(200, [ // Slight delay between avatars for rhythm
          Animated.spring(userAvatarScale, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
          Animated.spring(otherUserAvatarScale, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true })
        ]).start();
      });

    } else if (shouldRender) {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setShouldRender(false);
        setShowTips(false);
      });
    }
  }, [visible]);

  const handleTipPress = () => {
    setShowTips(false);
    onClose();
  };

  if (!shouldRender) return null;

  // 3. Interpolations for Animations
  const pulseOpacity = pulseAnim.interpolate({
    inputRange: [1, 1.5],
    outputRange: [0.2, 0] // Fade out as it expands
  });

  // Float: User moves Up, Other moves Down (creates a nice syncopated motion)
  const userTranslateY = floatAnim; 
  const otherTranslateY = floatAnim.interpolate({ inputRange: [0, 10], outputRange: [0, -10] });


  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View 
        style={styles.content}
        onLayout={(e) => setContainerHeight(e.nativeEvent.layout.height)}
      >
        {/* --- Background Effects --- */}
        {/* Pulse Ring for User */}
        <Animated.View style={[styles.pulseRing, { 
          top: userAvatarTop, right: 40, 
          opacity: pulseOpacity, transform: [{ scale: pulseAnim }] 
        }]} />
        
        {/* Pulse Ring for Other User */}
        <Animated.View style={[styles.pulseRing, { 
          top: otherUserAvatarTop, left: 40, 
          opacity: pulseOpacity, transform: [{ scale: pulseAnim }] 
        }]} />

        {/* --- Avatars --- */}
        
        {/* User's Avatar */}
        {userAvatarUrl && containerHeight > 0 && (
          <Animated.View style={[styles.avatarContainer, { 
            top: userAvatarTop, 
            right: 40, 
            transform: [
              { rotate: '5deg' },
              { scale: userAvatarScale },
              { translateY: userTranslateY } // Adds the floating
            ] 
          }]}>
             {/* Sparkles Decoration */}
             <Sparkle delay={0} style={{ position: 'absolute', top: -20, right: -10 }} />
             <Sparkle delay={500} style={{ position: 'absolute', bottom: 10, left: -20 }} />

            <Image source={{ uri: userAvatarUrl }} style={styles.avatarImage} />
            <View 
              style={styles.ghostOverlay}
              onLayout={(e) => setUserOverlayDimensions({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })}
            >
              {userGhostPosition && userOverlaySize && (
                <View style={[styles.lockedStateContent, { position: 'absolute', left: userGhostPosition.x, top: userGhostPosition.y, width: userOverlaySize, height: userOverlaySize }]}>
                  <LogoIcon size={userOverlaySize} floatingY={0} stroke={userLogoStrokeColor || colors.textSecondary} personality={userPersonality} />
                </View>
              )}
            </View>
          </Animated.View>
        )}
        
        {/* Other User's Avatar */}
        {otherUserAvatarUrl && containerHeight > 0 && (
          <Animated.View style={[styles.avatarContainer, { 
            top: otherUserAvatarTop, 
            left: 40, 
            transform: [
              { rotate: '-5deg' },
              { scale: otherUserAvatarScale },
              { translateY: otherTranslateY } // Adds the floating
            ] 
          }]}>
             {/* Sparkles Decoration */}
             <Sparkle delay={200} style={{ position: 'absolute', top: 10, left: -15 }} />
             <Sparkle delay={700} style={{ position: 'absolute', bottom: -10, right: -10 }} />

            <Image source={{ uri: otherUserAvatarUrl }} style={styles.avatarImage} />
            <View 
              style={styles.ghostOverlay}
              onLayout={(e) => setOtherUserOverlayDimensions({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })}
            >
              {otherUserGhostPosition && otherUserOverlaySize && (
                <View style={[styles.lockedStateContent, { position: 'absolute', left: otherUserGhostPosition.x, top: otherUserGhostPosition.y, width: otherUserOverlaySize, height: otherUserOverlaySize }]}>
                  <LogoIcon size={otherUserOverlaySize} floatingY={0} stroke={otherUserLogoStrokeColor || colors.textSecondary} personality={otherUserPersonality} />
                </View>
              )}
            </View>
          </Animated.View>
        )}
        
        <ChatTips visible={showTips} onPress={handleTipPress}>
          <Text style={styles.midRewardText}>
            迷霧散去了，但小幽靈還黏得緊緊的...繼續聊下去，解鎖對方的真面目！
          </Text>
        </ChatTips>
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000,
  },
  content: {
    flex: 1, backgroundColor: colors.background + 'EE', // Slightly translucent background for depth
  },
  avatarContainer: {
    width: 180, height: 180, borderRadius: 60, // Changed to slightly squared for card look (or keep 72/90 for circle)
    backgroundColor: colors.card,
    borderWidth: 4, borderColor: colors.primary, // Thicker border for "Rare Item" feel
    justifyContent: 'center', alignItems: 'center',
    overflow: 'hidden', position: 'absolute',
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10,
  },
  avatarImage: {
    width: '100%', height: '100%', resizeMode: 'cover', borderRadius: 24,
  },
  ghostOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background + '50', // Lighter overlay since we want to show "Unblur"
    borderRadius: 24, zIndex: 10,
  },
  lockedStateContent: { alignItems: 'center', gap: 8 },
  midRewardText: { fontSize: 16, color: colors.text, lineHeight: 24 },
  
  // New Styles
  pulseRing: {
    width: 180, height: 180, borderRadius: 60,
    position: 'absolute',
    borderWidth: 2, borderColor: colors.primary,
    backgroundColor: 'transparent',
    // zIndex: -1, // Behind avatar
  },
  sparkle: {
    width: 20, height: 20, justifyContent: 'center', alignItems: 'center', zIndex: 20,
  },
  sparkleVertical: {
    position: 'absolute', width: 4, height: '100%', backgroundColor: colors.primary, borderRadius: 2,
  },
  sparkleHorizontal: {
    position: 'absolute', width: '100%', height: 4, backgroundColor: colors.primary, borderRadius: 2,
  },
});

export default MidReward;