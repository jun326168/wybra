import { View, Text, StyleSheet, ScrollView, Linking, Keyboard, Platform } from 'react-native'
import { Image } from 'expo-image'
import React, { useState, useEffect, useRef } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors } from '@/lib/colors'
import { useAppContext } from '@/contexts/AppContext'
import LogoIcon, { LogoPersonality } from '@/svgs/logo'
import { EyeIcon, EyeSlashIcon } from '@/svgs'
import Button from '@/components/ui/button'
import { useRouter } from 'expo-router'
import BottomSheetModal from '@/components/ui/bottom-sheet-modal'
import { INTEREST_TAGS, MBTI_OPTIONS } from '@/lib/setup'
import XrayGhostIcon from '@/svgs/xray-ghost'
import { createInvite, getMyInvite, pairInvite } from '@/lib/api'
import Input from '@/components/ui/input'
import LoadingSpinner from '@/svgs/spinner'
import VipUnlock from '@/components/reward-overlays/vip-unlock'

const ProfileScreen = () => {
  const { user, refreshUser } = useAppContext();
  const router = useRouter();
  const [showImage, setShowImage] = useState(false);
  const [showVipUnlockModal, setShowVipUnlockModal] = useState(false);
  const [showVipUnlockOverlay, setShowVipUnlockOverlay] = useState(false);
  const [overlaySize, setOverlaySize] = useState<number | null>(null);
  const [overlayDimensions, setOverlayDimensions] = useState<{ width: number; height: number } | null>(null);
  const [ghostPosition, setGhostPosition] = useState<{ x: number; y: number } | null>(null);
  const [myInviteCode, setMyInviteCode] = useState<string | null>(null);
  const [pairCode, setPairCode] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPairing, setIsPairing] = useState(false);
  const [pairError, setPairError] = useState<string | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const hasLoadedInviteCode = useRef(false);

  const avatarUrl = user?.personal_info?.avatar_url as string | undefined;
  const logoStrokeColor = user?.personal_info?.color === colors.background ? colors.textSecondary : (user?.personal_info?.color as string | undefined);
  const personality = (user?.personal_info?.personality as LogoPersonality) || 'headphone';

  // Redirect to auth screen if user is signed out
  useEffect(() => {
    if (user === null) {
      router.replace('/');
    }
  }, [user, router]);

  // Update ghost position when user data changes
  useEffect(() => {
    if (overlayDimensions && user?.personal_info?.ghost_pos) {
      const { width, height } = overlayDimensions;
      const containerSize = Math.min(width, height);
      const savedGhostPos = user.personal_info.ghost_pos as { x: number; y: number; size: number };

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

  // Keyboard listeners
  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
      }
    );
    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  const handleEditProfile = () => {
    router.push('/profile-settings');
  };

  const handlePreferenceSettings = () => {
    router.push('/preference-settings');
  };

  const handleAccountSettings = () => {
    router.push('/account-settings');
  };

  const openLink = (url: string) => {
    Linking.openURL(url).catch(err => console.error("Couldn't load page", err));
  };

  // Load invite code only once when component mounts (if not VIP)
  useEffect(() => {
    if (user?.access?.is_vip) {
      // Reset flag if user becomes VIP (in case they lose VIP later)
      hasLoadedInviteCode.current = false;
      setMyInviteCode(null);
    } else if (!hasLoadedInviteCode.current && !!user) {
      hasLoadedInviteCode.current = true;
      loadMyInviteCode();
    }
  }, [user?.access?.is_vip]);

  const loadMyInviteCode = async () => {
    try {
      const invite = await getMyInvite();
      if (invite) {
        setMyInviteCode(invite.code);
      } else {
        setMyInviteCode(null);
      }
    } catch (error) {
      console.error('Error loading invite code:', error);
      setMyInviteCode(null);
    }
  };

  const handleGenerateInvite = async () => {
    try {
      setIsGenerating(true);
      setPairError(null);
      const invite = await createInvite();
      setMyInviteCode(invite.code);
    } catch (error: any) {
      console.error('Error generating invite:', error);
      setPairError(error.message || '無法產生邀請碼');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePairInvite = async () => {
    if (!pairCode.trim()) {
      setPairError('請輸入邀請碼');
      return;
    }

    try {
      setIsPairing(true);
      setPairError(null);
      const pairResult = await pairInvite(pairCode.trim().toUpperCase());
      const result: { success: boolean; message: string; type?: string } = pairResult;
      
      if (result.success) {
        // Refresh user data to get updated VIP status
        await refreshUser();
        setShowVipUnlockModal(false);
        setTimeout(() => {
          setShowVipUnlockOverlay(true);
        }, 800);
        setPairCode('');
      } else {
        if (result.type === 'NotOneMaleOneFemale') {
          setPairError('必須要是異性才能配對喔');
        } else {
          setPairError('找不到邀請碼');
        }
      }
    } catch (error: any) {
      console.error('Error pairing invite:', error);
      setPairError(error.message || '配對失敗');
    } finally {
      setIsPairing(false);
    }
  };

  const handleCloseVipModal = () => {
    setShowVipUnlockModal(false);
    setPairCode('');
    setPairError(null);
    // Don't reset myInviteCode - keep it cached
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
      >
        {/* profile info */}
        <View style={styles.profileInfo}>
          <View style={styles.avatarHeader}>
            {avatarUrl && (
              <Button
                onPress={() => setShowImage(!showImage)}
                style={styles.avatarContainer}
              >
                <Image
                  source={{ uri: avatarUrl }}
                  style={styles.avatarImage}
                />
                {!showImage && (
                  <View
                    style={styles.blurOverlay}
                    onLayout={(e) => {
                      const { width, height } = e.nativeEvent.layout;
                      setOverlayDimensions({ width, height });
                      // The useEffect will handle updating the ghost position based on user data
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
                      <LogoIcon size={overlaySize || 60} floatingY={0} stroke={logoStrokeColor} personality={personality} />
                    </View>
                  </View>
                )}
                {/* Eye icon indicator */}
                <View style={styles.eyeIconContainer}>
                  {showImage ? (
                    <EyeIcon size={18} color={colors.text} />
                  ) : (
                    <EyeSlashIcon size={18} color={colors.textSecondary} />
                  )}
                </View>
              </Button>
            )}
            <Button
              onPress={handleEditProfile}
              style={styles.editProfileButton}
            >
              <Text style={styles.editProfileButtonText}>編輯人設</Text>
            </Button>
          </View>
          <View style={styles.profileInfoContainer}>
            {user?.access?.is_vip ? (
              <View
                style={[styles.vipUnlockButton, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '40' }]}
              >
                <XrayGhostIcon size={14} color={colors.primary} />
                <Text style={[styles.vipUnlockButtonText, { color: colors.primary }]}>VIP</Text>
              </View>
            ) : (
              <Button
                onPress={() => setShowVipUnlockModal(true)}
                style={[styles.vipUnlockButton, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '40' }]}
              >
                <Text style={[styles.vipUnlockButtonText, { color: colors.primary }]}>解鎖 VIP</Text>
              </Button>
            )}
            <View style={styles.profileInfoTextContainer}>
              <Text style={styles.profileInfoText}>{user?.username}</Text>
            </View>
            <Text style={StyleSheet.flatten([styles.profileInfoTextMbti, { color: user?.personal_info?.color === colors.background ? colors.primary : user?.personal_info?.color }])}>{user?.personal_info?.mbti === 'UNKNOWN' ? 'MBTI: ' : ''}{MBTI_OPTIONS.find(option => option.value === user?.personal_info?.mbti)?.label}</Text>
            <Text style={styles.profileInfoTextInterests}>{(user?.personal_info?.interests as string[])?.map(i => i.startsWith('#') ? i : INTEREST_TAGS.find(tag => tag.id === i)?.label).join(' ')}</Text>
            <Text style={styles.profileInfoTextIntroductionTitle}>真實的我</Text>
            {user?.personal_info?.bio ? (
              <Text style={styles.profileInfoTextIntroductionText}>{user?.personal_info?.bio as string}</Text>
            ) : (
              <Button style={styles.editProfileButton} onPress={handleEditProfile}>
                <Text style={styles.editProfileButtonText}>新增簡介</Text>
              </Button>
            )}
            <Text style={styles.profileInfoTextIntroductionTitle}>關於我住的地方</Text>
            <Text style={styles.profileInfoTextIntroductionText}>我最喜歡: {(user?.personal_info?.custom_question as any)?.love as string}</Text>
            <Text style={styles.profileInfoTextIntroductionText}>我最討厭: {(user?.personal_info?.custom_question as any)?.hate as string}</Text>
          </View>
        </View>

        {/* divider */}
        {/* <View style={styles.divider} /> */}

        {/* Stats */}
        {/* <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{user?.personal_info?.friends_count as number || 0}</Text>
            <Text style={styles.statLabel}>已解鎖好友</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>1</Text>
            <Text style={styles.statLabel}>正在聊天</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>8d</Text>
            <Text style={styles.statLabel}>最久聊天記錄</Text>
          </View>
        </View> */}

        {/* divider */}
        <View style={styles.divider} />

        {/* Settings Section */}
        <View style={styles.settingsView}>
          <View>
            <Text style={styles.sectionTitle}>設定</Text>
            <Button style={styles.settingRow} onPress={handlePreferenceSettings}>
              <Text style={styles.settingLabel}>主題</Text>
              <Text style={styles.linkArrow}>→</Text>
            </Button>
            <Button style={styles.settingRow} onPress={handleAccountSettings}>
              <Text style={styles.settingLabel}>帳號</Text>
              <Text style={styles.linkArrow}>→</Text>
            </Button>
          </View>
        </View>

        <View style={styles.divider} />

        {/* About Section */}
        <View style={StyleSheet.flatten([styles.settingsView, { marginBottom: 100 }])}>
          <View>
            <Text style={styles.sectionTitle}>關於</Text>
            <Button style={styles.linkRow} onPress={() => openLink('https://wybra.vercel.app/privacy')}>
              <Text style={styles.linkLabel}>隱私權政策</Text>
              <Text style={styles.linkArrow}>→</Text>
            </Button>
            <Button style={styles.linkRow} onPress={() => router.push('/eula')}>
              <Text style={styles.linkLabel}>使用條款</Text>
              <Text style={styles.linkArrow}>→</Text>
            </Button>
          </View>
        </View>
      </ScrollView>

      {/* VIP Unlock Modal */}
      <BottomSheetModal
        visible={showVipUnlockModal}
        containerStyle={{
          ...styles.modalContainer,
          ...(keyboardHeight > 0 && { marginBottom: keyboardHeight - 28 })
        }}
        onClose={() => {
          Keyboard.dismiss();
          handleCloseVipModal();
        }}
      >
        <View style={styles.modalContent}>
          <View style={styles.vipModalContent}>
            <XrayGhostIcon size={48} color={colors.primary} />
            <Text style={styles.vipModalTitle}>解鎖 VIP</Text>
            <Text style={styles.vipModalDescription}>
              解鎖 VIP 後，你將獲得每日一次<Text style={styles.vipModalDescriptionHighlight}>幽靈感知</Text>功能的機會，查看對方的<Text style={styles.vipModalDescriptionHighlight}>性別</Text>和<Text style={styles.vipModalDescriptionHighlight}>年齡</Text>。
            </Text>
            <Text style={styles.vipModalSubDescription}>
              每日會自動補充一次使用次數
            </Text>

            {/* My Invite Code Section */}
            {myInviteCode ? (
              <View style={styles.vipModalInviteSection}>
                <Text style={styles.vipModalInviteLabel}>我的邀請碼</Text>
                <View style={[styles.vipModalInviteCodeContainer, { borderColor: colors.primary + '80' }]}>
                  <Text style={[styles.vipModalInviteCode, { color: colors.primary }]}>{myInviteCode}</Text>
                </View>
                <Text style={styles.vipModalInviteHint}>分享給異性朋友配對即可解鎖 VIP</Text>
              </View>
            ) : (
              <View style={styles.vipModalInviteSection}>
                <Button
                  onPress={handleGenerateInvite}
                  disabled={isGenerating}
                  style={StyleSheet.flatten([
                    styles.vipModalGenerateButton,
                    {
                      backgroundColor: colors.primary + '20',
                      borderColor: colors.primary,
                    }
                  ])}
                >
                  {isGenerating ? (
                    <LoadingSpinner size={20} color={colors.primary} strokeWidth={3} />
                  ) : (
                    <Text style={StyleSheet.flatten([styles.vipModalGenerateButtonText, { color: colors.primary }])}>
                      產生邀請碼
                    </Text>
                  )}
                </Button>
              </View>
            )}

            {/* Pair Invite Section */}
            <View style={styles.vipModalPairSection}>
              <Text style={styles.vipModalPairLabel}>或輸入他人的邀請碼</Text>
              <Input
                value={pairCode}
                onChangeText={(text) => {
                  setPairCode(text.toUpperCase());
                  setPairError(null);
                }}
                placeholder="輸入 6 位邀請碼"
                maxLength={6}
                style={StyleSheet.flatten([
                  styles.vipModalPairInput,
                  { borderColor: pairError ? colors.error + '80' : colors.border }
                ])}
              />
              {pairError && (
                <Text style={styles.vipModalErrorText}>{pairError}</Text>
              )}
              <Button
                onPress={handlePairInvite}
                disabled={isPairing || !pairCode.trim()}
                style={StyleSheet.flatten([
                  styles.vipModalPairButton,
                  {
                    backgroundColor: colors.primary + '20',
                    borderColor: colors.primary,
                    opacity: (!pairCode.trim() || isPairing) ? 0.5 : 1,
                  }
                ])}
              >
                {isPairing ? (
                  <LoadingSpinner size={20} color={colors.primary} strokeWidth={3} />
                ) : (
                  <Text style={StyleSheet.flatten([styles.vipModalPairButtonText, { color: colors.primary }])}>
                    配對
                  </Text>
                )}
              </Button>
            </View>
          </View>
        </View>
      </BottomSheetModal>

      {/* VIP Unlock Overlay */}
      <VipUnlock
        visible={showVipUnlockOverlay}
        onClose={() => setShowVipUnlockOverlay(false)}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  profileInfo: {
    paddingTop: 20,
    paddingHorizontal: 20,
    gap: 20,
  },
  avatarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  editProfileButton: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  editProfileButtonText: {
    fontSize: 14,
    color: colors.text,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 48,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'visible',
    position: 'relative',
  },
  eyeIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.background + 'E6',
    borderWidth: 1.5,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
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
  profileInfoTextGenerationContainer: {
    borderWidth: 1,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  profileInfoTextGeneration: {
    fontSize: 14,
    color: colors.text,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 20,
    gap: 10,
  },
  statItem: {
    width: '30%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderRadius: 20,
    gap: 4,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: 20,
    marginVertical: 32,
  },
  settingsView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.textSecondary,
    letterSpacing: 1.5,
    marginBottom: 16,
    marginLeft: 4,
    textTransform: 'uppercase',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  linkLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  linkArrow: {
    fontSize: 18,
    color: colors.textSecondary,
    fontWeight: 'bold',
  },
  modalContainer: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  modalContent: {
    width: '100%',
  },
  vipBadge: {
    borderWidth: 1,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginLeft: 8,
  },
  vipBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  vipUnlockButton: {
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  vipUnlockButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  vipModalContent: {
    alignItems: 'center',
    gap: 16,
  },
  vipModalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginTop: 8,
  },
  vipModalDescription: {
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 24,
    marginTop: 8,
  },
  vipModalDescriptionHighlight: {
    fontWeight: 'bold',
    color: colors.primary,
  },
  vipModalSubDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 4,
  },
  vipModalButtonContainer: {
    width: '100%',
    marginTop: 16,
  },
  vipModalButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    width: '100%',
  },
  vipModalButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  vipModalInviteSection: {
    width: '100%',
    marginTop: 16,
    gap: 12,
  },
  vipModalInviteLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  vipModalInviteCodeContainer: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.background,
    alignItems: 'center',
  },
  vipModalInviteCode: {
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 4,
  },
  vipModalInviteHint: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  vipModalGenerateButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    width: '100%',
  },
  vipModalGenerateButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  vipModalPairSection: {
    width: '100%',
    marginTop: 24,
    gap: 12,
  },
  vipModalPairLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  vipModalPairInput: {
    marginBottom: 4,
  },
  vipModalErrorText: {
    fontSize: 12,
    color: colors.error,
    marginTop: -8,
  },
  vipModalPairButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    width: '100%',
  },
  vipModalPairButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});

export default ProfileScreen