import { View, Text, StyleSheet, Alert, ScrollView } from 'react-native'
import React, { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { colors } from '@/lib/colors'
import Button from '@/components/ui/button'
import { useAppContext } from '@/contexts/AppContext'
import { deleteAccount } from '@/lib/api'
import LoadingSpinner from '@/svgs/spinner'
import BottomSheetModal from '@/components/ui/bottom-sheet-modal'

const AccountSettingsScreen = () => {
  const router = useRouter();
  const { user, signOut } = useAppContext();
  const [loading, setLoading] = useState(false);
  const [signOutModalVisible, setSignOutModalVisible] = useState(false);
  const [deleteAccountModalVisible, setDeleteAccountModalVisible] = useState(false);

  const handleDeleteAccount = () => {
    setDeleteAccountModalVisible(true);
  };

  const confirmDeleteAccount = async () => {
    try {
      setDeleteAccountModalVisible(false);
      setLoading(true);
      await deleteAccount();
      // Sign out handles the redirect to login
      await signOut(); 
    } catch (error: any) {
      Alert.alert("錯誤", error.message || "刪除失敗，請稍後再試");
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    setSignOutModalVisible(true);
  };

  const confirmSignOut = async () => {
    try {
      setSignOutModalVisible(false);
      await signOut();
    } catch (error) {
      console.error('Error during sign out:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Button onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>返回</Text>
        </Button>
        <Text style={styles.title}>帳號設定</Text>
        <View style={{ width: 40 }} /> 
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.label}>登入資訊</Text>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>電子郵件</Text>
            <Text style={styles.infoValue}>{user?.email}</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>登入方式</Text>
            <Text style={styles.infoValue}>
              {user?.provider === 'google' ? 'Google' : user?.provider === 'apple' ? 'Apple' : 'Email'}
            </Text>
          </View>
        </View>

        <View style={styles.signOutSection}>
          <Button style={styles.signOutButton} onPress={handleSignOut}>
            <Text style={styles.signOutText}>登出</Text>
          </Button>
        </View>

        <View style={styles.dangerZone}>
          <Text style={styles.dangerTitle}>危險區域</Text>
          <Text style={styles.dangerDescription}>
            刪除帳號後，你將無法恢復你的個人資料和聊天記錄。
          </Text>
          
          <Button 
            onPress={handleDeleteAccount} 
            disabled={loading}
            style={styles.deleteButton}
          >
            {loading ? (
              <LoadingSpinner size={20} color={colors.error} strokeWidth={3} />
            ) : (
              <Text style={styles.deleteButtonText}>刪除帳號</Text>
            )}
          </Button>
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

      {/* Delete Account Modal */}
      <BottomSheetModal
        visible={deleteAccountModalVisible}
        containerStyle={styles.modalContainer}
        onClose={() => setDeleteAccountModalVisible(false)}
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>刪除帳號</Text>
          <Text style={styles.modalSubtitle}>
            確定要刪除帳號嗎？此動作無法復原，你的所有資料（包含聊天記錄、好友、照片）將會永久刪除。
          </Text>

          <Button
            style={styles.modalButtonDanger}
            onPress={confirmDeleteAccount}
            disabled={loading}
          >
            {loading ? (
              <LoadingSpinner size={20} color={colors.error} strokeWidth={3} />
            ) : (
              <Text style={styles.modalButtonText}>確認刪除</Text>
            )}
          </Button>

          <Button
            style={styles.modalButtonCancel}
            onPress={() => setDeleteAccountModalVisible(false)}
            disabled={loading}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    paddingVertical: 8,
    paddingRight: 12,
  },
  backButtonText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 32,
    gap: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  infoCard: {
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 16,
    color: colors.text,
  },
  infoValue: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  signOutSection: {
    marginBottom: 32,
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
  dangerZone: {
    marginTop: 20,
    gap: 12,
    padding: 20,
    backgroundColor: colors.error + '10', // 10% opacity
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.error + '40',
  },
  dangerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.error,
  },
  dangerDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
    lineHeight: 20,
  },
  deleteButton: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.error,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    color: colors.error,
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default AccountSettingsScreen;