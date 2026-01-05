import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert, FlatList, Dimensions, Image } from 'react-native'
import React, { useState, useRef } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors } from '@/lib/colors'
import Button from '@/components/ui/button'
import { useAppContext } from '@/contexts/AppContext'
import { COLOR_OPTIONS, GENERATION_OPTIONS, getGeneration, INTEREST_TAGS, MBTI_OPTIONS, PHOTO_BLUR_AMOUNT } from '@/lib/setup'
import LoadingSpinner from '@/svgs/spinner'
import { updateUserProfile } from '@/lib/api'
import { useRouter } from 'expo-router'
import LogoIcon from '@/svgs/logo'

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 56;
const CARD_SPACING = 56;

const TEMPLATE_OPTIONS = [
  {
    id: 'classic',
    label: 'Classic',
  },
  {
    id: 'headline',
    label: 'Headline',
  },
  {
    id: 'structure',
    label: 'Structure',
  },
  {
    id: 'essence',
    label: 'Essence',
  },
  {
    id: 'avant',
    label: 'Avant',
  },
];

// Template Card Components
const ClassicCard = ({ user, themeColor }: { user: any, themeColor: string }) => {
  
  const generation = getGeneration(new Date(user.personal_info.birthday).getFullYear());
  const mbtiTag = user.personal_info.mbti === 'UNKNOWN' ? '' : '#' + MBTI_OPTIONS.find(option => option.value === user.personal_info.mbti)?.label + ' ';
  let isDefault = themeColor === colors.background;

  if (isDefault) {
    themeColor = colors.text;
  }

  return (
    <View style={[styles.templateCard, styles.classicCard, { shadowColor: themeColor }]}>
      {/* Left line */}
      <View style={[styles.classicLeftLine, { backgroundColor: themeColor + '88' }]} />

      {/* Content */}
      <View style={styles.classicContentContainer}>
        <View style={styles.classicContentHeader}>
          {/* avatar */}
          <View style={[styles.classicContentAvatarContainer, { borderColor: themeColor }]}>
            <Image source={{ uri: user.personal_info.avatar_url }} style={styles.classicContentAvatar} blurRadius={PHOTO_BLUR_AMOUNT} />
            <View style={styles.classicContentAvatarOverlay}>
              <LogoIcon size={28} floatingY={0} stroke={isDefault ? colors.background : themeColor} />
            </View>
          </View>
          {/* gen */}
          <View style={[styles.classicContentGenerationContainer]}>
            <Text style={[styles.classicContentGenerationText, { color: themeColor }]}>{GENERATION_OPTIONS.find(option => option.value === generation)?.label}</Text>
          </View>
        </View>
        <View style={styles.classicContentHeading}>
          <Text style={[styles.classicContentHeadingText, { color: themeColor }]}>{user.username}</Text>
        </View>
        <View style={styles.classicContentBody}>
          <Text style={styles.classicContentBodyText} numberOfLines={6}>{user.personal_info.bio}</Text>
        </View>
        <View style={styles.classicContentBody}>
          <Text style={styles.classicContentBodyText}>我所在的城市：</Text>
          <Text style={styles.classicContentBodyText} numberOfLines={2}>{'我最喜歡...\n'}{user.personal_info.custom_question.love}</Text>
          <Text style={styles.classicContentBodyText} numberOfLines={2}>{'我最討厭...\n'}{user.personal_info.custom_question.hate}</Text>
        </View>
        <View style={styles.classicContentBody}>
          <Text style={styles.classicContentBodyText} numberOfLines={2}>{mbtiTag}{user.personal_info.interests.map((i: string) => i.startsWith('#') ? i : INTEREST_TAGS.find(tag => tag.id === i)?.label).join(' ')}</Text>
        </View>
      </View>
    </View>
  );
};

const HeadlineCard = ({ user, themeColor }: { user: any, themeColor: string }) => (
  <View style={[styles.templateCard, { borderColor: themeColor }]}>

  </View>
);

const StructureCard = ({ user, themeColor }: { user: any, themeColor: string }) => (
  <View style={[styles.templateCard, { backgroundColor: '#0A0A0A', borderColor: themeColor }]}>

  </View>
);

const EssenceCard = ({ user, themeColor }: { user: any, themeColor: string }) => (
  <View style={[styles.templateCard, { backgroundColor: '#F5F5F0' }]}>

  </View>
);

const AvantCard = ({ user, themeColor }: { user: any, themeColor: string }) => (
  <View style={[styles.templateCard, { borderColor: themeColor }]}>

  </View>
);

