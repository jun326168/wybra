import { View, Text, StyleSheet, Image, FlatList, KeyboardAvoidingView, Platform } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect, useRef, useState } from 'react'
import { colors } from '@/lib/colors';
import LoadingSpinner from '@/svgs/spinner';
import LogoIcon from '@/svgs/logo';
import { Feather } from '@expo/vector-icons';
import { fetchChat } from '@/lib/api';
import { Chat, Message } from '@/lib/types';
import { router, useLocalSearchParams } from 'expo-router';
import Button from '@/components/ui/button';
import { useAppContext } from '@/contexts/AppContext';
import { PHOTO_BLUR_AMOUNT } from '@/lib/setup';
import Input from '@/components/ui/input';

const ChatScreen = () => {

  const { user } = useAppContext();
  const { chat_id, other_user_id } = useLocalSearchParams();
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [otherUserProgress, setOtherUserProgress] = useState(0);
  const [currentUserProgress, setCurrentUserProgress] = useState(0);

  const flatListRef = useRef<FlatList<Message>>(null);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);

  const themeColor = chat?.other_user?.personal_info?.color === colors.background ? colors.text : chat?.other_user?.personal_info?.color as string;

  const showImage = false;

  useEffect(() => {
    loadChat();
  }, []);

  const loadChat = async () => {
    const { chat, messages } = await fetchChat(chat_id as string, other_user_id as string);
    setChat(chat);
    setMessages(messages);
    setCurrentUserProgress(Math.min(100, user?.id === chat?.user_1 ? (chat?.chat_info?.user_1_progress as number) : (chat?.chat_info?.user_2_progress as number)));
    setOtherUserProgress(Math.min(100, user?.id === chat?.user_1 ? (chat?.chat_info?.user_2_progress as number) : (chat?.chat_info?.user_1_progress as number)));
    setLoading(false);
  };

  const handleSendMessage = async () => {
    
  };

  const renderMessage = ({ item }: { item: Message }) => {
    return (
      <View style={styles.messageContainer}>
        <Text style={styles.messageText}>{item.content}</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <LoadingSpinner size={24} color={colors.primary} strokeWidth={3} />
        <Text style={styles.loadingText}>正在載入聊天...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <Button onPress={() => router.back()}>
            <Feather name="chevron-left" size={24} color={colors.text} />
          </Button>
          <View style={[styles.avatarContainer, { borderColor: themeColor }]}>
            {chat?.other_user?.personal_info?.avatar_url ? (
              <Image
                source={{ uri: chat?.other_user.personal_info.avatar_url as string }}
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
                    size={20}
                    floatingY={0}
                    stroke={themeColor}
                  />
                </View>
              </View>
            )}
          </View>
          <Text style={styles.headerTitle}>{chat?.other_user?.username}</Text>
        </View>
        {/* progress bar */}
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarLeftContainer}>
            <View style={[styles.progressBarLeft, {
              backgroundColor: (chat?.other_user?.personal_info?.color === colors.background ? colors.text : chat?.other_user?.personal_info?.color) as string,
              shadowColor: (chat?.other_user?.personal_info?.color === colors.background ? colors.text : chat?.other_user?.personal_info?.color) as string,
              width: `${otherUserProgress}%`,
            }]} />
          </View>
          <View style={styles.progressBarRightContainer}>
            <View style={[styles.progressBarRight, {
              backgroundColor: (user?.personal_info?.color === colors.background ? colors.text : user?.personal_info?.color) as string,
              shadowColor: (user?.personal_info?.color === colors.background ? colors.text : user?.personal_info?.color) as string,
              width: `${currentUserProgress}%`,
            }]} />
          </View>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <FlatList
          // ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.listContent}
          inverted={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        // ListFooterComponent={renderQuizTrigger}
        />

        {/* --- INPUT --- */}
        <View style={styles.inputContainer}>
          <Input
            style={[styles.inputField, { borderColor: themeColor + '40' }]}
            value={inputText}
            onChangeText={setInputText}
            placeholder="發送訊號..."
            placeholderTextColor={colors.textSecondary}
            multiline
          />
          <Button
            onPress={handleSendMessage}
            disabled={!inputText.trim() || sending}
            style={[styles.sendButton, { backgroundColor: inputText.trim() ? themeColor : colors.card }]}
          >
            {sending ? (
              <LoadingSpinner size={16} color={colors.background} />
            ) : (
              <Text style={[styles.sendIcon, { color: inputText.trim() ? colors.background : colors.textSecondary }]}>↑</Text>
            )}
          </Button>
        </View>
      </KeyboardAvoidingView>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 8,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    letterSpacing: 1,
  },
  avatarContainer: {
    width: 42,
    height: 42,
    borderRadius: 25,
    borderWidth: 1.5,
    overflow: 'hidden',
    backgroundColor: colors.background, // Fallback
  },
  avatar: {
    width: '100%',
    height: '100%',
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

  progressBarContainer: {
    marginTop: 6,
    width: '100%',
    borderRadius: 4,
    flexDirection: 'row',
    gap: 4,
  },
  progressBarRightContainer: {
    position: 'relative',
    flex: 1,
    height: 8,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
    borderBottomLeftRadius: 2,
    borderTopLeftRadius: 2,
    backgroundColor: colors.textSecondary + '20',
  },
  progressBarLeftContainer: {
    position: 'relative',
    flex: 1,
    height: 8,
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 2,
    borderTopRightRadius: 2,
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
    borderBottomRightRadius: 2,
    borderTopRightRadius: 2,
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
    borderBottomLeftRadius: 2,
    borderTopLeftRadius: 2,
  },
});

export default ChatScreen