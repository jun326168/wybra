import { View, StyleSheet, Animated, Text, Image } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import { colors } from '@/lib/colors'
import ChatTips from './chat-tips'
import LogoIcon from '@/svgs/logo'
import type { User } from '@/lib/types'

interface MidRewardProps {
  visible: boolean;
  onClose: () => void;
  user: User | null;
  otherUser: User | null;
}

const MidReward = ({ visible, onClose, user, otherUser }: MidRewardProps) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const userAvatarScale = useRef(new Animated.Value(0)).current;
  const otherUserAvatarScale = useRef(new Animated.Value(0)).current;
  const [shouldRender, setShouldRender] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const [containerHeight, setContainerHeight] = useState(0);
  
  // User ghost position state
  const [userOverlayDimensions, setUserOverlayDimensions] = useState<{ width: number; height: number } | null>(null);
  const [userOverlaySize, setUserOverlaySize] = useState<number | null>(null);
  const [userGhostPosition, setUserGhostPosition] = useState<{ x: number; y: number } | null>(null);
  
  // Other user ghost position state
  const [otherUserOverlayDimensions, setOtherUserOverlayDimensions] = useState<{ width: number; height: number } | null>(null);
  const [otherUserOverlaySize, setOtherUserOverlaySize] = useState<number | null>(null);
  const [otherUserGhostPosition, setOtherUserGhostPosition] = useState<{ x: number; y: number } | null>(null);
  
  const userAvatarUrl = user?.personal_info?.avatar_url as string | undefined;
  const otherUserAvatarUrl = otherUser?.personal_info?.avatar_url as string | undefined;
  const userLogoStrokeColor = user?.personal_info?.color === colors.background ? colors.textSecondary : (user?.personal_info?.color as string | undefined);
  const otherUserLogoStrokeColor = otherUser?.personal_info?.color === colors.background ? colors.textSecondary : (otherUser?.personal_info?.color as string | undefined);
  
  const userAvatarTop = 100;
  const otherUserAvatarTop = 200;

  // Update user ghost position when dimensions or user data changes
  useEffect(() => {
    if (userOverlayDimensions && user?.personal_info?.ghost_pos) {
      const { width, height } = userOverlayDimensions;
      const savedGhostPos = user.personal_info.ghost_pos as { x: number; y: number; size: number };
      const containerSize = Math.min(width, height);
      
      // Convert percentages to pixels
      const size = (savedGhostPos.size / 100) * containerSize;
      const x = (savedGhostPos.x / 100) * width;
      const y = (savedGhostPos.y / 100) * height;
      
      setUserOverlaySize(Math.max(20, size));
      setUserGhostPosition({ x, y });
    } else if (userOverlayDimensions && !user?.personal_info?.ghost_pos) {
      // Default: center, 50% size
      const { width, height } = userOverlayDimensions;
      const containerSize = Math.min(width, height);
      const size = containerSize * 0.5;
      setUserOverlaySize(size);
      setUserGhostPosition({ x: (width - size) / 2, y: (height - size) / 2 });
    }
  }, [user?.personal_info?.ghost_pos, userOverlayDimensions]);

  // Update other user ghost position when dimensions or other user data changes
  useEffect(() => {
    if (otherUserOverlayDimensions && otherUser?.personal_info?.ghost_pos) {
      const { width, height } = otherUserOverlayDimensions;
      const savedGhostPos = otherUser.personal_info.ghost_pos as { x: number; y: number; size: number };
      const containerSize = Math.min(width, height);
      
      // Convert percentages to pixels
      const size = (savedGhostPos.size / 100) * containerSize;
      const x = (savedGhostPos.x / 100) * width;
      const y = (savedGhostPos.y / 100) * height;
      
      setOtherUserOverlaySize(Math.max(20, size));
      setOtherUserGhostPosition({ x, y });
    } else if (otherUserOverlayDimensions && !otherUser?.personal_info?.ghost_pos) {
      // Default: center, 50% size
      const { width, height } = otherUserOverlayDimensions;
      const containerSize = Math.min(width, height);
      const size = containerSize * 0.5;
      setOtherUserOverlaySize(size);
      setOtherUserGhostPosition({ x: (width - size) / 2, y: (height - size) / 2 });
    }
  }, [otherUser?.personal_info?.ghost_pos, otherUserOverlayDimensions]);

  useEffect(() => {
    if (visible) {
      setShouldRender(true);
      setShowTips(true);
      // Reset scale animations
      userAvatarScale.setValue(0);
      otherUserAvatarScale.setValue(0);
      
      // Start fade-in animation
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start(() => {
        // After fade-in completes, animate user's avatar with bounce
        Animated.spring(userAvatarScale, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }).start(() => {
          // After user's animation completes, animate other user's avatar with bounce
          Animated.spring(otherUserAvatarScale, {
            toValue: 1,
            tension: 50,
            friction: 7,
            useNativeDriver: true,
          }).start();
        });
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
  }, [visible, fadeAnim, shouldRender, userAvatarScale, otherUserAvatarScale]);

  const handleTipPress = () => {
    setShowTips(false);
    onClose();
  };

  if (!shouldRender) {
    return null;
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View 
        style={styles.content}
        onLayout={(e) => {
          const { height } = e.nativeEvent.layout;
          setContainerHeight(height);
        }}
      >
        {/* User's avatar - top 25%, right 30px, rotate 5deg */}
        {userAvatarUrl && containerHeight > 0 && (
          <Animated.View style={[styles.avatarContainer, { 
            top: userAvatarTop, 
            right: 40, 
            transform: [
              { rotate: '5deg' },
              { scale: userAvatarScale }
            ] 
          }]}>
            <Image
              source={{ uri: userAvatarUrl }}
              style={styles.avatarImage}
            />
            <View 
              style={styles.ghostOverlay}
              onLayout={(e) => {
                const { width, height } = e.nativeEvent.layout;
                setUserOverlayDimensions({ width, height });
              }}
            >
              <View 
                style={StyleSheet.flatten([
                  styles.lockedStateContent,
                  userGhostPosition && userOverlaySize ? {
                    position: 'absolute',
                    left: userGhostPosition.x,
                    top: userGhostPosition.y,
                    width: userOverlaySize,
                    height: userOverlaySize,
                  } : {},
                ])}
              >
                <LogoIcon
                  size={userOverlaySize || 60}
                  floatingY={0}
                  stroke={userLogoStrokeColor || colors.textSecondary}
                />
              </View>
            </View>
          </Animated.View>
        )}
        
        {/* Other user's avatar - top 50%, left 30px, rotate -5deg */}
        {otherUserAvatarUrl && containerHeight > 0 && (
          <Animated.View style={[styles.avatarContainer, { 
            top: otherUserAvatarTop, 
            left: 40, 
            transform: [
              { rotate: '-5deg' },
              { scale: otherUserAvatarScale }
            ] 
          }]}>
            <Image
              source={{ uri: otherUserAvatarUrl }}
              style={styles.avatarImage}
            />
            <View 
              style={styles.ghostOverlay}
              onLayout={(e) => {
                const { width, height } = e.nativeEvent.layout;
                setOtherUserOverlayDimensions({ width, height });
              }}
            >
              <View 
                style={StyleSheet.flatten([
                  styles.lockedStateContent,
                  otherUserGhostPosition && otherUserOverlaySize ? {
                    position: 'absolute',
                    left: otherUserGhostPosition.x,
                    top: otherUserGhostPosition.y,
                    width: otherUserOverlaySize,
                    height: otherUserOverlaySize,
                  } : {},
                ])}
              >
                <LogoIcon
                  size={otherUserOverlaySize || 60}
                  floatingY={0}
                  stroke={otherUserLogoStrokeColor || colors.textSecondary}
                />
              </View>
            </View>
          </Animated.View>
        )}
        
        <ChatTips visible={showTips} onPress={handleTipPress}>
          <Text style={styles.midRewardText}>迷霧散去了，但小幽靈還黏得緊緊的...繼續聊下去，解鎖對方的真面目！</Text>
        </ChatTips>
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  
  content: {
    flex: 1,
    backgroundColor: colors.background,
  },
  avatarContainer: {
    width: 180,
    height: 180,
    borderRadius: 72,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'visible',
    position: 'absolute',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    borderRadius: 72,
  },
  ghostOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background + '40',
    borderRadius: 72,
    zIndex: 10,
  },
  lockedStateContent: {
    alignItems: 'center',
    gap: 8,
  },
  midRewardText: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 20,
  },
});

export default MidReward;
