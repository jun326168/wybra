import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  View,
  Dimensions,
  type ViewStyle,
} from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const MAX_SHEET_HEIGHT = SCREEN_HEIGHT * 0.85;

interface BottomSheetModalProps {
  visible: boolean;
  onClose: () => void;
  children?: React.ReactNode;
  containerStyle?: ViewStyle;
  onCloseComplete?: () => void;
  overlayContent?: React.ReactNode;
}

export default function BottomSheetModal({
  visible,
  onClose,
  children,
  containerStyle,
  onCloseComplete,
  overlayContent,
}: BottomSheetModalProps) {
  const animation = useRef(new Animated.Value(visible ? 1 : 0)).current;
  const [renderModal, setRenderModal] = useState(visible);
  const [contentHeight, setContentHeight] = useState(0);
  const closeAnimationId = useRef(0);

  useEffect(() => {
    if (visible) {
      closeAnimationId.current += 1;
      setRenderModal(true);
      Animated.spring(animation, {
        toValue: 1,
        useNativeDriver: true,
        damping: 20,
        stiffness: 200,
      }).start();
    } else {
      if (!renderModal) {
        return;
      }
      const currentId = closeAnimationId.current + 1;
      closeAnimationId.current = currentId;
      Animated.timing(animation, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished && closeAnimationId.current === currentId) {
          setRenderModal(false);
          onCloseComplete?.();
        }
      });
    }
  }, [animation, visible, renderModal, onCloseComplete]);

  if (!renderModal) {
    return null;
  }

  const translateY = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [contentHeight ? contentHeight + 60 : 400, 0],
  });

  const backdropOpacity = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.4],
  });

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent>
      <View style={styles.overlay} pointerEvents="box-none">
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>
        <Animated.View
          style={[
            styles.sheet,
            containerStyle,
            {
              transform: [{ translateY }],
              maxHeight: MAX_SHEET_HEIGHT,
            },
          ]}
          onLayout={(event) => {
            setContentHeight(event.nativeEvent.layout.height);
          }}
        >
          {children}
        </Animated.View>
        {overlayContent}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    overflow: 'visible',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 32,
    paddingVertical: 24,
    paddingTop: 24,
    paddingBottom: 50,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'visible',
  },
});