const PreferenceSettingsScreen = () => {
  const { user, setUser } = useAppContext();
  const router = useRouter();

  // Form states
  const [selectedColor, setSelectedColor] = useState<string>(
    (user?.personal_info?.color as string | undefined) || colors.background
  );

  const [selectedTemplate, setSelectedTemplate] = useState<string>(
    (user?.personal_info as any)?.template || 'zine'
  );

  const [loading, setLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const handleSave = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const updatedUser = await updateUserProfile(user.id, {
        personal_info: {
          ...user.personal_info,
          color: selectedColor,
          template: selectedTemplate,
        }
      });
      setUser(updatedUser);
      router.back();
    } catch (error: any) {
      console.error('Save error:', error);
      Alert.alert('儲存失敗', error.message || '無法儲存偏好設定');
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / (CARD_WIDTH + CARD_SPACING));
    const template = TEMPLATE_OPTIONS[index];
    if (template && template.id !== selectedTemplate) {
      setSelectedTemplate(template.id);
    }
  };

  const renderTemplateCard = ({ item, index }: { item: typeof TEMPLATE_OPTIONS[0], index: number }) => {
    let TemplateComponent;
    switch (item.id) {
      case 'classic':
        TemplateComponent = <ClassicCard user={user} themeColor={selectedColor} />;
        break;
      case 'headline':
        TemplateComponent = <HeadlineCard user={user} themeColor={selectedColor} />;
        break;
      case 'structure':
        TemplateComponent = <StructureCard user={user} themeColor={selectedColor} />;
        break;
      case 'essence':
        TemplateComponent = <EssenceCard user={user} themeColor={selectedColor} />;
        break;
      case 'avant':
        TemplateComponent = <AvantCard user={user} themeColor={selectedColor} />;
        break;
      default:
        TemplateComponent = <ClassicCard user={user} themeColor={selectedColor} />;
    }

    return (
      <View style={{ width: CARD_WIDTH }}>
        <View>
          {TemplateComponent}
          <View style={styles.templateInfo}>
            <Text style={styles.templateLabel}>{item.label}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <>
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <Button onPress={() => router.back()} style={styles.cancelButton}>
            <Text style={styles.cancelButtonText}>取消</Text>
          </Button>
          <Text style={styles.title}>主題設定</Text>
          <Button onPress={handleSave} disabled={loading} style={styles.saveButton}>
            {loading ? (
              <LoadingSpinner size={16} color={colors.primary} strokeWidth={3} />
            ) : (
              <Text style={styles.saveButtonText}>儲存</Text>
            )}
          </Button>
        </View>

        {/* Content */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
        >
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Template Gallery */}
            <View style={styles.section}>
              <Text style={styles.inputLabel}>卡片樣式</Text>
              <Text style={styles.colorDescription}>選擇你的展示風格</Text>

              <FlatList
                ref={flatListRef}
                data={TEMPLATE_OPTIONS}
                renderItem={renderTemplateCard}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                snapToInterval={CARD_WIDTH + CARD_SPACING}
                decelerationRate="fast"
                contentContainerStyle={{
                  gap: CARD_SPACING,
                  paddingVertical: 20,
                  paddingHorizontal: 8,
                }}
                onMomentumScrollEnd={handleTemplateScroll}
                getItemLayout={(_, index) => ({
                  length: CARD_WIDTH + CARD_SPACING,
                  offset: (CARD_WIDTH + CARD_SPACING) * index,
                  index,
                })}
                initialScrollIndex={Math.max(0, TEMPLATE_OPTIONS.findIndex(t => t.id === selectedTemplate))}
              />
            </View>

            {/* Color Picker */}
            <View style={styles.section}>
              <Text style={styles.inputLabel}>主題色</Text>
              <Text style={styles.colorDescription}>選擇你的個人色彩</Text>

              {/* Preview */}
              <View style={styles.colorPreviewContainer}>
                <View style={styles.colorPreview}>
                  <LogoIcon size={60} floatingY={0} stroke={selectedColor} />
                </View>
              </View>

              {/* Color Grid */}
              <View style={styles.colorGrid}>
                {COLOR_OPTIONS.map((color) => (
                  <Button
                    key={color.id}
                    onPress={() => setSelectedColor(color.value)}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color.value },
                      selectedColor === color.value && styles.colorOptionSelected
                    ]}
                  >
                    {selectedColor === color.value && (
                      <View style={styles.colorCheckmark}>
                        <Text style={styles.colorCheckmarkText}>✓</Text>
                      </View>
                    )}
                  </Button>
                ))}
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
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
  cancelButton: {
    paddingVertical: 8,
    paddingRight: 12,
  },
  cancelButtonText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  saveButton: {
    paddingVertical: 8,
    paddingLeft: 12,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    paddingBottom: 80,
    gap: 32,
  },
  section: {
    gap: 10,
  },
  inputLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  colorDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: -4,
  },
  colorPreviewContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  colorPreview: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  colorOption: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorOptionSelected: {
    borderColor: colors.text,
    borderWidth: 2,
  },
  colorCheckmark: {
    width: '100%',
    height: '100%',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorCheckmarkText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  // Template Styles
  templateCard: {
    width: '100%',
    aspectRatio: 0.7,
    backgroundColor: colors.card,
    borderRadius: 16,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  templateInfo: {
    alignItems: 'center',
    marginTop: 12,
    gap: 4,
  },
  templateLabel: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  // classic
  classicCard: {
    padding: 24,
    backgroundColor: colors.card,
    flexDirection: 'row',
  },
  classicLeftLine: {
    width: 1.5,
    height: '100%',
    marginRight: 20,
  },
  classicContentContainer: {
    paddingVertical: 8,
    flex: 1,
    gap: 8,
  },
  classicContentHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  classicContentGenerationContainer: {
  },
  classicContentGenerationText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontFamily: 'Merriweather-Italic',
  },
  classicContentAvatarContainer: {
    position: 'relative',
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    borderWidth: 2,
  },
  classicContentAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
  },
  classicContentAvatarOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  classicContentHeading: {
    // Heading container
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  classicContentHeadingText: {
    fontSize: 24,
    fontFamily: 'Merriweather-Bold',
  },
  classicContentBody: {
    // Body container
    marginTop: 4,
  },
  classicContentBodyTitle: {
    fontSize: 16,
    letterSpacing: 0.5,
    color: colors.text,
    marginTop: 4,
    // fontWeight: '200'
  },
  classicContentBodyText: {
    fontSize: 16,
    letterSpacing: 0.5,
    color: colors.text,
    lineHeight: 19,
    fontWeight: '200',
    marginTop: 4,
  },
});

export default PreferenceSettingsScreen

