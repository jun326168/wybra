import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Dimensions, ScrollView, Platform, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/lib/colors';
import { createChat, fetchProfiles } from '@/lib/api';
import LoadingSpinner from '@/svgs/spinner';
import LogoIcon from '@/svgs/logo';
import {
  ClassicCard,
  QuoteCard,
  ZineCard,
  PolaroidCard,
  TicketCard
} from '@/components/card-templates/template-cards';
import type { User } from '@/lib/types';
import Button from '@/components/ui/button';
import ProfileModal from '@/components/ui/profile-modal';
import BottomSheetModal from '@/components/ui/bottom-sheet-modal';
import Input from '@/components/ui/input';
import { INTEREST_TAGS, MBTI_OPTIONS } from '@/lib/setup';
import { router } from 'expo-router';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 80;
const CARD_SPACING = 32;

export default function FeedScreen() {
  const [profiles, setProfiles] = useState<(User & { has_chat?: boolean })[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<(User & { has_chat?: boolean }) | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [currentProfile, setCurrentProfile] = useState<(User & { has_chat?: boolean }) | null>(null);

  const [showSendSignalModal, setShowSendSignalModal] = useState(false);
  const [message, setMessage] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isCreatingChat, setIsCreatingChat] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

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

  const loadData = async () => {
    try {
      const data = await fetchProfiles();
      setProfiles(data.slice(0, 10));
      setCurrentProfile(data[0]);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCardPress = (user: User) => {
    setSelectedUser(user);
    setTimeout(() => {
      setShowProfileModal(true);
    }, 300);
  };

  const handleCloseModal = () => {
    setShowProfileModal(false);
    setTimeout(() => {
      setSelectedUser(null);
    }, 300);
  };

  const handleScrollEnd = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / (CARD_WIDTH + CARD_SPACING));
    const selectedProfile = profiles[index];
    if (selectedProfile && selectedProfile.id !== currentProfile?.id && !showSendSignalModal) {
      setCurrentProfile(selectedProfile);
    }
  };

  // Send message and create chat
  const handleSendSignal = async () => {
    if (!currentProfile?.id) return;

    setIsCreatingChat(true);
    Keyboard.dismiss();
    await createChat(currentProfile.id, message);
    setIsCreatingChat(false);
    setShowSendSignalModal(false);
    setProfiles(profiles.map(profile => profile.id === currentProfile.id ? { ...profile, has_chat: true } : profile));
    setCurrentProfile({ ...currentProfile, has_chat: true });
    setTimeout(() => {
      router.push(`/chat?other_user_id=${currentProfile.id}`);
    }, 100);
  };

  const renderItem = ({ item }: { item: User }) => {
    const templateId = item.personal_info?.template || 'classic';
    const themeColor = item.personal_info?.color || colors.text;

    let TemplateComponent;
    switch (templateId) {
      case 'classic': TemplateComponent = ClassicCard; break;
      case 'quote': TemplateComponent = QuoteCard; break;
      case 'zine': TemplateComponent = ZineCard; break;
      case 'polaroid': TemplateComponent = PolaroidCard; break;
      case 'ticket': TemplateComponent = TicketCard; break;
      default: TemplateComponent = ClassicCard;
    }

    return (
      <View style={{ width: CARD_WIDTH }}>
        <View>
          <View>
            <Button onPress={() => handleCardPress(item)}>
              <TemplateComponent user={item} themeColor={themeColor} />
            </Button>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <LoadingSpinner size={24} color={colors.primary} strokeWidth={3} />
        <Text style={styles.loadingText}>正在尋找...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <LogoIcon size={24} floatingY={2} />
          <Text style={styles.headerTitle}>Wybra</Text>
        </View>
      </View>

      <View style={styles.headerDescriptionContainer}>
        <Text style={styles.headerDescription}>今日的 {profiles.length} 個小幽靈</Text>
      </View>

      <View style={styles.feedContainer}>
        <FlatList
          data={profiles}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={CARD_WIDTH + CARD_SPACING}
          decelerationRate="fast"
          contentContainerStyle={{
            gap: CARD_SPACING,
            paddingVertical: 20,
            paddingHorizontal: 40,
          }}
          onMomentumScrollEnd={handleScrollEnd}
          disableIntervalMomentum={true}
        />
        <View style={styles.actionContainer}>
          <Button style={StyleSheet.flatten([styles.signalButton, {
            borderColor: (currentProfile?.personal_info?.color === colors.background ? colors.textSecondary : currentProfile?.personal_info?.color) + '88',
            backgroundColor: (currentProfile?.personal_info?.color === colors.background ? colors.textSecondary : currentProfile?.personal_info?.color) + '40'
          }])} onPress={() => {
            if (currentProfile?.has_chat) {
              router.push(`/chat?other_user_id=${currentProfile.id}`);
            } else {
              setMessage('');
              setShowSendSignalModal(true);
            }
          }}>
            <Text style={StyleSheet.flatten([styles.signalButtonText, { color: currentProfile?.personal_info?.color === colors.background ? colors.textSecondary : currentProfile?.personal_info?.color }])}>
              {currentProfile?.has_chat ? '繼續聊天' : '開啟對話'}
            </Text>
          </Button>
        </View>
      </View>

      {/* Profile Modal */}
      <ProfileModal
        visible={showProfileModal}
        onClose={handleCloseModal}
        user={selectedUser}
      />

      {/* Send Signal Modal */}
      <BottomSheetModal
        visible={showSendSignalModal}
        containerStyle={{
          ...styles.modalContainer,
          ...(keyboardHeight > 0 && { marginBottom: keyboardHeight - 28 })
        }}
        onClose={() => {
          Keyboard.dismiss();
          setShowSendSignalModal(false);
        }}
      >
        <View>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>和 {currentProfile?.username} 開啟對話</Text>

            {/* Message Input */}
            <Input
              value={message}
              onChangeText={setMessage}
              placeholder="從對方的自介找話題，或是簡單說聲 Hi 吧！"
              multiline
              style={StyleSheet.flatten([styles.messageInput, { borderColor: (currentProfile?.personal_info?.color === colors.background ? colors.text : currentProfile?.personal_info?.color) + '80' }])}
            />

            {/* Interest Tags Horizontal Scroll */}
            {/* <View style={styles.interestSection}>
              <Text style={styles.interestLabel}>懶人標籤</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.interestScrollContent}
                style={styles.interestScroll}
                nestedScrollEnabled
              >
                <Button style={[styles.interestTag, {
                  borderColor: (currentProfile?.personal_info?.color === colors.background ? colors.text : currentProfile?.personal_info?.color) + '40',
                }]} onPress={() => {
                  setMessage(message === '嗨！' ? '哈囉！' : (message === '哈囉！' ? '你好！' : '嗨！'));
                }}>
                  <Text style={[styles.interestTagText, {
                    color: (currentProfile?.personal_info?.color === colors.background ? colors.text : currentProfile?.personal_info?.color),
                  }]}>打個招呼 👋🏼</Text>
                </Button>
                {(currentProfile?.personal_info?.mbti !== 'UNKNOWN') && <Button style={[styles.interestTag, {
                  borderColor: (currentProfile?.personal_info?.color === colors.background ? colors.text : currentProfile?.personal_info?.color) + '40',
                }]} onPress={() => {
                  const mbti = MBTI_OPTIONS.find(option => option.value === currentProfile?.personal_info?.mbti)?.value;
                  setMessage(`嗨！我注意到你是 ${mbti}`);
                }}>
                  <Text style={[styles.interestTagText, {
                    color: (currentProfile?.personal_info?.color === colors.background ? colors.text : currentProfile?.personal_info?.color),
                  }]}>{MBTI_OPTIONS.find(option => option.value === currentProfile?.personal_info?.mbti)?.value}</Text>
                </Button>}
                {currentProfile?.personal_info?.interests.map((interest) => {
                  return (
                    <Button
                      key={interest}
                      onPress={() => {
                        setMessage(`嗨！我注意到你喜歏 ${(interest.startsWith('#') ? interest : INTEREST_TAGS.find(tag => tag.id === interest)?.label || interest).replace('#', '')}`);
                      }}
                      style={[
                        styles.interestTag,
                        {
                          borderColor: (currentProfile?.personal_info?.color === colors.background ? colors.text : currentProfile?.personal_info?.color) + '40',
                        }
                      ]}
                    >
                      <Text
                        style={[
                          styles.interestTagText,
                          {
                            color: (currentProfile?.personal_info?.color === colors.background ? colors.text : currentProfile?.personal_info?.color),
                            fontWeight: 'bold',
                          }
                        ]}
                      >
                        {interest.startsWith('#') ? interest : INTEREST_TAGS.find(tag => tag.id === interest)?.label}
                      </Text>
                    </Button>
                  );
                })}
              </ScrollView>
            </View> */}

            {/* Send Button */}
            <Button
              disabled={message.trim() === '' || isCreatingChat}
              onPress={handleSendSignal}
              style={StyleSheet.flatten([
                styles.sendButton,
                {
                  backgroundColor: (currentProfile?.personal_info?.color === colors.background ? colors.textSecondary : currentProfile?.personal_info?.color) + '40',
                  borderColor: (currentProfile?.personal_info?.color === colors.background ? colors.textSecondary : currentProfile?.personal_info?.color),
                }
              ])}
            >
              {isCreatingChat ? <LoadingSpinner size={20} color={(currentProfile?.personal_info?.color === colors.background ? colors.textSecondary : currentProfile?.personal_info?.color)} strokeWidth={3} /> : <Text style={StyleSheet.flatten([styles.sendButtonText, { color: (currentProfile?.personal_info?.color === colors.background ? colors.textSecondary : currentProfile?.personal_info?.color) }])}>發送</Text>}
            </Button>
          </View>
        </View>
      </BottomSheetModal>
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
    backgroundColor: colors.background,
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
  headerDescriptionContainer: {
    paddingHorizontal: 28,
  },
  headerDescription: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    letterSpacing: 1,
  },
  feedContainer: {
    marginTop: 8,
    justifyContent: 'center',
  },
  actionContainer: {
    marginTop: 24,
    paddingHorizontal: 40,
  },
  signalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.primary + '20',
  },
  signalButtonText: {
    fontSize: 15,
    textAlign: 'center',
    fontWeight: 'bold',
    // color: colors.text,
    color: colors.primary,
    letterSpacing: 1.5,
  },
  modalContainer: {
    backgroundColor: colors.card,
  },
  scrollContent: {
    flexGrow: 1,
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
  messageInput: {
    marginBottom: 20,
    minHeight: 80,
  },
  interestSection: {
    marginBottom: 24,
  },
  interestLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  interestScroll: {
    marginHorizontal: -4,
  },
  interestScrollContent: {
    paddingHorizontal: 4,
    gap: 8,
  },
  interestTag: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  interestTagText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: 'bold',
  },
  sendButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    borderWidth: 1,
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.background,
    letterSpacing: 1,
  },
});