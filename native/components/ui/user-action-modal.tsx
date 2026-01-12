import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { colors } from '@/lib/colors';
import BottomSheetModal from '@/components/ui/bottom-sheet-modal';
import Button from '@/components/ui/button';
import { blockUser, reportUser } from '@/lib/api';
import LoadingSpinner from '@/svgs/spinner';
import { useRouter } from 'expo-router';

interface UserActionModalProps {
  visible: boolean;
  onClose: () => void;
  targetUserId: string;
  targetUserName?: string;
  onBlockSuccess?: () => void; // Callback to remove chat from list
}

const REPORT_REASONS = [
  "不適當的內容",
  "騷擾或霸凌",
  "垃圾訊息或詐騙",
  "假冒他人",
  "其他",
];

export default function UserActionModal({ 
  visible, 
  onClose, 
  targetUserId, 
  targetUserName,
  onBlockSuccess 
}: UserActionModalProps) {
  const router = useRouter();
  const [view, setView] = useState<'menu' | 'report'>('menu');
  const [loading, setLoading] = useState(false);

  // Reset view when opening
  React.useEffect(() => {
    if (visible) setView('menu');
  }, [visible]);

  const handleBlock = () => {
    Alert.alert(
      `封鎖 ${targetUserName || '此用戶'}?`,
      "封鎖後，你們將無法再看到對方的訊息或動態。",
      [
        { text: "取消", style: "cancel" },
        {
          text: "確認封鎖",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              await blockUser(targetUserId);
              setLoading(false);
              onClose();
              if (onBlockSuccess) {
                onBlockSuccess();
              } else {
                router.back(); // Usually go back to list
              }
              Alert.alert("已封鎖", "該用戶已被封鎖");
            } catch (error: any) {
              setLoading(false);
              Alert.alert("錯誤", error.message);
            }
          }
        }
      ]
    );
  };

  const handleReport = async (reason: string) => {
    try {
      setLoading(true);
      await reportUser(targetUserId, reason);
      setLoading(false);
      onClose();
      Alert.alert("感謝您的檢舉", "我們已收到您的回報並將儘快處理。");
    } catch (error: any) {
      setLoading(false);
      Alert.alert("錯誤", error.message);
    }
  };

  return (
    <BottomSheetModal
      visible={visible}
      onClose={onClose}
      containerStyle={styles.container}
    >
      <View style={styles.content}>
        {view === 'menu' ? (
          <>
            <Text style={styles.title}>更多選項</Text>
            
            <View style={styles.menuContainer}>
              <Button 
                style={styles.menuItem} 
                onPress={() => setView('report')}
              >
                <Text style={styles.menuText}>檢舉用戶</Text>
                <Text style={styles.menuArrow}>→</Text>
              </Button>

              <View style={styles.divider} />

              <Button 
                style={styles.menuItem} 
                onPress={handleBlock}
                disabled={loading}
              >
                {loading ? (
                  <LoadingSpinner size={16} color={colors.error} />
                ) : (
                  <Text style={[styles.menuText, styles.destructiveText]}>封鎖用戶</Text>
                )}
              </Button>
            </View>
            
            <Button style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelText}>取消</Text>
            </Button>
          </>
        ) : (
          <>
            <View style={styles.headerRow}>
              <Button onPress={() => setView('menu')} style={styles.backButton}>
                <Text style={styles.backText}>{'返回'}</Text>
              </Button>
              <Text style={styles.title}>選擇檢舉原因</Text>
              <View style={{width: 40}} />
            </View>

            <ScrollView style={styles.reasonList}>
              {REPORT_REASONS.map((reason) => (
                <Button
                  key={reason}
                  style={styles.reasonItem}
                  onPress={() => handleReport(reason)}
                  disabled={loading}
                >
                  <Text style={styles.reasonText}>{reason}</Text>
                  {loading && <LoadingSpinner size={16} color={colors.text} />}
                </Button>
              ))}
            </ScrollView>
          </>
        )}
      </View>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  content: {
    paddingBottom: 20,
    width: '100%',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 20,
  },
  menuContainer: {
    backgroundColor: colors.background,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  menuItem: {
    paddingVertical: 18,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  menuText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  destructiveText: {
    color: colors.error,
  },
  menuArrow: {
    fontSize: 18,
    color: colors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  cancelButton: {
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  backText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  reasonList: {
    maxHeight: 400,
  },
  reasonItem: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  reasonText: {
    fontSize: 16,
    color: colors.text,
  },
});