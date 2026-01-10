import { View, Text, StyleSheet, FlatList, KeyboardAvoidingView, Platform, Pressable, Keyboard, Animated } from 'react-native'
import { Image } from 'expo-image'
import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect, useRef, useState } from 'react'
import { colors } from '@/lib/colors';
import LoadingSpinner from '@/svgs/spinner';
import LogoIcon, { LogoPersonality } from '@/svgs/logo';
import { fetchChat, sendMessage, markMessageAsRead, updateChatInfo } from '@/lib/api';
import { Chat, Message, User } from '@/lib/types';
import { router, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import Button from '@/components/ui/button';
import { useAppContext } from '@/contexts/AppContext';
import { PHOTO_BLUR_AMOUNT } from '@/lib/setup';
import Input from '@/components/ui/input';
import { Entypo } from '@expo/vector-icons';
import ProfileModal from '@/components/ui/profile-modal';
import { formatMessageTime } from '@/lib/functions';
import ChatTips from '@/components/ui/chat-tips';
import MidReward from '@/components/reward-overlays/mid-reward';
import QuizUnlock from '@/components/reward-overlays/quiz-unlock';
import { subscribeToChat } from '@/lib/real-time';
import { Pusher } from '@pusher/pusher-websocket-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  const [showFirstTimeTips, setShowFirstTimeTips] = useState(false);
  const [firstTimeTipStep, setFirstTimeTipStep] = useState(1);
  const [showAlongsideTips, setShowAlongsideTips] = useState(false);

  // Animated values for progress bars
  const otherUserProgressAnim = useRef(new Animated.Value(0)).current;
  const currentUserProgressAnim = useRef(new Animated.Value(0)).current;
  // Animated value for quiz button scale
  const quizButtonScaleAnim = useRef(new Animated.Value(1)).current;

  const themeColor = chat?.other_user?.personal_info?.color === colors.background ? colors.textSecondary : chat?.other_user?.personal_info?.color as string;
  const personality = (chat?.other_user?.personal_info?.personality as LogoPersonality) || 'headphone';

  // Check if current user has unlocked the other user's photo
  const isUser1 = user?.id === chat?.user_1;
  const currentUserUnlocked = isUser1 
    ? (chat?.chat_info?.user_1_unlocked as boolean | undefined)
    : (chat?.chat_info?.user_2_unlocked as boolean | undefined);
  const [overlaySize, setOverlaySize] = useState<number | null>(null);
  const [overlayDimensions, setOverlayDimensions] = useState<{ width: number; height: number } | null>(null);
  const [ghostPosition, setGhostPosition] = useState<{ x: number; y: number } | null>(null);

  // Update ghost position when dimensions or other user data changes
  useEffect(() => {
    if (overlayDimensions && chat?.other_user?.personal_info?.ghost_pos) {
      const { width, height } = overlayDimensions;
      const savedGhostPos = chat.other_user.personal_info.ghost_pos as { x: number; y: number; size: number };
      const containerSize = Math.min(width, height);
      
      // Convert percentages to pixels
      const size = (savedGhostPos.size / 100) * containerSize;
      const x = (savedGhostPos.x / 100) * width;
      const y = (savedGhostPos.y / 100) * height;
      
      setOverlaySize(Math.max(20, size));
      setGhostPosition({ x, y });
    } else if (overlayDimensions && !chat?.other_user?.personal_info?.ghost_pos) {
      // Default: center, 50% size
      const { width, height } = overlayDimensions;
      const containerSize = Math.min(width, height);
      const size = containerSize * 0.5;
      setOverlaySize(size);
      setGhostPosition({ x: (width - size) / 2, y: (height - size) / 2 });
    }
  }, [chat?.other_user?.personal_info?.ghost_pos, overlayDimensions]);

  useEffect(() => {
    loadChat();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refetch chat when screen comes into focus (e.g., returning from quiz)
  useFocusEffect(
    React.useCallback(() => {
      if (!loading) {
        const refreshChat = async () => {
          try {
            const { chat: refreshedChat } = await fetchChat(chat_id as string, other_user_id as string);
            setChat(refreshedChat);
          } catch (error) {
            console.error('Error refreshing chat:', error);
          }
        };
        refreshChat();
      }
    }, [chat_id, other_user_id, loading])
  );

  // Subscribe to Pusher events when chat is loaded
  useEffect(() => {
    if (!chat?.id) return;

    let unsubscribeFn: (() => Promise<void>) | null = null;

    const setupSubscription = async () => {
      unsubscribeFn = await subscribeToChat(
        chat.id,
        (newMessage: Message) => {
          // Only add message if it's not already in the list and it's from the other user
          console.log('newMessage', newMessage);
          if (newMessage.user_id !== user?.id) {
            setMessages(prev => {
              const exists = prev.some(msg => msg.id === newMessage.id);
              if (exists) return prev;
              return [...prev, newMessage];
            });
            // Scroll to bottom when new message arrives
            setTimeout(() => {
              flatListRef.current?.scrollToEnd({ animated: false });
            }, 100);
          }
        },
        (updatedChat: Chat) => {
          setChat(prevChat => {
            if (!prevChat) return prevChat;
            
            return {
              ...prevChat,
              // Only update these fields from the event
              last_message_id: updatedChat.last_message_id,
              message_count: updatedChat.message_count,
              chat_info: updatedChat.chat_info,
              quiz_info: updatedChat.quiz_info,
              updated_at: updatedChat.updated_at,
              // Keep existing other_user data unchanged
            };
          });  
        }
      );
    };

    setupSubscription();

    // Cleanup subscription on unmount or when chat changes
    return () => {
      if (unsubscribeFn) {
        unsubscribeFn();
      }
    };
  }, [chat?.id, user?.id]);

  useEffect(() => {
    const checkPusherStatus = async () => {
      const pusher = Pusher.getInstance();
      const state = pusher.connectionState;
      console.log('[Chat] Pusher connection state:', state);
    };
    checkPusherStatus();
  }, []);

  useEffect(() => {
    const newCurrentUserProgress = user?.id === chat?.user_1 ? (chat?.chat_info?.user_1_progress as number) : (chat?.chat_info?.user_2_progress as number);
    const newOtherUserProgress = user?.id === chat?.user_1 ? (chat?.chat_info?.user_2_progress as number) : (chat?.chat_info?.user_1_progress as number);
    
    setCurrentUserProgress(newCurrentUserProgress);
    setOtherUserProgress(newOtherUserProgress);
    
    // Animate progress bars
    Animated.parallel([
      Animated.timing(currentUserProgressAnim, {
        toValue: Math.min(100, newCurrentUserProgress),
        duration: 500,
        useNativeDriver: false, // width animation requires layout, not native driver
      }),
      Animated.timing(otherUserProgressAnim, {
        toValue: Math.min(100, newOtherUserProgress),
        duration: 500,
        useNativeDriver: false,
      }),
    ]).start();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chat]);

  // Infinite scaling animation for quiz button
  useEffect(() => {
    const animateQuizButton = () => {
      Animated.sequence([
        Animated.timing(quizButtonScaleAnim, {
          toValue: 1.03,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(quizButtonScaleAnim, {
          toValue: 0.97,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start(() => animateQuizButton());
    };
    animateQuizButton();
  }, [quizButtonScaleAnim]);

  // Image display logic:
  // 1. If unlocked: no blur, no ghost (full reveal)
  // 2. If both progress > 50 but not unlocked: no blur, but ghost
  // 3. If either progress < 50: blur + ghost
  const shouldShowImage = currentUserUnlocked === true;
  const shouldShowBlur = !shouldShowImage && (currentUserProgress < 50 || otherUserProgress < 50);
  const shouldShowGhost = !shouldShowImage;

  // Check if current user has dismissed the mid-reward
  const currentUserShowMidReward = isUser1 
    ? (chat?.chat_info?.show_mid_reward as { user_1?: boolean; user_2?: boolean } | undefined)?.user_1
    : (chat?.chat_info?.show_mid_reward as { user_1?: boolean; user_2?: boolean } | undefined)?.user_2;
  
  // Check if current user has dismissed the quiz-unlock
  const currentUserShowQuizUnlock = isUser1 
    ? (chat?.chat_info?.show_quiz_unlock as { user_1?: boolean; user_2?: boolean } | undefined)?.user_1
    : (chat?.chat_info?.show_quiz_unlock as { user_1?: boolean; user_2?: boolean } | undefined)?.user_2;
  
  // Show mid-reward when both users' progress is above 50 and current user hasn't dismissed it
  const [showMidReward, setShowMidReward] = useState(
    currentUserProgress > 50 && 
    otherUserProgress > 50 && 
    currentUserShowMidReward !== true
  );

  // Show quiz-unlock when both users' progress is 100 and current user hasn't dismissed it
  const [showQuizUnlock, setShowQuizUnlock] = useState(
    currentUserProgress >= 100 && 
    otherUserProgress >= 100 && 
    currentUserShowQuizUnlock !== true
  );

  useEffect(() => {
    const shouldShowMidReward = currentUserProgress > 50 && 
      otherUserProgress > 50 && 
      currentUserShowMidReward !== true;
    setShowMidReward(shouldShowMidReward);
    
    const shouldShowQuizUnlock = currentUserProgress >= 100 && 
      otherUserProgress >= 100 && 
      currentUserShowQuizUnlock !== true;
    setShowQuizUnlock(shouldShowQuizUnlock);

    if (shouldShowQuizUnlock || shouldShowMidReward) {
      Keyboard.dismiss();
    }
  }, [currentUserProgress, otherUserProgress, currentUserShowMidReward, currentUserShowQuizUnlock]);

  // Watch messages and mark as read if last message is from other user
  useEffect(() => {
    if (!messages.length || !chat?.id || !user?.id) return;

    const lastMessage = messages[messages.length - 1];
    
    // If the last message is from the other user (not current user) and not already read
    if (lastMessage.user_id !== user.id && !chat.last_message_read) {
      markMessageAsRead(chat.id)
        .then((updatedChat) => {
          setChat(prevChat => prevChat ? { ...prevChat, last_message_read: updatedChat.last_message_read } : null);
        })
        .catch((error) => {
          console.error('Error marking message as read:', error);
        });
    }
  }, [messages, chat?.id, chat?.last_message_read, user?.id]);

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
    setLoading(false);
    
    // Initialize animated values with initial progress
    if (chat) {
      const initialCurrentUserProgress = user?.id === chat.user_1 ? (chat.chat_info?.user_1_progress as number) : (chat.chat_info?.user_2_progress as number);
      const initialOtherUserProgress = user?.id === chat.user_1 ? (chat.chat_info?.user_2_progress as number) : (chat.chat_info?.user_1_progress as number);
      
      otherUserProgressAnim.setValue(Math.min(100, initialOtherUserProgress));
      currentUserProgressAnim.setValue(Math.min(100, initialCurrentUserProgress));
    }
    
    if ((messages.length <= 1)) { // first time tips
      setShowFirstTimeTips(true);
    } else { // along side tips
      if (messages.length < 10 && new Date().getTime() - new Date(messages[messages.length - 1].created_at).getTime() > 21600000) { // 6 hours
        // check if already shown in 6 hours
        const lastShown = await AsyncStorage.getItem(`chat-tips`);
        if (!lastShown || new Date().getTime() > new Date(lastShown).getTime() + 21600000) {
          setShowAlongsideTips(true);
        }
      }
    }
  };

  const handleSendMessage = async () => {
    const messageContent = inputText.trim();
    setInputText('');
    const newMessage: Message = {
      id: '',
      chat_id: chat?.id as string,
      user_id: user?.id as string,
      content: messageContent,
      created_at: new Date().toISOString(),
      message_info: {},
    };
    setMessages([...messages, newMessage]);
    const { message, chat: updatedChat } = await sendMessage(user?.id as string, chat?.id as string, messageContent);
    setChat(updatedChat);
    setMessages(prev => prev.slice(0, -1).concat(message));
  };

  const handleFirstTimeTipPress = () => {
    if (firstTimeTipStep === 1) {
      setFirstTimeTipStep(2);
    } else {
      setShowFirstTimeTips(false);
    }
  };

  const handleAlongsideTipPress = () => {
    setShowAlongsideTips(false);
    AsyncStorage.setItem(`chat-tips`, new Date().toISOString());
  };

  const handleMidRewardClose = async () => {
    if (chat?.id && chat?.chat_info && user?.id) {
      setShowMidReward(false);
      // Then update in the background
      try {
        const isUser1 = user.id === chat.user_1;
        const currentShowMidReward = (chat.chat_info.show_mid_reward as { user_1?: boolean; user_2?: boolean } | undefined) || {};
        
        const updatedChatInfo = {
          ...chat.chat_info,
          show_mid_reward: {
            ...currentShowMidReward,
            [isUser1 ? 'user_1' : 'user_2']: true,
          },
        };
        const updatedChat = await updateChatInfo(chat.id, updatedChatInfo);
        // Update with the server response to ensure consistency
        setChat(updatedChat);
      } catch (error) {
        console.error('Error updating chat info:', error);
      }
    }
  }

  const handleQuizUnlockStart = async () => {
    if (chat?.id && chat?.chat_info && user?.id) {
      setShowQuizUnlock(false);
      router.push(`/quiz?id=${chat?.id}`);
      // Then update in the background
      try {
        const isUser1 = user.id === chat.user_1;
        const currentShowQuizUnlock = (chat.chat_info.show_quiz_unlock as { user_1?: boolean; user_2?: boolean } | undefined) || {};
        
        const updatedChatInfo = {
          ...chat.chat_info,
          show_quiz_unlock: {
            ...currentShowQuizUnlock,
            [isUser1 ? 'user_1' : 'user_2']: true,
          },
        };
        const updatedChat = await updateChatInfo(chat.id, updatedChatInfo);
        // Update with the server response to ensure consistency
        setChat(updatedChat);
      } catch (error) {
        console.error('Error updating chat info:', error);
      }
    }
  }

  const handleQuizUnlockClose = async () => {
    if (chat?.id && chat?.chat_info && user?.id) {
      setShowQuizUnlock(false);
      // Then update in the background
      try {
        const isUser1 = user.id === chat.user_1;
        const currentShowQuizUnlock = (chat.chat_info.show_quiz_unlock as { user_1?: boolean; user_2?: boolean } | undefined) || {};
        
        const updatedChatInfo = {
          ...chat.chat_info,
          show_quiz_unlock: {
            ...currentShowQuizUnlock,
            [isUser1 ? 'user_1' : 'user_2']: true,
          },
        };
        const updatedChat = await updateChatInfo(chat.id, updatedChatInfo);
        // Update with the server response to ensure consistency
        setChat(updatedChat);
      } catch (error) {
        console.error('Error updating chat info:', error);
      }
    }
  }

  const renderMessage = ({ item, isSameUser }: { item: Message, isSameUser: boolean }) => {

    return (
      <View style={StyleSheet.flatten([styles.messageContainer, {
        justifyContent: item.user_id === user?.id ? 'flex-end' : 'flex-start',
        marginBottom: isSameUser ? 8 : 12,
      }])}>
        {item.user_id === user?.id && (
          <View style={styles.timeTextContainer}>
            <Text style={styles.timeText}>{formatMessageTime(item.created_at)}</Text>
          </View>
        )}
        <View style={StyleSheet.flatten([styles.messageBubble, { 
          backgroundColor: (item.user_id === user?.id ? colors.primary + 'A0' : colors.textSecondary + '40'),
        }])}>
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

  const renderFirstTimeTip = () => {
    if (firstTimeTipStep === 1) {
      return <Text style={styles.tipText}>在一天之中，只有<Text style={styles.tipHighlight}>下午 6 點</Text>到<Text style={styles.tipHighlight}>午夜 12 點</Text>可以聊天，把握時間了解對方吧！</Text>;
    } else {
      return <View>
        <View style={StyleSheet.flatten([styles.progressBarContainer, { marginTop: 0, marginBottom: 12, height: 6 }])}>
          <View style={StyleSheet.flatten([styles.progressBarLeftContainer, { height: 6 }])}>
            <View style={StyleSheet.flatten([styles.progressBarLeft, {
              width: '100%',
              backgroundColor: (chat?.other_user?.personal_info?.color === colors.background ? colors.text : chat?.other_user?.personal_info?.color) as string,
              shadowColor: (chat?.other_user?.personal_info?.color === colors.background ? colors.text : chat?.other_user?.personal_info?.color) as string,
            }])} />
          </View>
          <View style={StyleSheet.flatten([styles.progressBarRightContainer, { height: 6 }])}>
            <View style={StyleSheet.flatten([styles.progressBarRight, {
              width: '100%',
              backgroundColor: (user?.personal_info?.color === colors.background ? colors.text : user?.personal_info?.color) as string,
              shadowColor: (user?.personal_info?.color === colors.background ? colors.text : user?.personal_info?.color) as string,
            }])} />
          </View>
        </View>
        <Text style={styles.tipText}>小幽靈會持續捕捉你們的<Text style={styles.tipHighlight}>契合度</Text>。隨著話題深入，畫面上方的進度線會逐漸向中間靠攏，直到發動「默契問答」！通過就能解鎖對方的照片嘍！</Text>
      </View>
    }
  };

  const renderAlongsideTip = () => {
    return <Text style={styles.tipText}>點擊頭像看看對方的自介或興趣標籤，也許會發現新話題喔！</Text>;
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
          <Pressable onPress={() => setShowProfileModal(true)} style={StyleSheet.flatten([styles.avatarContainer, { borderColor: themeColor }])}>
            {chat?.other_user?.personal_info?.avatar_url ? (
              <Image
                source={{ uri: chat?.other_user.personal_info.avatar_url as string }}
                style={styles.avatar}
                blurRadius={shouldShowBlur ? PHOTO_BLUR_AMOUNT : 0}
              />
            ) : (
              <View style={StyleSheet.flatten([styles.avatar, { backgroundColor: colors.card }])} />
            )}
            {shouldShowGhost && (
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
                    size={overlaySize || 20}
                    floatingY={0}
                    stroke={themeColor}
                    personality={personality}
                  />
                </View>
              </View>
            )}
          </Pressable>
          <Pressable onPress={() => setShowProfileModal(true)}>
            <Text style={styles.headerTitle}>
              {shouldShowImage 
                ? (chat?.other_user?.personal_info?.real_name as string || chat?.other_user?.username)
                : chat?.other_user?.username}
            </Text>
          </Pressable>
        </View>
        {/* progress bar */}
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarLeftContainer}>
            <Animated.View style={StyleSheet.flatten([styles.progressBarLeft, {
              backgroundColor: (chat?.other_user?.personal_info?.color === colors.background ? colors.text : chat?.other_user?.personal_info?.color) as string,
              shadowColor: (chat?.other_user?.personal_info?.color === colors.background ? colors.text : chat?.other_user?.personal_info?.color) as string,
              width: otherUserProgressAnim.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%'],
              }),
            }])} />
          </View>
          <View style={styles.progressBarRightContainer}>
            <Animated.View style={StyleSheet.flatten([styles.progressBarRight, {
              backgroundColor: (user?.personal_info?.color === colors.background ? colors.text : user?.personal_info?.color) as string,
              shadowColor: (user?.personal_info?.color === colors.background ? colors.text : user?.personal_info?.color) as string,
              width: currentUserProgressAnim.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%'],
              }),
            }])} />
          </View>
        </View>
        {/* quiz message */}
        {((
          chat?.chat_info?.user_1_progress || 0) >= 100 &&
          (chat?.chat_info?.user_2_progress || 0) >= 100 &&
          (isUser1 ? !chat?.chat_info?.user_1_unlocked : !chat?.chat_info?.user_2_unlocked)
        ) && <View style={styles.quizMessageContainer}>
          <Text style={styles.quizMessageText}>默契問答</Text>
          <Animated.View style={{ transform: [{ scale: quizButtonScaleAnim }] }}>
            <Button style={styles.quizMessageButton} onPress={() => router.push(`/quiz?id=${chat?.id}`)}>
              <Text style={styles.quizMessageButtonText}>開始挑戰</Text>
            </Button>
          </Animated.View>
        </View>}
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
          renderItem={(item) => renderMessage({ item: item.item, isSameUser: item.item.user_id === messages[item.index + 1]?.user_id })}
          contentContainerStyle={styles.listContent}
          inverted={false}
          onContentSizeChange={() => flatListRef.current?.scrollToOffset({ offset: 999999, animated: true })}
          // ListFooterComponent={() => <View style={styles.listFooter} />}
        />

        {/* --- INPUT --- */}
        <View style={StyleSheet.flatten([styles.inputContainer, { paddingBottom: isKeyboardVisible ? 12 : 40 }])}>
          <Input
            style={StyleSheet.flatten([styles.inputField])}
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
            style={StyleSheet.flatten([styles.sendButton, { backgroundColor: inputText.trim() ? colors.primary : colors.textSecondary + '40' }])}
          >
            {sending ? (
              <LoadingSpinner size={16} color={colors.background} />
            ) : (
              <Text style={StyleSheet.flatten([styles.sendIcon])}>↑</Text>
            )}
          </Button>
        </View>
      </KeyboardAvoidingView>

      {/* Profile Modal */}
      <ProfileModal
        visible={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        user={chat?.other_user as User}
        shouldShowImage={shouldShowImage}
      />

      {/* First Time Chat Tips */}
      <ChatTips 
        visible={showFirstTimeTips}
        onPress={handleFirstTimeTipPress}
      >
        {renderFirstTimeTip()}
      </ChatTips>

      {/* Alongside Chat Tips */}
      <ChatTips 
        visible={showAlongsideTips}
        onPress={handleAlongsideTipPress}
      >
        {renderAlongsideTip()}
      </ChatTips>

      {/* Mid Reward */}
      <MidReward 
        visible={showMidReward} 
        onClose={handleMidRewardClose}
        user={user as User}
        otherUser={chat?.other_user as User | null}
      />

      {/* Quiz Unlock */}
      <QuizUnlock 
        visible={showQuizUnlock}
        onStartQuiz={handleQuizUnlockStart}
        onClose={handleQuizUnlockClose}
        otherUser={chat?.other_user as User | null}
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
    gap: 4,
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
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
    marginTop: 8,
    width: '100%',
    borderRadius: 4,
    flexDirection: 'row',
    gap: 4,
  },
  progressBarLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 4,
  },
  progressBarLabel: {
    fontSize: 10,
    color: colors.textSecondary + 'A0',
    fontWeight: 'bold',
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
  quizMessageContainer: {
    marginTop: 16,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
  },
  quizMessageText: {
    fontSize: 15,
    color: colors.text,
    fontWeight: 'bold',
  },
  quizMessageButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  quizMessageButtonText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: 'bold',
  },

  listContent: {
    flexGrow: 1,
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
    fontSize: 9,
    color: colors.textSecondary + '80',
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
    backgroundColor: colors.primary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sendIcon: {
    fontSize: 24,
    color: colors.text,
  },

  tipText: {
    fontSize: 15,
    lineHeight: 20,
    color: colors.text,
  },
  tipHighlight: {
    fontWeight: 'bold',
    color: colors.primary,
  },
});

export default ChatScreen