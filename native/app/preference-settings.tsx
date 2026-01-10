import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert, FlatList, Dimensions } from 'react-native'
import React, { useState, useRef } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors } from '@/lib/colors'
import Button from '@/components/ui/button'
import { useAppContext } from '@/contexts/AppContext'
import { COLOR_OPTIONS } from '@/lib/setup'
import LoadingSpinner from '@/svgs/spinner'
import { updateUserProfile } from '@/lib/api'
import { useRouter } from 'expo-router'
import LogoIcon, { LogoPersonality } from '@/svgs/logo'
import { ClassicCard, QuoteCard, ZineCard, PolaroidCard, TicketCard, TEMPLATE_OPTIONS } from '@/components/card-templates/template-cards'

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 56;
const CARD_SPACING = 56;

const PERSONALITY_OPTIONS: { id: LogoPersonality; label: string }[] = [
  { id: 'headphone', label: '耳機' },
  { id: 'flower', label: '花朵' },
  // { id: 'cloud', label: '雲朵' },
  // { id: 'tophat', label: '高帽' },
  { id: 'glasses', label: '眼鏡' },
  { id: 'beanie', label: '毛帽' },
  // { id: 'sprout', label: '嫩芽' },
];

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

  const [selectedPersonality, setSelectedPersonality] = useState<LogoPersonality>(
    (user?.personal_info?.personality as LogoPersonality) || 'headphone'
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
          personality: selectedPersonality,
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
      case 'quote':
        TemplateComponent = <QuoteCard user={user} themeColor={selectedColor} />;
        break;
      case 'zine':
        TemplateComponent = <ZineCard user={user} themeColor={selectedColor} />;
        break;
      case 'polaroid':
        // Now maps to Polaroid
        TemplateComponent = <PolaroidCard user={user} themeColor={selectedColor} />;
        break;
      case 'ticket':
        // Now maps to Ticket
        TemplateComponent = <TicketCard user={user} themeColor={selectedColor} />;
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
                  <LogoIcon size={60} floatingY={0} stroke={selectedColor} personality={selectedPersonality} />
                </View>
              </View>

              {/* Color Grid */}
              <View style={styles.colorGrid}>
                {COLOR_OPTIONS.map((color) => (
                  <Button
                    key={color.id}
                    onPress={() => setSelectedColor(color.value)}
                    style={StyleSheet.flatten([
                      styles.colorOption,
                      { backgroundColor: color.value },
                      selectedColor === color.value && styles.colorOptionSelected
                    ])}
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

            {/* Personality Picker */}
            <View style={styles.section}>
              <Text style={styles.inputLabel}>造型</Text>
              <Text style={styles.colorDescription}>選擇你的小配件</Text>

              {/* Preview */}
              <View style={styles.colorPreviewContainer}>
                <View style={styles.colorPreview}>
                  <LogoIcon size={60} floatingY={0} stroke={selectedColor} personality={selectedPersonality} />
                </View>
              </View>

              {/* Personality Grid */}
              <View style={styles.colorGrid}>
                {PERSONALITY_OPTIONS.map((personality) => (
                  <Button
                    key={personality.id}
                    onPress={() => setSelectedPersonality(personality.id)}
                    style={StyleSheet.flatten([
                      styles.personalityOption,
                      selectedPersonality === personality.id && styles.personalityOptionSelected
                    ])}
                  >
                    <LogoIcon 
                      size={40} 
                      floatingY={0} 
                      stroke={selectedColor} 
                      personality={personality.id}
                    />
                    {selectedPersonality === personality.id && (
                      <View style={styles.personalityCheckmark}>
                        <Text style={styles.personalityCheckmarkText}>✓</Text>
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
    borderWidth: 1,
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
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorOptionSelected: {
    borderColor: colors.text,
    borderWidth: 1.5,
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
  personalityOption: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.card,
    position: 'relative',
  },
  personalityOptionSelected: {
    borderColor: colors.text,
    borderWidth: 1.5,
  },
  personalityCheckmark: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  personalityCheckmarkText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.text,
  },
});

export default PreferenceSettingsScreen

