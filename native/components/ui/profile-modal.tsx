import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { colors } from '@/lib/colors';
import LogoIcon, { LogoPersonality } from '@/svgs/logo';
import BottomSheetModal from '@/components/ui/bottom-sheet-modal';
import { INTEREST_TAGS, MBTI_OPTIONS, PHOTO_BLUR_AMOUNT } from '@/lib/setup';
import type { User } from '@/lib/types';
import Button from '@/components/ui/button';
import XrayGhostIcon from '@/svgs/xray-ghost';
import { useAppContext } from '@/contexts/AppContext';
import { useXray as callXray } from '@/lib/api';
import LoadingSpinner from '@/svgs/spinner';

interface ProfileModalProps {
  visible: boolean;
  onClose: () => void;
  user: User | null;
  shouldShowImage?: boolean;
  currentUser?: User | null;
}

export default function ProfileModal({ visible, onClose, user, shouldShowImage = false, currentUser: propCurrentUser }: ProfileModalProps) {
  const { user: contextUser, refreshUser } = useAppContext();
  const currentUser = propCurrentUser || contextUser;
  const [overlaySize, setOverlaySize] = React.useState<number | null>(null);
  const [overlayDimensions, setOverlayDimensions] = React.useState<{ width: number; height: number } | null>(null);
  const [ghostPosition, setGhostPosition] = React.useState<{ x: number; y: number } | null>(null);
  const [isUsingXray, setIsUsingXray] = React.useState(false);

  const avatarUrl = user?.personal_info?.avatar_url as string | undefined;
  const logoStrokeColor = user?.personal_info?.color === colors.background ? colors.textSecondary : (user?.personal_info?.color as string | undefined);
  const showImage = shouldShowImage;
  const personality = (user?.personal_info?.personality as LogoPersonality) || 'headphone';

  const isVip = currentUser?.access?.is_vip || false;
  const hasXrayed = currentUser?.access?.xray_target === user?.id;
  const gender = user?.personal_info?.gender as string | undefined;
  const birthday = user?.personal_info?.birthday as string | undefined;
  
  // Calculate age from birthday
  const age = birthday ? (() => {
    const birthDate = new Date(birthday);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  })() : null;

  const handleXray = async () => {
    if (!user?.id || !isVip || hasXrayed || isUsingXray) return;

    try {
      setIsUsingXray(true);
      const result = await callXray(user.id);
      if (result.success) {
        await refreshUser();
      }
    } catch (error) {
      console.error('Error using X-ray:', error);
    } finally {
      setIsUsingXray(false);
    }
  };

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
          <Text style={styles.modalTitle}>
            {shouldShowImage 
              ? (user.personal_info?.real_name as string || user.username)
              : user.username}
          </Text>
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
                      style={styles.avatarImage}
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
                            personality={personality}
                          />
                        </View>
                      </View>
                    )}
                  </View>
                )}
              </View>
              <View style={styles.profileInfoContainer}>
                {/* X-ray Section */}
                {isVip && (
                  <View style={styles.xraySection}>
                    {hasXrayed ? (
                      <View style={styles.xrayInfoContainer}>
                        <Text style={styles.xrayInfoLabel}>性別</Text>
                        <Text style={styles.xrayInfoValue}>{gender === 'male' ? '男' : gender === 'female' ? '女' : '其他'}</Text>
                        {age !== null && (
                          <>
                            <Text style={styles.xrayInfoLabel}>年齡</Text>
                            <Text style={styles.xrayInfoValue}>{age} 歲</Text>
                          </>
                        )}
                      </View>
                    ) : (
                      <Button
                        onPress={handleXray}
                        disabled={isUsingXray || !currentUser?.access?.xray_charges || currentUser.access.xray_charges <= 0}
                        style={StyleSheet.flatten([
                          styles.xrayButton,
                          {
                            backgroundColor: colors.primary + '20',
                            borderColor: colors.primary,
                            opacity: (!currentUser?.access?.xray_charges || currentUser.access.xray_charges <= 0) ? 0.5 : 1,
                          }
                        ])}
                      >
                        {isUsingXray ? (
                          <LoadingSpinner size={14} color={colors.primary} strokeWidth={3} />
                        ) : (
                          <>
                            <XrayGhostIcon size={16} color={colors.primary} />
                            <Text style={[styles.xrayButtonText, { color: colors.primary }]}>
                              使用 X 光
                            </Text>
                          </>
                        )}
                      </Button>
                    )}
                  </View>
                )}
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
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background + '40',
    borderRadius: 48,
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
  xraySection: {
    marginBottom: 12,
  },
  xrayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  xrayButtonText: {
    fontSize: 13,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  xrayInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: colors.primary + '15',
    borderWidth: 1,
    borderColor: colors.primary + '40',
  },
  xrayInfoLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  xrayInfoValue: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: 'bold',
  },
});

