import { View, Text, StyleSheet, Image, FlatList, KeyboardAvoidingView, Platform, Pressable, Keyboard } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect, useRef, useState } from 'react'
import { brightenHexColor, colors } from '@/lib/colors';
import LoadingSpinner from '@/svgs/spinner';
import LogoIcon from '@/svgs/logo';
import { fetchChat } from '@/lib/api';
import { Chat, Message, User } from '@/lib/types';
import { router, useLocalSearchParams } from 'expo-router';
import Button from '@/components/ui/button';
import { useAppContext } from '@/contexts/AppContext';
import { PHOTO_BLUR_AMOUNT } from '@/lib/setup';
import Input from '@/components/ui/input';
import { Entypo } from '@expo/vector-icons';
import ProfileModal from '@/components/ui/profile-modal';
import { formatMessageTime } from '@/lib/functions';

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
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  const themeColor = chat?.other_user?.personal_info?.color === colors.background ? colors.textSecondary : chat?.other_user?.personal_info?.color as string;
  const userColor = user?.personal_info?.color === colors.background ? colors.textSecondary : user?.personal_info?.color as string;

  const showImage = false;

  useEffect(() => {
    loadChat();
  }, []);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {
        setIsKeyboardVisible(true);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setIsKeyboardVisible(false);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
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

  const renderMessage = ({ item, isSameUser }: { item: Message, isSameUser: boolean }) => {

    const lighterUserColor = brightenHexColor(userColor, 0.1);
    const lighterThemeColor = brightenHexColor(themeColor, 0.1);

    return (
      <View style={[styles.messageContainer, {
        justifyContent: item.user_id === user?.id ? 'flex-end' : 'flex-start',
        marginBottom: isSameUser ? 8 : 16,
      }]}>
        {item.user_id === user?.id && (
          <View style={styles.timeTextContainer}>
            <Text style={styles.timeText}>{formatMessageTime(item.created_at)}</Text>
          </View>
        )}
        <View style={[styles.messageBubble, { 
          backgroundColor: (item.user_id === user?.id ? lighterUserColor : lighterThemeColor) + '80',
        }]}>
          <Text style={styles.messageText}>{item.content}</Text>
        </View>
        {item.user_id !== user?.id && (
          <View style={styles.timeTextContainer}>
            <Text style={styles.timeText}>{formatMessageTime(item.created_at)}</Text>
          </View>
        )}
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
            <Entypo name="chevron-thin-left" size={24} color={colors.text} />
          </Button>
          <Pressable onPress={() => setShowProfileModal(true)} style={[styles.avatarContainer, { borderColor: themeColor }]}>
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
          </Pressable>
          <Pressable onPress={() => setShowProfileModal(true)}>
            <Text style={styles.headerTitle}>{chat?.other_user?.username}</Text>
          </Pressable>
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
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={(item) => renderMessage({ item: item.item, isSameUser: item.index > 0 && item.item.user_id === messages[item.index - 1].user_id })}
          contentContainerStyle={styles.listContent}
          inverted={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          // ListFooterComponent={() => <View style={styles.listFooter} />}
        />

        {/* --- INPUT --- */}
        <View style={[styles.inputContainer, { paddingBottom: isKeyboardVisible ? 12 : 40 }]}>
          <Input
            style={[styles.inputField, { borderColor: themeColor + '40' }]}
            value={inputText}
            onChangeText={setInputText}
            placeholder="你的訊息..."
            placeholderTextColor={colors.textSecondary}
            multiline={true}
            textAlignVertical="top"
          />
          <Button
            onPress={handleSendMessage}
            disabled={!inputText.trim() || sending}
            style={[styles.sendButton, { backgroundColor: inputText.trim() ? themeColor : colors.card, }]}
          >
            {sending ? (
              <LoadingSpinner size={16} color={colors.background} />
            ) : (
              <Text style={[styles.sendIcon]}>↑</Text>
            )}
          </Button>
        </View>
      </KeyboardAvoidingView>

      {/* Profile Modal */}
      <ProfileModal
        visible={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        user={chat?.other_user as User}
      />
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

  listContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  messageContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
  },
  timeTextContainer: {
    marginBottom: 2,
  },
  timeText: {
    fontSize: 10,
    color: colors.textSecondary + 'A0',
  },
  messageBubble: {
    backgroundColor: colors.card,
    padding: 12,
    borderRadius: 20,
    maxWidth: '75%',
  },
  messageText: {
    fontSize: 15,
    color: colors.text,
  },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 12,
  },
  inputField: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 16,
    fontSize: 15,
    borderRadius: 24,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    minHeight: 50,
    maxHeight: 120,
  },
  sendButton: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 25,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.border,
  },
  sendIcon: {
    fontSize: 24,
    color: colors.text,
  },

});

export default ChatScreen