import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView } from 'react-native';
import { colors } from '@/lib/colors';
import LogoIcon from '@/svgs/logo';
import BottomSheetModal from '@/components/ui/bottom-sheet-modal';
import { INTEREST_TAGS, MBTI_OPTIONS, PHOTO_BLUR_AMOUNT } from '@/lib/setup';
import type { User } from '@/lib/types';

interface ProfileModalProps {
  visible: boolean;
  onClose: () => void;
  user: User | null;
}

export default function ProfileModal({ visible, onClose, user }: ProfileModalProps) {
  const [overlaySize, setOverlaySize] = React.useState<number | null>(null);
  const [overlayDimensions, setOverlayDimensions] = React.useState<{ width: number; height: number } | null>(null);
  const [ghostPosition, setGhostPosition] = React.useState<{ x: number; y: number } | null>(null);

  const avatarUrl = user?.personal_info?.avatar_url as string | undefined;
  const logoStrokeColor = user?.personal_info?.color === colors.background ? colors.textSecondary : (user?.personal_info?.color as string | undefined);
  const showImage = false;

  // Update ghost position when dimensions or user data changes
  React.useEffect(() => {
    if (overlayDimensions && user?.personal_info?.ghost_pos) {
      const { width, height } = overlayDimensions;
      const savedGhostPos = user.personal_info.ghost_pos as { x: number; y: number; size: number };
      const containerSize = Math.min(width, height);
      
      // Convert percentages to pixels
      const size = (savedGhostPos.size / 100) * containerSize;
      const x = (savedGhostPos.x / 100) * width;
      const y = (savedGhostPos.y / 100) * height;
      
      setOverlaySize(Math.max(20, size));
      setGhostPosition({ x, y });
    } else if (overlayDimensions && !user?.personal_info?.ghost_pos) {
      // Default: center, 50% size
      const { width, height } = overlayDimensions;
      const containerSize = Math.min(width, height);
      const size = containerSize * 0.5;
      setOverlaySize(size);
      setGhostPosition({ x: (width - size) / 2, y: (height - size) / 2 });
    }
  }, [user?.personal_info?.ghost_pos, overlayDimensions]);

  return (
    <BottomSheetModal
      visible={visible}
      onClose={onClose}
      containerStyle={styles.modalContainer}
    >
      {user ? (
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{user.username}</Text>
          <ScrollView
            showsVerticalScrollIndicator={false}
            style={styles.modalScrollView}
            contentContainerStyle={styles.modalScrollContent}
          >
            {/* Profile info */}
            <View style={styles.profileInfo}>
              <View style={styles.avatarHeader}>
                {avatarUrl && (
                  <View style={styles.avatarContainer}>
                    <Image
                      source={{ uri: avatarUrl }}
                      style={[
                        styles.avatarImage,
                        !showImage && styles.avatarImageBlurred
                      ]}
                      blurRadius={showImage ? 0 : PHOTO_BLUR_AMOUNT}
                    />
                    {!showImage && (
                      <View 
                        style={styles.blurOverlay}
                        onLayout={(e) => {
                          const { width, height } = e.nativeEvent.layout;
                          setOverlayDimensions({ width, height });
                        }}
                      >
                        <View 
                          style={[
                            styles.lockedStateContent,
                            ghostPosition && overlaySize ? {
                              position: 'absolute',
                              left: ghostPosition.x,
                              top: ghostPosition.y,
                              width: overlaySize,
                              height: overlaySize,
                            } : {},
                          ]}
                        >
                          <LogoIcon
                            size={overlaySize || 60}
                            floatingY={0}
                            stroke={logoStrokeColor}
                          />
                        </View>
                      </View>
                    )}
                  </View>
                )}
              </View>
              <View style={styles.profileInfoContainer}>
                <Text style={[styles.profileInfoTextMbti, { color: user.personal_info?.color === colors.background ? colors.primary : user.personal_info?.color }]}>
                  {user.personal_info?.mbti === 'UNKNOWN' ? 'MBTI: ' : ''}
                  {MBTI_OPTIONS.find(option => option.value === user.personal_info?.mbti)?.label}
                </Text>
                <Text style={styles.profileInfoTextInterests}>
                  {(user.personal_info?.interests as string[])?.map((i: string) =>
                    i.startsWith('#') ? i : INTEREST_TAGS.find(tag => tag.id === i)?.label
                  ).join(' ')}
                </Text>
                <Text style={styles.profileInfoTextIntroductionTitle}>真實的我</Text>
                {user.personal_info?.bio ? (
                  <Text style={styles.profileInfoTextIntroductionText}>
                    {user.personal_info.bio as string}
                  </Text>
                ) : (
                  <Text style={styles.profileInfoTextIntroductionTextEmpty}>
                    尚未填寫簡介
                  </Text>
                )}
                <Text style={styles.profileInfoTextIntroductionTitle}>關於我住的地方</Text>
                <Text style={styles.profileInfoTextIntroductionText}>
                  我最喜歡: {(user.personal_info?.custom_question as any)?.love as string || '尚未填寫'}
                </Text>
                <Text style={styles.profileInfoTextIntroductionText}>
                  我最討厭: {(user.personal_info?.custom_question as any)?.hate as string || '尚未填寫'}
                </Text>
              </View>
            </View>
          </ScrollView>
        </View>
      ) : null}
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  modalContent: {
    width: '100%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 24,
  },
  modalScrollView: {
  },
  modalScrollContent: {
    paddingBottom: 20,
  },
  profileInfo: {
    gap: 20,
    paddingBottom: 20,
  },
  avatarHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 48,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'visible',
    position: 'relative',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    borderRadius: 48,
  },
  avatarImageBlurred: {
    opacity: 0.6,
  },
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background + '40',
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  lockedStateContent: {
    alignItems: 'center',
    gap: 8,
  },
  profileInfoContainer: {
    alignItems: 'flex-start',
    gap: 8,
  },
  profileInfoTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  profileInfoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  profileInfoTextMbti: {
    fontWeight: 'bold',
    fontSize: 14,
    color: colors.textSecondary,
  },
  profileInfoTextInterests: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  profileInfoTextIntroductionTitle: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: 'bold',
    marginTop: 8,
  },
  profileInfoTextIntroductionText: {
    fontSize: 14,
    color: colors.text,
  },
  profileInfoTextIntroductionTextEmpty: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
});

