import { View, StyleSheet, Animated, Text, Dimensions, Easing } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import * as Haptics from 'expo-haptics'
import { colors } from '@/lib/colors'
import Button from '@/components/ui/button'
import XrayGhostIcon from '@/svgs/xray-ghost'

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')

interface VipUnlockProps {
  visible: boolean;
  onClose: () => void;
}

const VipUnlock = ({ visible, onClose }: VipUnlockProps) => {
  // Animation Values
  const containerOpacity = useRef(new Animated.Value(0)).current;
  const scanLineY = useRef(new Animated.Value(0)).current;
  const iconScale = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const gridOpacity = useRef(new Animated.Value(0)).current;
  
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (visible) {
      setShouldRender(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Sequence:
      // 1. Grid/HUD Boot up
      // 2. Scan Line sweeps down
      // 3. Ghost Icon "Pops" in during scan
      // 4. Text types in
      
      Animated.sequence([
        Animated.parallel([
          Animated.timing(containerOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
          Animated.timing(gridOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        ]),

        Animated.parallel([
          // Icon Spring
          Animated.spring(iconScale, { 
            toValue: 1, 
            friction: 6, 
            tension: 80, 
            useNativeDriver: true 
          }),
          // Scan Line Sweep
          Animated.timing(scanLineY, { 
            toValue: 1, 
            duration: 1200, 
            easing: Easing.bezier(0.2, 1, 0.2, 1), 
            useNativeDriver: true 
          }),
        ]),

        Animated.timing(textOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]).start();

    } else if (shouldRender) {
      Animated.timing(containerOpacity, { toValue: 0, duration: 300, useNativeDriver: true })
        .start(() => setShouldRender(false));
    }
  }, [visible]);

  if (!shouldRender) return null;

  // Interpolation for the blue laser scanner
  const scanLineTranslateY = scanLineY.interpolate({
    inputRange: [0, 1],
    outputRange: [-SCREEN_HEIGHT * 0.4, SCREEN_HEIGHT * 0.8]
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.backdrop, { opacity: containerOpacity }]} />

      {/* Decorative HUD Grid */}
      <Animated.View style={[styles.gridContainer, { opacity: gridOpacity }]}>
        <View style={[styles.gridBorder, { borderColor: colors.primary }]} />
        <View style={styles.cornerTL} />
        <View style={styles.cornerTR} />
        <View style={styles.cornerBL} />
        <View style={styles.cornerBR} />
      </Animated.View>

      <View style={styles.content}>
        {/* The Main Event: X-Ray Ghost */}
        <Animated.View style={[styles.iconContainer, { transform: [{ scale: iconScale }] }]}>
          <View style={styles.iconGlow} />
          <XrayGhostIcon size={140} color={colors.primary} />
        </Animated.View>

        {/* Text Info */}
        <Animated.View style={[styles.textContainer, { opacity: textOpacity }]}>
          <Text style={styles.title}>X 光功能已解鎖</Text>
          <Text style={styles.subtitle}>
            使用 X 光功能查看{'\n'}
            對方的性別和年齡
          </Text>
          
          <View style={styles.statRow}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>每日可用次數</Text>
              <Text style={styles.statValue}>1</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>掃描範圍</Text>
              <Text style={styles.statValue}>性別 / 年齡</Text>
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <Button onPress={onClose} containerStyle={{ width: '100%' }} style={styles.button}>
              <Text style={styles.buttonText}>啟動系統</Text>
            </Button>
          </View>
        </Animated.View>
      </View>

      {/* The Moving Scan Line (Overlays everything) */}
      <Animated.View 
        style={[
          styles.scanLine, 
          { transform: [{ translateY: scanLineTranslateY }] }
        ]} 
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, zIndex: 3000, justifyContent: 'center', alignItems: 'center' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(5, 5, 10, 0.95)' }, // Very dark blue/black
  
  content: {
    width: '100%',
    alignItems: 'center',
    zIndex: 2,
  },

  // HUD / Grid Styling
  gridContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridBorder: {
    width: SCREEN_WIDTH - 40,
    height: SCREEN_HEIGHT - 120,
    borderWidth: 1,
    opacity: 0.2,
    borderRadius: 20,
  },
  // Corner Brackets for Tech Look
  cornerTL: { position: 'absolute', top: 60, left: 20, width: 40, height: 40, borderTopWidth: 4, borderLeftWidth: 4, borderColor: colors.primary, borderTopLeftRadius: 20 },
  cornerTR: { position: 'absolute', top: 60, right: 20, width: 40, height: 40, borderTopWidth: 4, borderRightWidth: 4, borderColor: colors.primary, borderTopRightRadius: 20 },
  cornerBL: { position: 'absolute', bottom: 60, left: 20, width: 40, height: 40, borderBottomWidth: 4, borderLeftWidth: 4, borderColor: colors.primary, borderBottomLeftRadius: 20 },
  cornerBR: { position: 'absolute', bottom: 60, right: 20, width: 40, height: 40, borderBottomWidth: 4, borderRightWidth: 4, borderColor: colors.primary, borderBottomRightRadius: 20 },

  // Icon
  iconContainer: {
    marginBottom: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconGlow: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 75,
    backgroundColor: colors.primary,
    opacity: 0.1,
    zIndex: -1,
    transform: [{ scale: 1.5 }],
  },

  // Text
  textContainer: {
    width: '80%',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.primary,
    marginBottom: 12,
    letterSpacing: 2,
    textTransform: 'uppercase',
    textShadowColor: colors.primary,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
    opacity: 0.8,
  },

  // Stats Box
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
    backgroundColor: colors.primary + '10',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  statBox: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.primary + '30',
    marginHorizontal: 20,
  },

  // Button
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  button: {
    width: '100%',
    paddingVertical: 16,
    backgroundColor: colors.primary + '20',
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
    letterSpacing: 1,
  },

  // The Laser Scan Line
  scanLine: {
    position: 'absolute',
    width: '100%',
    height: 2,
    backgroundColor: '#fff', // White core
    shadowColor: colors.primary,
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 10,
    zIndex: 10,
    opacity: 0.8,
  },
});

export default VipUnlock;