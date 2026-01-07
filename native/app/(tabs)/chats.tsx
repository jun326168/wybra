import { FlatList, StyleSheet, Text, View, Image, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import { colors } from '@/lib/colors';
import LogoIcon from '@/svgs/logo';
import { useAppContext } from '@/contexts/AppContext';
import Button from '@/components/ui/button';
import { fetchChats } from '@/lib/api';
import { Chat } from '@/lib/types'; // Ensure your types file is correct
import LoadingSpinner from '@/svgs/spinner';
import { PHOTO_BLUR_AMOUNT } from '@/lib/setup'; // Import your global blur constant
import { formatMessageTime } from '@/lib/functions';

export default function ChatsScreen() {
  const { user } = useAppContext();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const showImage = false;

  const loadData = useCallback(async (isRefreshing = false) => {
    try {
      if (!isRefreshing) {
        setLoading(true);
      }
      const data = await fetchChats();
      setChats(data);
    } catch (error) {
      console.error('Error fetching chats:', error);
    } finally {
      if (isRefreshing) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Refresh when screen comes into focus (e.g., after creating a chat on home page)
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  // Pull to refresh handler
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData(true);
  }, [loadData]);

  const handlePressChat = (chatId: string) => {
    router.push(`/chat?chat_id=${chatId}`);
  };

  const renderItem = ({ item }: { item: Chat }) => {
    // 1. Determine the "Vibe Color"
    const rawColor = item.other_user?.personal_info?.color as string;
    const themeColor = (!rawColor || rawColor === colors.background)
      ? colors.textSecondary
      : rawColor;

    // 2. Formatting
    const timeDisplay = formatMessageTime(item.last_message?.created_at || item.created_at);
    const lastContent = item.last_message?.content || 'New signal established...';

    // 3. Unread Logic (Mock logic: if the last message is NOT from me, highlight it)
    // You can replace this with a real `unread_count` field later
    const isLastMessageFromMe = item.last_message?.sender_id === user?.id;
    const isUnread = !isLastMessageFromMe && item.last_message;

    // 4. Determine which user is current user and get progress accordingly
    const isUser1 = user?.id === item.user_1;
    const currentUserProgress = Math.min(100, isUser1 ? (item.chat_info?.user_1_progress as number) : (item.chat_info?.user_2_progress as number));
    const otherUserProgress = Math.min(100, isUser1 ? (item.chat_info?.user_2_progress as number) : (item.chat_info?.user_1_progress as number));

    return (
      <Button
        style={[styles.chatItem, { borderColor: isUnread ? themeColor : colors.border }]}
        onPress={() => handlePressChat(item.id)}
      >
        {/* Left: Haze Avatar */}
        <View style={[styles.avatarContainer, { borderColor: themeColor }]}>
          {item.other_user?.personal_info?.avatar_url ? (
            <Image
              source={{ uri: item.other_user.personal_info.avatar_url as string }}
              style={styles.avatar}
              blurRadius={PHOTO_BLUR_AMOUNT}
            />
          ) : (
            <View style={[styles.avatar, { backgroundColor: colors.card }]} />
          )}
          {!showImage && (
            <View style={styles.blurOverlay}>
              <View style={styles.lockedStateContent}>
                <LogoIcon
                  size={28}
                  floatingY={0}
                  stroke={themeColor}
                />
              </View>
            </View>
          )}
        </View>

        {/* Center: Info */}
        <View style={styles.chatInfo}>
          <View style={styles.topRow}>
            <Text style={[styles.username, { color: themeColor }]} numberOfLines={1}>
              {item.other_user?.username}
            </Text>
            <Text style={styles.timeText}>{timeDisplay}</Text>
          </View>

          <Text
            style={[
              styles.lastMessage,
              isUnread && { color: colors.text, fontWeight: '600' }
            ]}
            numberOfLines={1}
          >
            {isLastMessageFromMe && <Text style={{ color: colors.textSecondary }}>你: </Text>}
            {lastContent}
          </Text>

          <View style={styles.bottomRow}>
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarLeftContainer}>
                <View style={[styles.progressBarLeft, { 
                  shadowColor: themeColor,
                  backgroundColor: themeColor,
                  width: `${otherUserProgress}%`
                }]} />
              </View>

              <View style={styles.progressBarRightContainer}>
                <View style={[styles.progressBarRight, {
                  shadowColor: (user?.personal_info?.color === colors.background ? colors.text : user?.personal_info?.color) as string,
                  backgroundColor: (user?.personal_info?.color === colors.background ? colors.text : user?.personal_info?.color) as string,
                  width: `${currentUserProgress}%`
                }]} />
              </View>
            </View>
          </View>
        </View>
      </Button>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <LoadingSpinner size={24} color={colors.primary} strokeWidth={3} />
        <Text style={styles.loadingText}>正在載入...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <LogoIcon size={24} floatingY={2} />
          <Text style={styles.headerTitle}>聊天</Text>
        </View>
      </View>

      {/* Empty State */}
      {chats.length === 0 ? (
        <View style={styles.noChatsContainer}>
          <View>
            <LogoIcon size={100} floatingY={8} />
          </View>
          <Text style={styles.noChatsTitle}>還沒有聊天</Text>
          <Text style={styles.noChatsText}>
            空氣靜謐，到首頁尋找共鳴
          </Text>
          <Button onPress={() => router.push('/home')} style={styles.noChatsButton}>
            <Text style={styles.noChatsButtonText}>開始漂流</Text>
          </Button>
        </View>
      ) : (
        /* Chat List */
        <FlatList
          data={chats}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.chatsContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 14,
    letterSpacing: 1,
  },
  header: {
    paddingHorizontal: 28,
    paddingVertical: 16,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    letterSpacing: 1,
  },

  // Empty State
  noChatsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 80,
    paddingHorizontal: 40,
    gap: 16,
  },
  noChatsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 10,
  },
  noChatsText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  noChatsButton: {
    marginTop: 16,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: 'transparent',
  },
  noChatsButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
    letterSpacing: 1,
  },

  // List
  chatsContainer: {
    flex: 1,
    padding: 20,
    gap: 12,
  },

  // Chat Card
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 1, // Subtle border normally
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    overflow: 'hidden',
    backgroundColor: colors.background, // Fallback
    marginRight: 16,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  chatInfo: {
    flex: 1,
    justifyContent: 'center',
    gap: 6,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressBarContainer: {
    marginTop: 4,
    width: '100%',
    height: 6,
    borderRadius: 4,
    flexDirection: 'row',
    gap: 3,
  },
  progressBarLeftContainer: {
    position: 'relative',
    flex: 1,
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 1,
    borderTopRightRadius: 1,
    backgroundColor: colors.textSecondary + '20',
  },
  progressBarRightContainer: {
    position: 'relative',
    flex: 1,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
    borderBottomLeftRadius: 1,
    borderTopLeftRadius: 1,
    backgroundColor: colors.textSecondary + '20',
  },
  progressBarLeft: {
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 5,
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 1,
    borderTopRightRadius: 1,
  },
  progressBarRight: {
    height: '100%',
    position: 'absolute',
    top: 0,
    right: 0,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 5,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
    borderBottomLeftRadius: 1,
    borderTopLeftRadius: 1,
  },
  username: {
    fontSize: 17,
    fontWeight: 'bold',
    maxWidth: '70%',
  },
  timeText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  lastMessage: {
    fontSize: 14,
    color: colors.textSecondary,
    maxWidth: '85%',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background + '40',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  lockedStateContent: {
    alignItems: 'center',
    gap: 8,
  },
});