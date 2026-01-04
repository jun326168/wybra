import { View, Text, StyleSheet, Pressable, ScrollView, Alert, TextInput, KeyboardAvoidingView, Platform } from 'react-native'
import React, { useState, useEffect } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors } from '@/lib/colors'
import Button from '@/components/ui/button'
import BottomSheetModal from '@/components/ui/bottom-sheet-modal'
import { useAppContext } from '@/contexts/AppContext'
import { COLOR_OPTIONS, INTEREST_TAGS, LOOKING_FOR_OPTIONS } from '@/lib/setup'
import LoadingSpinner from '@/svgs/spinner'
import { updateUserProfile } from '@/lib/api'
import { useRouter } from 'expo-router'
import LogoIcon from '@/svgs/logo'

const PreferenceSettingsScreen = () => {
  const { user, setUser } = useAppContext();
  const router = useRouter();

  // Form states
  const [lookingFor, setLookingFor] = useState<string | null>(
    (user?.personal_info?.looking_for as string | undefined) || null
  );
  const [selectedInterests, setSelectedInterests] = useState<string[]>(
    (user?.personal_info?.interests as string[] | undefined) || []
  );
  const [customTagInput, setCustomTagInput] = useState<string>('#');
  const [customTags, setCustomTags] = useState<string[]>([]);
  const [selectedColor, setSelectedColor] = useState<string>(
    (user?.personal_info?.color as string | undefined) || colors.background
  );

  // Modal states
  const [showLookingForModal, setShowLookingForModal] = useState(false);

  const [loading, setLoading] = useState(false);

  // Initialize custom tags from existing interests
  useEffect(() => {
    const predefinedIds = INTEREST_TAGS.map(tag => tag.id);
    const customInterests = selectedInterests.filter(interest => 
      !predefinedIds.includes(interest) && interest.startsWith('#')
    );
    setCustomTags(customInterests);
  }, []);

  const toggleInterest = (interestId: string) => {
    setSelectedInterests(prev =>
      prev.includes(interestId)
        ? prev.filter(id => id !== interestId)
        : [...prev, interestId]
    );
  };

  const handleCustomTagInput = (text: string) => {
    // Always ensure it starts with #
    if (!text.startsWith('#')) {
      text = '#' + text;
    }
    
    setCustomTagInput(text);

    // Check if user pressed space and tag is not just #
    if (text.endsWith(' ') && text.trim().length > 1) {
      const tag = text.trim();
      if (!customTags.includes(tag) && !selectedInterests.includes(tag)) {
        setCustomTags(prev => [...prev, tag]);
        setSelectedInterests(prev => [...prev, tag]);
      }
      setCustomTagInput('#');
    }
  };

  const handleCustomTagEndEditing = () => {
    const tag = customTagInput.trim();
    if (tag.length > 1 && !customTags.includes(tag) && !selectedInterests.includes(tag)) {
      setCustomTags(prev => [...prev, tag]);
      setSelectedInterests(prev => [...prev, tag]);
    }
    setCustomTagInput('#');
  };

  const removeCustomTag = (tag: string) => {
    setCustomTags(prev => prev.filter(t => t !== tag));
    setSelectedInterests(prev => prev.filter(t => t !== tag));
  };

  const handleSave = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const updatedUser = await updateUserProfile(user.id, {
        personal_info: {
          ...user.personal_info,
          looking_for: lookingFor || undefined,
          interests: selectedInterests.length > 0 ? selectedInterests : undefined,
          color: selectedColor,
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

  return (
    <>
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <Button onPress={() => router.back()} style={styles.cancelButton}>
            <Text style={styles.cancelButtonText}>取消</Text>
          </Button>
          <Text style={styles.title}>偏好設定</Text>
          <Button onPress={handleSave} disabled={loading || !lookingFor || selectedInterests.length === 0} style={styles.saveButton}>
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
            {/* Looking For */}
            <View style={styles.section}>
              <Text style={styles.inputLabel}>訊號</Text>
              <Pressable onPress={() => !loading && setShowLookingForModal(true)}>
                <View style={styles.selectButton}>
                  <Text style={[styles.selectButtonText, !lookingFor && styles.selectButtonPlaceholder]}>
                    {lookingFor ? LOOKING_FOR_OPTIONS.find(opt => opt.value === lookingFor)?.label : '你在尋找什麼？'}
                  </Text>
                </View>
              </Pressable>
            </View>

            {/* Interests */}
            <View style={styles.section}>
              <Text style={styles.inputLabel}>我的 Vibe</Text>
              
              {/* Custom Tag Input */}
              <View style={styles.customTagInputContainer}>
                <TextInput
                  value={customTagInput}
                  onChangeText={handleCustomTagInput}
                  placeholder="#自訂"
                  placeholderTextColor={colors.textSecondary}
                  style={styles.customTagTextInput}
                  editable={!loading}
                  onEndEditing={handleCustomTagEndEditing}
                />
              </View>

              <View style={styles.interestsGrid}>
                {/* Custom Tags First */}
                {customTags.map((tag) => (
                  <Pressable
                    key={tag}
                    onPress={() => removeCustomTag(tag)}
                    style={[
                      styles.interestTag,
                      styles.interestTagSelected,
                      styles.customInterestTag
                    ]}
                  >
                    <Text style={[
                      styles.interestTagText,
                      styles.interestTagTextSelected
                    ]}>
                      {tag}
                    </Text>
                  </Pressable>
                ))}

                {/* Predefined Tags */}
                {INTEREST_TAGS.map((interest) => (
                  <Pressable
                    key={interest.id}
                    onPress={() => toggleInterest(interest.id)}
                    style={[
                      styles.interestTag,
                      selectedInterests.includes(interest.id) && styles.interestTagSelected
                    ]}
                  >
                    <Text style={[
                      styles.interestTagText,
                      selectedInterests.includes(interest.id) && styles.interestTagTextSelected
                    ]}>
                      {interest.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
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

      {/* Looking For Modal */}
      <BottomSheetModal
        visible={showLookingForModal}
        onClose={() => setShowLookingForModal(false)}
        containerStyle={styles.modalContainer}
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>你在尋找什麼？</Text>
          <ScrollView style={styles.optionsList} showsVerticalScrollIndicator={false}>
            {LOOKING_FOR_OPTIONS.map((option) => (
              <Button
                key={option.value}
                onPress={() => {
                  setLookingFor(option.value);
                  setShowLookingForModal(false);
                }}
                style={[
                  styles.option,
                  lookingFor === option.value && styles.optionSelected
                ]}
              >
                <View style={styles.optionContent}>
                  <Text style={[
                    styles.optionText,
                    lookingFor === option.value && styles.optionTextSelected
                  ]}>
                    {option.label}
                  </Text>
                  {option.description && (
                    <Text style={[
                      styles.optionDescription,
                      lookingFor === option.value && styles.optionDescriptionSelected
                    ]}>
                      {option.description}
                    </Text>
                  )}
                </View>
              </Button>
            ))}
          </ScrollView>
        </View>
      </BottomSheetModal>
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
  selectButton: {
    width: '100%',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.border,
    minHeight: 52,
    justifyContent: 'center',
  },
  selectButtonText: {
    fontSize: 16,
    color: colors.text,
  },
  selectButtonPlaceholder: {
    color: colors.textSecondary,
  },
  interestsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  interestTag: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.border,
  },
  interestTagSelected: {
    borderColor: colors.primary,
  },
  interestTagText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  interestTagTextSelected: {
    color: colors.primary,
  },
  customTagInputContainer: {
    width: '100%',
    marginBottom: 12,
  },
  customTagTextInput: {
    width: '100%',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.border,
    fontSize: 16,
    color: colors.text,
  },
  customInterestTag: {
    opacity: 1,
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
  modalContainer: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
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
  optionsList: {
    maxHeight: 400,
  },
  option: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.border,
    marginBottom: 12,
    alignItems: 'center',
  },
  optionSelected: {
    borderColor: colors.primary,
  },
  optionContent: {
    alignItems: 'center',
  },
  optionText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  optionTextSelected: {
    color: colors.primary,
  },
  optionDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  optionDescriptionSelected: {
    color: colors.primary,
    opacity: 0.8,
  },
});

export default PreferenceSettingsScreen

