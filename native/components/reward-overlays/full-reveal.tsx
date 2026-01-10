import { View, StyleSheet, Animated, Text, Dimensions } from 'react-native'
import React, { useEffect, useRef, useState, useCallback } from 'react'
import { Image } from 'expo-image'
import * as Haptics from 'expo-haptics'
import { colors } from '@/lib/colors'
import LogoIcon from '@/svgs/logo' // Your ghost icon
import Button from '@/components/ui/button'
import type { User } from '@/lib/types'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

interface FullRevealProps {
  visible: boolean;
  onClose: () => void;
  otherUser: User | null;
}

const FullReveal = ({ visible, onClose, otherUser }: FullRevealProps) => {
  // Animation Values
  const containerOpacity = useRef(new Animated.Value(0)).current;
  const ghostOpacity = useRef(new Animated.Value(1)).current;
  const photoScale = useRef(new Animated.Value(0.5)).current;
  const flashOpacity = useRef(new Animated.Value(0)).current;
  
  const [shouldRender, setShouldRender] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const hasTriggeredReveal = useRef(false);
  
  // Ghost position states
  const [overlayDimensions, setOverlayDimensions] = useState<{ width: number; height: number } | null>(null);
  const [overlaySize, setOverlaySize] = useState<number | null>(null);
  const [ghostPosition, setGhostPosition] = useState<{ x: number; y: number } | null>(null);

  const otherUserAvatarUrl = otherUser?.personal_info?.avatar_url;
  // Use their theme color for the background burst
  const themeColor = otherUser?.personal_info?.color as string || colors.primary;
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

  const triggerReveal = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    // Sequence: Flash -> Unblur -> Remove Ghost -> Scale Up
    Animated.sequence([
      // 1. The Flash (Bright white light)
      Animated.timing(flashOpacity, { toValue: 1, duration: 100, useNativeDriver: true }),
      Animated.parallel([
         // 2. Flash fades out
         Animated.timing(flashOpacity, { toValue: 0, duration: 800, useNativeDriver: true }),
         // 3. Ghost fades away
         Animated.timing(ghostOpacity, { toValue: 0, duration: 800, useNativeDriver: true }),
         // 4. Photo scales to full size
         Animated.spring(photoScale, { toValue: 1, friction: 5, useNativeDriver: true })
      ])
    ]).start(() => {
      setIsRevealed(true);
    });
  }, [flashOpacity, ghostOpacity, photoScale]);

  useEffect(() => {
    if (visible && !hasTriggeredReveal.current) {
      setShouldRender(true);
      setIsRevealed(false);
      hasTriggeredReveal.current = true;
      
      // Reset animation values
      flashOpacity.setValue(0);
      ghostOpacity.setValue(1);
      photoScale.setValue(0.5);

      // Phase 1: Enter (Blurred & Ghosted)
      Animated.parallel([
        Animated.timing(containerOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(photoScale, { toValue: 0.9, friction: 7, useNativeDriver: true })
      ]).start(() => {
        
        // Phase 2: Wait a beat, then THE REVEAL
        setTimeout(() => {
          triggerReveal();
        }, 800);
      });

    } else if (!visible && shouldRender) {
       Animated.timing(containerOpacity, { toValue: 0, duration: 300, useNativeDriver: true })
        .start(() => {
          setShouldRender(false);
          hasTriggeredReveal.current = false;
        });
    }
  }, [visible, shouldRender, containerOpacity, photoScale, triggerReveal, flashOpacity, ghostOpacity]);

  if (!shouldRender) return null;

  return (
    <Animated.View style={[styles.container, { opacity: containerOpacity }]}>
      {/* Background with Theme Color Tint */}
      <View style={[styles.backdrop, { backgroundColor: colors.background }]} />
      
      {/* Radiant Background Light (Behind Photo) */}
      <Animated.View style={[
        styles.radiantLight, 
        { 
          backgroundColor: themeColor,
          opacity: isRevealed ? 0.2 : 0,
          transform: [{ scale: isRevealed ? 1.5 : 0.5 }]
        } 
      ]} />

      {/* The Main Event */}
      <View style={styles.photoWrapper}>
        <Animated.View style={{ transform: [{ scale: photoScale }] }}>
           {/* The Photo */}
           <View style={[styles.cardFrame, { borderColor: themeColor }]}>
             <Image 
                source={{ uri: otherUserAvatarUrl }} 
                style={styles.fullImage}
                // Note: React Native Image blurRadius isn't easily animated directly without re-renders. 
                // We simulate unblur by overlaying a sharp image over a blurred one or just using the flash to hide the transition.
                // For MVP, simply removing the Ghost Overlay + The Flash is usually enough "Reveal" feeling.
             />
             
             {/* The Ghost Mask (Fades Out) */}
             <Animated.View 
               style={[styles.ghostMask, { opacity: ghostOpacity }]}
               onLayout={(e) => {
                 const { width, height } = e.nativeEvent.layout;
                 setOverlayDimensions({ width, height });
               }}
             >
               {/* Blurred Backdrop within mask */}
               <View style={styles.blurFiller} />
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
             </Animated.View>
           </View>
        </Animated.View>
      </View>

      {/* The "Flash" Overlay */}
      <Animated.View style={[styles.flashOverlay, { opacity: flashOpacity }]} />

      {/* Text Reveal (Only after photo is clear) */}
      {isRevealed && (
        <Animated.View 
          style={styles.textContainer}
        >
          <Text style={styles.nameText}>{otherUser?.personal_info?.real_name}</Text>
          <Text style={styles.subText}>終於見面了！</Text>
          <Text style={styles.subText}>現在，不用隔著面具說話了！</Text>
          <View style={styles.buttonContainer}>
            <Button onPress={onClose} style={styles.button}>
              <Text style={styles.buttonText}>回聊天室</Text>
            </Button>
          </View>
        </Animated.View>
      )}

    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, zIndex: 3000, justifyContent: 'center', alignItems: 'center' },
  backdrop: { ...StyleSheet.absoluteFillObject },
  flashOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'white', zIndex: 3001 },
  
  photoWrapper: { marginBottom: 200, alignItems: 'center', justifyContent: 'center' },
  cardFrame: { 
    width: SCREEN_WIDTH * 0.8, 
    height: SCREEN_WIDTH * 0.8, // Square or Aspect Ratio
    borderRadius: 88, 
    borderWidth: 2, 
    overflow: 'hidden',
    backgroundColor: colors.card,
    shadowColor: "#000", shadowOffset: {width: 0, height: 10}, shadowOpacity: 0.3, shadowRadius: 20, elevation: 15
  },
  fullImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  
  ghostMask: { 
    ...StyleSheet.absoluteFillObject, 
    zIndex: 10 
  },
  blurFiller: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background + '80', // High opacity to hide photo initially
    backdropFilter: 'blur(20px)', // Works on some platforms, otherwise opacity handles it
  },
  lockedStateContent: { alignItems: 'center', gap: 8 },
  
  radiantLight: {
    position: 'absolute',
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH,
    borderRadius: SCREEN_WIDTH / 2,
    zIndex: -1,
  },

  textContainer: { alignItems: 'center', position: 'absolute', bottom: 120, width: '100%' },
  nameText: { fontSize: 32, fontWeight: 'bold', color: colors.text, marginBottom: 8 },
  subText: { fontSize: 18, lineHeight: 26, color: colors.textSecondary },
  buttonContainer: { width: '100%', paddingHorizontal: 40, marginTop: 24 },
  button: { width: '100%', paddingVertical: 16, paddingHorizontal: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary + '20', borderColor: colors.primary, borderWidth: 1 },
  buttonText: { fontSize: 16, fontWeight: 'bold', color: colors.primary },
});

export default FullReveal;