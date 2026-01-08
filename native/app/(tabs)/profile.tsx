import { View, Text, StyleSheet, Image, ScrollView, Linking } from 'react-native'
import React, { useState, useEffect } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors } from '@/lib/colors'
import { useAppContext } from '@/contexts/AppContext'
import LogoIcon from '@/svgs/logo'
import { EyeIcon, EyeSlashIcon } from '@/svgs'
import Button from '@/components/ui/button'
import { useRouter } from 'expo-router'
import BottomSheetModal from '@/components/ui/bottom-sheet-modal'
import { GENERATION_OPTIONS, getGeneration, INTEREST_TAGS, MBTI_OPTIONS, PHOTO_BLUR_AMOUNT } from '@/lib/setup'

const ProfileScreen = () => {
  const { user, signOut } = useAppContext();
  const router = useRouter();
  const [showImage, setShowImage] = useState(false);
  const [signOutModalVisible, setSignOutModalVisible] = useState(false);

  const avatarUrl = user?.personal_info?.avatar_url as string | undefined;
  const generation = getGeneration(new Date(user?.personal_info?.birthday as string).getFullYear());
  const generationColor = colors.generation[generation as keyof typeof colors.generation];
  const logoStrokeColor = user?.personal_info?.color === colors.background ? colors.textSecondary : (user?.personal_info?.color as string | undefined);

  // Redirect to auth screen if user is signed out
  useEffect(() => {
    if (user === null) {
      router.replace('/');
    }
  }, [user, router]);

  const handleEditProfile = () => {
    router.push('/profile-settings');
  };

  const handlePreferenceSettings = () => {
    router.push('/preference-settings');
  };

  const handleAccountSettings = () => {
    // router.push('/account-settings');
  };

  const handleSignOut = () => {
    setSignOutModalVisible(true);
  };

  const confirmSignOut = async () => {
    try {
      setSignOutModalVisible(false);
      await signOut();
      // The useEffect will handle navigation when user becomes null
    } catch (error) {
      console.error('Error during sign out:', error);
    }
  };

  const openLink = (url: string) => {
    Linking.openURL(url).catch(err => console.error("Couldn't load page", err));
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
                  style={StyleSheet.flatten([
                    styles.avatarImage,
                    !showImage && styles.avatarImageBlurred
                  ])}
                  blurRadius={showImage ? 0 : PHOTO_BLUR_AMOUNT}
                />
                {!showImage && (
                  <View style={styles.blurOverlay}>
                    <View style={styles.lockedStateContent}>
                      <LogoIcon size={60} floatingY={0} stroke={logoStrokeColor} />
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
              <Text style={styles.editProfileButtonText}>編輯個人檔案</Text>
            </Button>
          </View>
          <View style={styles.profileInfoContainer}>
            <View style={styles.profileInfoTextContainer}>
              <Text style={styles.profileInfoText}>{user?.username}</Text>
              {/* <View style={[styles.profileInfoTextGenerationContainer, { backgroundColor: generationColor + '1A', borderColor: generationColor + '80' }]}>
                <Text style={[styles.profileInfoTextGeneration, { color: generationColor }]}>{GENERATION_OPTIONS.find(option => option.value === generation)?.label}</Text>
              </View> */}
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
        <View style={StyleSheet.flatten([styles.settingsView])}>
          <View>
            <Text style={styles.sectionTitle}>關於</Text>
            <Button style={styles.linkRow} onPress={() => openLink('https://wybra.vercel.app/privacy')}>
              <Text style={styles.linkLabel}>隱私權政策</Text>
              <Text style={styles.linkArrow}>→</Text>
            </Button>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Sign Out Section */}
        <View style={StyleSheet.flatten([styles.settingsView, { paddingBottom: 100 }])}>
          <View>
            <Button style={styles.signOutButton} onPress={handleSignOut}>
              <Text style={styles.signOutText}>登出</Text>
            </Button>
          </View>
        </View>
      </ScrollView>

      {/* Sign Out Modal */}
      <BottomSheetModal
        visible={signOutModalVisible}
        containerStyle={styles.modalContainer}
        onClose={() => setSignOutModalVisible(false)}
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>確定要登出嗎？</Text>

          <Button
            style={styles.modalButtonDanger}
            onPress={confirmSignOut}
          >
            <Text style={styles.modalButtonText}>登出</Text>
          </Button>

          <Button
            style={styles.modalButtonCancel}
            onPress={() => setSignOutModalVisible(false)}
          >
            <Text style={styles.modalButtonCancelText}>取消</Text>
          </Button>
        </View>
      </BottomSheetModal>
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
  signOutButton: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: colors.error + '1A',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.error + '40',
  },
  signOutText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.error,
  },
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
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  modalButtonDanger: {
    width: '100%',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.error + '40',
    backgroundColor: colors.error + '1A',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalButtonCancel: {
    width: '100%',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.error,
  },
  modalButtonCancelText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textSecondary,
  },
});

export default ProfileScreen