import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Dimensions, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/lib/colors';
import { fetchProfiles } from '@/lib/api';
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

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 80;
const CARD_SPACING = 32;

export default function FeedScreen() {
  const [profiles, setProfiles] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [currentProfile, setCurrentProfile] = useState<User | null>(null);

  useEffect(() => {
    loadData();
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
    if (selectedProfile && selectedProfile.id !== currentProfile?.id) {
      setCurrentProfile(selectedProfile);
    }
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
        <Text style={styles.headerDescription}>今日的 10 個小靈魂</Text>
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
          <Button style={[styles.signalButton, { 
            borderColor: currentProfile?.personal_info?.color + '88', 
            // backgroundColor: (currentProfile?.personal_info?.color === colors.background ? colors.primary : currentProfile?.personal_info?.color) + '40' 
          }]} onPress={() => {}}>
            <Text style={[styles.signalButtonText, { color: colors.text }]}>發送訊號給 {currentProfile?.username}</Text>
          </Button>
        </View>
      </View>

      {/* Profile Modal */}
      <ProfileModal
        visible={showProfileModal}
        onClose={handleCloseModal}
        user={selectedUser}
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
    // borderWidth: 1.5,
    backgroundColor: colors.primary + '88',
  },
  signalButtonText: {
    fontSize: 15,
    textAlign: 'center',
    fontWeight: 'bold',
    color: colors.text,
    letterSpacing: 1.5,
  },
});