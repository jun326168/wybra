import { View, Text, StyleSheet, ScrollView } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { colors } from '@/lib/colors'
import Button from '@/components/ui/button'

const EulaScreen = () => {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Button onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>返回</Text>
        </Button>
        <Text style={styles.title}>使用條款</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.agreementTitle}>Wybra 使用條款</Text>
        
        <Text style={styles.paragraph}>
          請在使用 Wybra（以下簡稱「本應用程式」）前仔細閱讀本條款。使用本應用程式即表示您同意受本條款約束。
        </Text>

        <Text style={styles.sectionTitle}>1. 零容忍政策 (Zero Tolerance Policy)</Text>
        <Text style={styles.paragraph}>
          本應用程式致力於提供安全、友善的環境。我們對於任何形式的令人反感內容（Objectionable Content）或濫用行為（Abusive Users）採取<Text style={styles.highlight}>零容忍政策</Text>。
        </Text>

        <Text style={styles.sectionTitle}>2. 禁止內容</Text>
        <Text style={styles.paragraph}>
          您不得上傳、發布或傳輸以下任何內容：
        </Text>
        <View style={styles.bulletList}>
          <Text style={styles.bulletItem}>• 誹謗、侮辱、騷擾、霸凌或威脅他人的內容。</Text>
          <Text style={styles.bulletItem}>• 色情、淫穢或過度裸露的圖片或文字。</Text>
          <Text style={styles.bulletItem}>• 宣揚仇恨、暴力、種族歧視或性別歧視的言論。</Text>
          <Text style={styles.bulletItem}>• 任何違反當地法律法規的非法活動。</Text>
        </View>

        <Text style={styles.sectionTitle}>3. 違規處理</Text>
        <Text style={styles.paragraph}>
          若您違反上述規定，Wybra 有權在不預先通知的情況下：
        </Text>
        <View style={styles.bulletList}>
          <Text style={styles.bulletItem}>• 立即刪除相關違規內容。</Text>
          <Text style={styles.bulletItem}>• 暫停或永久終止您的帳號使用權限。</Text>
          <Text style={styles.bulletItem}>• 向執法機關報告違法行為。</Text>
        </View>

        <Text style={styles.sectionTitle}>4. 檢舉與封鎖</Text>
        <Text style={styles.paragraph}>
          我們提供了封鎖（Block）與檢舉（Report）機制。若您發現任何違反本條款的用戶或內容，請立即使用應用程式內的檢舉功能回報，我們將在 24 小時內進行審查並採取適當行動。
        </Text>

        <Text style={styles.footer}>
          最後更新日期：2026年1月12日
        </Text>
      </ScrollView>
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
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  agreementTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 20,
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 24,
    marginBottom: 8,
  },
  highlight: {
    color: colors.error,
    fontWeight: 'bold',
  },
  bulletList: {
    paddingLeft: 8,
    gap: 6,
  },
  bulletItem: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  footer: {
    marginTop: 40,
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default EulaScreen;