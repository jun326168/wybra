import { View, Text, StyleSheet, Pressable, ScrollView, Alert, TextInput, KeyboardAvoidingView, Platform } from 'react-native'
import { Image } from 'expo-image'
import React, { useState, useEffect } from 'react'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, { useSharedValue, useAnimatedStyle, SharedValue, useAnimatedReaction, runOnJS } from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors } from '@/lib/colors'
import Button from '@/components/ui/button'
import Input from '@/components/ui/input'
import BottomSheetModal from '@/components/ui/bottom-sheet-modal'
import { useAppContext } from '@/contexts/AppContext'
import { MBTI_OPTIONS, GENDER_OPTIONS, ORIENTATION_OPTIONS, INTEREST_TAGS, LOOKING_FOR_OPTIONS } from '@/lib/setup'
import LoadingSpinner from '@/svgs/spinner'
import { updateUserProfile, uploadUserPhoto } from '@/lib/api'
import { useRouter } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import LogoIcon from '@/svgs/logo'

interface GhostDraggableProps {
  ghostX: SharedValue<number>;
  ghostY: SharedValue<number>;
  ghostSize: SharedValue<number>;
  overlayDimensions: { width: number; height: number } | null;
  logoStrokeColor: string | undefined;
}

const GhostDraggable = ({ ghostX, ghostY, ghostSize, overlayDimensions, logoStrokeColor }: GhostDraggableProps) => {
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      startX.value = ghostX.value;
      startY.value = ghostY.value;
    })
    .onUpdate((e) => {
      if (!overlayDimensions) return;
      
      const newX = startX.value + e.translationX;
      const newY = startY.value + e.translationY;
      const currentSize = ghostSize.value;
      
      // Constrain to overlay bounds - ensure ghost doesn't exceed edges
      const maxX = overlayDimensions.width - currentSize;
      const maxY = overlayDimensions.height - currentSize;
      
      ghostX.value = Math.max(0, Math.min(newX, maxX));
      ghostY.value = Math.max(0, Math.min(newY, maxY));
    })
    .onEnd(() => {
      // No additional action needed on end
    });

  const animatedStyle = useAnimatedStyle(() => {
    const currentSize = ghostSize.value;
    return {
      position: 'absolute',
      left: ghostX.value,
      top: ghostY.value,
      width: currentSize,
      height: currentSize,
    };
  });

  // Get current size for LogoIcon (needs to be reactive)
  const [iconSize, setIconSize] = React.useState(92);
  
  // Update icon size when ghostSize changes
  useAnimatedReaction(
    () => ghostSize.value,
    (size) => {
      runOnJS(setIconSize)(Math.max(size, 20));
    }
  );

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View
        style={[
          styles.ghostContainer,
          animatedStyle,
        ]}
      >
        <View style={styles.lockedStateContent}>
          <LogoIcon size={iconSize} floatingY={0} stroke={logoStrokeColor} />
        </View>
      </Animated.View>
    </GestureDetector>
  );
};

const ProfileSettingsScreen = () => {
  const { user, setUser } = useAppContext();
  const router = useRouter();

  const logoStrokeColor = user?.personal_info?.color === colors.background ? colors.textSecondary : (user?.personal_info?.color as string | undefined);

  // Form states
  const [username, setUsername] = useState(user?.username || '');
  const [realName, setRealName] = useState(user?.personal_info?.real_name || '');
  const [mbti, setMbti] = useState<string | null>(
    (user?.personal_info?.mbti as string | undefined) || null
  );
  const [birthday, setBirthday] = useState<string>(
    (user?.personal_info?.birthday as string | undefined) || ''
  );
  const [gender, setGender] = useState<string | null>(
    (user?.personal_info?.gender as string | undefined) || null
  );
  // const [sexualOrientation, setSexualOrientation] = useState<string | null>(
  //   (user?.personal_info?.sexual_orientation as string | undefined) || null
  // );
  const [bio, setBio] = useState<string>(
    (user?.personal_info?.bio as string | undefined) || ''
  );
  // const [lookingFor, setLookingFor] = useState<string | null>(
  //   (user?.personal_info?.looking_for as string | undefined) || null
  // );
  const [customQuestionLove, setCustomQuestionLove] = useState<string>(
    (user?.personal_info?.custom_question as any)?.love || ''
  );
  const [customQuestionHate, setCustomQuestionHate] = useState<string>(
    (user?.personal_info?.custom_question as any)?.hate || ''
  );
  const [selectedInterests, setSelectedInterests] = useState<string[]>(
    (user?.personal_info?.interests as string[] | undefined) || []
  );
  const [customTagInput, setCustomTagInput] = useState<string>('#');
  const [customTags, setCustomTags] = useState<string[]>([]);
  const [photoUri, setPhotoUri] = useState<string | null>(
    (user?.personal_info?.avatar_url as string | undefined) || null
  );
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [overlayDimensions, setOverlayDimensions] = useState<{ width: number; height: number } | null>(null);
  
  // Ghost position (relative to overlay container, starting at center)
  const ghostX = useSharedValue(0);
  const ghostY = useSharedValue(0);
  const ghostSize = useSharedValue(92); // Default size, will be updated
  const baseSize = useSharedValue(92); // Base size (50% of container)
  const scale = useSharedValue(1); // Scale multiplier
  const startScale = useSharedValue(1);

  // Update ghost position when user data or overlay dimensions change
  React.useEffect(() => {
    if (overlayDimensions && user?.personal_info?.ghost_pos) {
      const { width, height } = overlayDimensions;
      const savedGhostPos = user.personal_info.ghost_pos as { x: number; y: number; size: number };
      const containerSize = Math.min(width, height);
      
      // Convert percentages to pixels
      const size = (savedGhostPos.size / 100) * containerSize;
      const x = (savedGhostPos.x / 100) * width;
      const y = (savedGhostPos.y / 100) * height;
      
      baseSize.value = containerSize * 0.5; // Base is always 50%
      ghostSize.value = size;
      scale.value = size / (containerSize * 0.5); // Calculate scale from base
      ghostX.value = Math.max(0, Math.min(x, width - size));
      ghostY.value = Math.max(0, Math.min(y, height - size));
    } else if (overlayDimensions && !user?.personal_info?.ghost_pos) {
      // Default: center, 50% size
      const { width, height } = overlayDimensions;
      const containerSize = Math.min(width, height);
      const size = containerSize * 0.5;
      
      baseSize.value = size;
      ghostSize.value = size;
      scale.value = 1;
      ghostX.value = (width - size) / 2;
      ghostY.value = (height - size) / 2;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.personal_info?.ghost_pos, overlayDimensions]);

  // Modal states
  const [showMbtiModal, setShowMbtiModal] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);
  const [showGenderModal, setShowGenderModal] = useState(false);
  // const [showOrientationModal, setShowOrientationModal] = useState(false);
  // const [showLookingForModal, setShowLookingForModal] = useState(false);

  const [loading, setLoading] = useState(false);

  // Initialize custom tags from existing interests
  useEffect(() => {
    const predefinedIds = INTEREST_TAGS.map(tag => tag.id);
    const customInterests = selectedInterests.filter(interest => 
      !predefinedIds.includes(interest) && interest.startsWith('#')
    );
    setCustomTags(customInterests);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Date picker logic
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 50 }, (_, i) => currentYear - 18 - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  const getDaysInMonth = (year: number, month: number): number => {
    return new Date(year, month, 0).getDate();
  };

  const getValidDays = (year: number | null, month: number | null): number[] => {
    if (!year || !month) return Array.from({ length: 31 }, (_, i) => i + 1);
    const maxDays = getDaysInMonth(year, month);
    return Array.from({ length: maxDays }, (_, i) => i + 1);
  };

  const [selectedYear, setSelectedYear] = useState<number | null>(
    birthday ? parseInt(birthday.split('-')[0]) : null
  );
  const [selectedMonth, setSelectedMonth] = useState<number | null>(
    birthday ? parseInt(birthday.split('-')[1]) : null
  );
  const [selectedDay, setSelectedDay] = useState<number | null>(
    birthday ? parseInt(birthday.split('-')[2]) : null
  );

  const validDays = getValidDays(selectedYear, selectedMonth);

  const handleYearChange = (year: number) => {
    setSelectedYear(year);
    if (selectedMonth && selectedDay) {
      const maxDays = getDaysInMonth(year, selectedMonth);
      if (selectedDay > maxDays) {
        setSelectedDay(maxDays);
      }
    }
  };

  const handleMonthChange = (month: number) => {
    setSelectedMonth(month);
    if (selectedYear && selectedDay) {
      const maxDays = getDaysInMonth(selectedYear, month);
      if (selectedDay > maxDays) {
        setSelectedDay(maxDays);
      }
    }
  };

  const handleDateConfirm = () => {
    if (selectedYear && selectedMonth && selectedDay) {
      const maxDays = getDaysInMonth(selectedYear, selectedMonth);
      const adjustedDay = Math.min(selectedDay, maxDays);

      const dateString = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(adjustedDay).padStart(2, '0')}`;
      setBirthday(dateString);

      if (adjustedDay !== selectedDay) {
        setSelectedDay(adjustedDay);
      }
    }
    setShowDateModal(false);
  };

  const handleMbtiSelect = (selectedMbti: string | null) => {
    setMbti(selectedMbti);
    setShowMbtiModal(false);
  };

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

  const handlePickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert('需要權限', '需要訪問相冊的權限才能上傳照片');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0] && user?.id) {
        setUploadingPhoto(true);
        try {
          const photoUrl = await uploadUserPhoto(user.id, result.assets[0].uri);
          setPhotoUri(photoUrl);

          // Update user immediately with new photo
          const updatedUser = await updateUserProfile(user.id, {
            personal_info: {
              ...user.personal_info,
              avatar_url: photoUrl,
            }
          });
          setUser(updatedUser);
        } catch (error: any) {
          console.error('Upload error:', error);
          Alert.alert('上傳失敗', error.message || '無法上傳照片，請重試');
        } finally {
          setUploadingPhoto(false);
        }
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('錯誤', '無法選擇照片，請重試');
    }
  };

  const handleSave = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      
      // Calculate ghost position as percentages
      let ghostPos = undefined;
      if (overlayDimensions && photoUri) {
        const xPercent = (ghostX.value / overlayDimensions.width) * 100;
        const yPercent = (ghostY.value / overlayDimensions.height) * 100;
        const sizePercent = (ghostSize.value / Math.min(overlayDimensions.width, overlayDimensions.height)) * 100;
        
        ghostPos = {
          x: Math.max(0, Math.min(100, xPercent)),
          y: Math.max(0, Math.min(100, yPercent)),
          size: Math.max(20, Math.min(70, sizePercent)),
        };
      }
      
      const updatedUser = await updateUserProfile(user.id, {
        username,
        personal_info: {
          ...user.personal_info,
          real_name: realName || undefined,
          mbti: mbti || undefined,
          birthday: birthday || undefined,
          gender: gender || undefined,
          // sexual_orientation: sexualOrientation || undefined,
          // looking_for: lookingFor || undefined,
          bio: bio || undefined,
          custom_question: {
            love: customQuestionLove || undefined,
            hate: customQuestionHate || undefined,
          },
          interests: selectedInterests.length > 0 ? selectedInterests : undefined,
          avatar_url: photoUri || undefined,
          ghost_pos: ghostPos,
        }
      });
      setUser(updatedUser);
      router.back();
    } catch (error: any) {
      console.error('Save error:', error);
      Alert.alert('儲存失敗', error.message || '無法儲存個人資料');
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
          <Text style={styles.title}>個人資料</Text>
          <Button onPress={handleSave} disabled={loading || !username || !realName || !birthday || !mbti || !gender /* || !sexualOrientation */} style={styles.saveButton}>
            {loading ? (
              <LoadingSpinner size={16} color={colors.primary} strokeWidth={3} />
            ) : (
              <Text style={styles.saveButtonText}>儲存</Text>
            )}
          </Button>
        </View>

        {/* Content */}
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardAvoidingView}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Photo */}
            <View style={styles.section}>
              <Text style={styles.inputLabel}>相片</Text>
              {photoUri && (
                <Text style={styles.ghostInstructionText}>用雙指縮放和拖曳小幽靈來擋住你的臉</Text>
              )}
              <View style={styles.avatarContainer}>
                {photoUri ? (
                  <View style={styles.avatarPlaceholder}>
                    <View style={styles.avatarImageWrapper}>
                      <Image
                        source={{ uri: photoUri }}
                        style={styles.avatarImage}
                      />
                      <GestureDetector
                        gesture={Gesture.Simultaneous(
                          Gesture.Pinch()
                            .onStart(() => {
                              startScale.value = scale.value;
                            })
                            .onUpdate((e) => {
                              if (!overlayDimensions) return;
                              
                              const newScale = startScale.value * e.scale;
                              
                              // Calculate min and max scale values (20% to 70% of container)
                              const containerMinSize = Math.min(overlayDimensions.width, overlayDimensions.height) * 0.2;
                              const containerMaxSize = Math.min(overlayDimensions.width, overlayDimensions.height) * 0.7;
                              const minScale = containerMinSize / baseSize.value;
                              const maxScale = containerMaxSize / baseSize.value;
                              
                              // Clamp scale to min/max bounds
                              const clampedScale = Math.max(minScale, Math.min(newScale, maxScale));
                              const clampedSize = baseSize.value * clampedScale;
                              
                              scale.value = clampedScale;
                              ghostSize.value = clampedSize;
                              
                              // Adjust position to keep ghost within bounds when scaling
                              const maxX = overlayDimensions.width - clampedSize;
                              const maxY = overlayDimensions.height - clampedSize;
                              
                              ghostX.value = Math.max(0, Math.min(ghostX.value, maxX));
                              ghostY.value = Math.max(0, Math.min(ghostY.value, maxY));
                            })
                        )}
                      >
                        <View 
                          style={styles.blurOverlay}
                          onLayout={(e) => {
                            const { width, height } = e.nativeEvent.layout;
                            setOverlayDimensions({ width, height });
                            // The useEffect will handle updating the ghost position based on user data
                          }}
                        >
                          {uploadingPhoto ? (
                            <LoadingSpinner size={30} color={colors.text} strokeWidth={3} />
                          ) : (
                            <GhostDraggable
                              ghostX={ghostX}
                              ghostY={ghostY}
                              ghostSize={ghostSize}
                              overlayDimensions={overlayDimensions}
                              logoStrokeColor={logoStrokeColor}
                            />
                          )}
                        </View>
                      </GestureDetector>
                    </View>
                  </View>
                ) : (
                  <Pressable
                    onPress={handlePickImage}
                    style={StyleSheet.flatten([styles.avatarPlaceholder, { borderWidth: 1 }])}
                    disabled={uploadingPhoto}
                  >
                    <View style={styles.emptyAvatar}>
                      {uploadingPhoto ? (
                        <LoadingSpinner size={28} color={colors.text} strokeWidth={3} />
                      ) : (
                        <>
                          <LogoIcon size={60} floatingY={0} />
                          <Text style={styles.uploadText}>點擊上傳</Text>
                        </>
                      )}
                    </View>
                  </Pressable>
                )}

                {photoUri && !uploadingPhoto && (
                  <Pressable onPress={handlePickImage} style={styles.reuploadLink}>
                    <Text style={styles.reuploadText}>更換照片</Text>
                  </Pressable>
                )}
              </View>
            </View>

            {/* Username */}
            <View style={styles.section}>
              <Text style={styles.inputLabel}>代號</Text>
              <Input
                value={username}
                placeholder="別透露你的真實身份喔"
                onChangeText={setUsername}
                readOnly
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.inputLabel}>真實姓名</Text>
              <Input
                value={realName}
                placeholder="輸入你的真實姓名"
                onChangeText={setRealName}
                editable={!loading}
              />
            </View>

            {/* Birthday */}
            <View style={styles.section}>
              <Text style={styles.inputLabel}>生日</Text>
              <Pressable onPress={() => !loading && setShowDateModal(true)}>
                <View style={styles.selectButton}>
                  <Text style={StyleSheet.flatten([styles.selectButtonText, !birthday && styles.selectButtonPlaceholder])}>
                    {birthday || '輸入生日'}
                  </Text>
                </View>
              </Pressable>
            </View>

            {/* MBTI */}
            <View style={styles.section}>
              <Text style={styles.inputLabel}>MBTI</Text>
              <Pressable onPress={() => !loading && setShowMbtiModal(true)}>
                <View style={styles.selectButton}>
                  <Text style={StyleSheet.flatten([styles.selectButtonText, !mbti && styles.selectButtonPlaceholder])}>
                    {mbti ? MBTI_OPTIONS.find(opt => opt.value === mbti)?.label || mbti : '選擇你的 MBTI'}
                  </Text>
                </View>
              </Pressable>
            </View>

            {/* Gender */}
            <View style={styles.section}>
              <Text style={styles.inputLabel}>性別</Text>
              <Pressable onPress={() => !loading && setShowGenderModal(true)}>
                <View style={styles.selectButton}>
                  <Text style={StyleSheet.flatten([styles.selectButtonText, !gender && styles.selectButtonPlaceholder])}>
                    {gender ? GENDER_OPTIONS.find(opt => opt.value === gender)?.label : '選擇你的性別'}
                  </Text>
                </View>
              </Pressable>
            </View>

            {/* Sexual Orientation */}
            {/* <View style={styles.section}>
              <Text style={styles.inputLabel}>性向</Text>
              <Pressable onPress={() => !loading && setShowOrientationModal(true)}>
                <View style={styles.selectButton}>
                  <Text style={[styles.selectButtonText, !sexualOrientation && styles.selectButtonPlaceholder]}>
                    {sexualOrientation ? ORIENTATION_OPTIONS.find(opt => opt.value === sexualOrientation)?.label : '選擇你的性向'}
                  </Text>
                </View>
              </Pressable>
            </View> */}

            {/* Looking For */}
            {/* <View style={styles.section}>
              <Text style={styles.inputLabel}>訊號</Text>
              <Pressable onPress={() => !loading && setShowLookingForModal(true)}>
                <View style={styles.selectButton}>
                  <Text style={[styles.selectButtonText, !lookingFor && styles.selectButtonPlaceholder]}>
                    {lookingFor ? LOOKING_FOR_OPTIONS.find(opt => opt.value === lookingFor)?.label : '你在尋找什麼？'}
                  </Text>
                </View>
              </Pressable>
            </View> */}

            {/* Bio */}
            <View style={styles.section}>
              <Text style={styles.inputLabel}>簡介</Text>
              <TextInput
                value={bio}
                placeholder="你最快樂的時候，是什麼樣子？"
                onChangeText={setBio}
                editable={!loading}
                multiline
                numberOfLines={4}
                style={styles.bioInput}
                placeholderTextColor={colors.textSecondary}
                maxLength={150}
              />
              <Text style={StyleSheet.flatten([
                styles.bioCount,
                bio.length < 30 && styles.bioCountWarning
              ])}>
                {bio.length}/150 {bio.length < 30 && `(至少 30 字)`}
              </Text>
            </View>

            {/* Custom Question */}
            <View style={styles.section}>
              <Text style={styles.inputLabel}>在你住的地方，你最喜歡和最討厭什麼？</Text>
              <TextInput
                value={customQuestionLove}
                placeholder="我最喜歡..."
                onChangeText={setCustomQuestionLove}
                editable={!loading}
                multiline
                numberOfLines={3}
                style={styles.customQuestionInput}
                placeholderTextColor={colors.textSecondary}
                maxLength={100}
              />
              <Text style={styles.bioCount}>{customQuestionLove.length}/100</Text>
            </View>

            <View style={styles.section}>
              <TextInput
                value={customQuestionHate}
                placeholder="我最討厭..."
                onChangeText={setCustomQuestionHate}
                editable={!loading}
                multiline
                numberOfLines={3}
                style={styles.customQuestionInput}
                placeholderTextColor={colors.textSecondary}
                maxLength={100}
              />
              <Text style={styles.bioCount}>{customQuestionHate.length}/100</Text>
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
                    style={StyleSheet.flatten([
                      styles.interestTag,
                      styles.interestTagSelected,
                      styles.customInterestTag
                    ])}
                  >
                    <Text style={StyleSheet.flatten([
                      styles.interestTagText,
                      styles.interestTagTextSelected
                    ])}>
                      {tag}
                    </Text>
                  </Pressable>
                ))}

                {/* Predefined Tags */}
                {INTEREST_TAGS.map((interest) => (
                  <Pressable
                    key={interest.id}
                    onPress={() => toggleInterest(interest.id)}
                    style={StyleSheet.flatten([
                      styles.interestTag,
                      selectedInterests.includes(interest.id) && styles.interestTagSelected
                    ])}
                  >
                    <Text style={StyleSheet.flatten([
                      styles.interestTagText,
                      selectedInterests.includes(interest.id) && styles.interestTagTextSelected
                    ])}>
                      {interest.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* MBTI Modal */}
      <BottomSheetModal
        visible={showMbtiModal}
        onClose={() => setShowMbtiModal(false)}
        containerStyle={styles.modalContainer}
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>選擇你的 MBTI</Text>
          <ScrollView style={styles.optionsList} showsVerticalScrollIndicator={false}>
            {MBTI_OPTIONS.map((option) => (
              <Button
                key={option.value}
                onPress={() => handleMbtiSelect(option.value)}
                style={StyleSheet.flatten([
                  styles.option,
                  mbti === option.value && styles.optionSelected
                ])}
              >
                <View style={styles.optionContent}>
                  <Text style={StyleSheet.flatten([
                    styles.optionText,
                    mbti === option.value && styles.optionTextSelected
                  ])}>
                    {option.label}
                  </Text>
                  {option.description && (
                    <Text style={StyleSheet.flatten([
                      styles.optionDescription,
                      mbti === option.value && styles.optionDescriptionSelected
                    ])}>
                      {option.description}
                    </Text>
                  )}
                </View>
              </Button>
            ))}
          </ScrollView>
        </View>
      </BottomSheetModal>

      {/* Date Modal */}
      <BottomSheetModal
        visible={showDateModal}
        onClose={() => setShowDateModal(false)}
        containerStyle={styles.modalContainer}
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>選擇你的生日</Text>
          <View style={styles.datePickerContainer}>
            <View style={styles.dateColumn}>
              <Text style={styles.dateLabel}>年</Text>
              <ScrollView style={styles.dateScroll} showsVerticalScrollIndicator={false}>
                {years.map((year) => (
                  <Button
                    key={year}
                    onPress={() => handleYearChange(year)}
                    style={StyleSheet.flatten([
                      styles.dateOption,
                      selectedYear === year && styles.dateOptionSelected
                    ])}
                  >
                    <Text style={StyleSheet.flatten([
                      styles.dateOptionText,
                      selectedYear === year && styles.dateOptionTextSelected
                    ])}>
                      {year}
                    </Text>
                  </Button>
                ))}
              </ScrollView>
            </View>
            <View style={styles.dateColumn}>
              <Text style={styles.dateLabel}>月</Text>
              <ScrollView style={styles.dateScroll} showsVerticalScrollIndicator={false}>
                {months.map((month) => (
                  <Button
                    key={month}
                    onPress={() => handleMonthChange(month)}
                    style={StyleSheet.flatten([
                      styles.dateOption,
                      selectedMonth === month && styles.dateOptionSelected
                    ])}
                  >
                    <Text style={StyleSheet.flatten([
                      styles.dateOptionText,
                      selectedMonth === month && styles.dateOptionTextSelected
                    ])}>
                      {month}
                    </Text>
                  </Button>
                ))}
              </ScrollView>
            </View>
            <View style={styles.dateColumn}>
              <Text style={styles.dateLabel}>日</Text>
              <ScrollView style={styles.dateScroll} showsVerticalScrollIndicator={false}>
                {validDays.map((day) => (
                  <Button
                    key={day}
                    onPress={() => setSelectedDay(day)}
                    style={StyleSheet.flatten([
                      styles.dateOption,
                      selectedDay === day && styles.dateOptionSelected
                    ])}
                  >
                    <Text style={StyleSheet.flatten([
                      styles.dateOptionText,
                      selectedDay === day && styles.dateOptionTextSelected
                    ])}>
                      {day}
                    </Text>
                  </Button>
                ))}
              </ScrollView>
            </View>
          </View>
          <Button
            onPress={handleDateConfirm}
            style={StyleSheet.flatten([styles.button, styles.modalButton])}
          >
            <Text style={styles.buttonText}>確定</Text>
          </Button>
        </View>
      </BottomSheetModal>

      {/* Gender Modal */}
      <BottomSheetModal
        visible={showGenderModal}
        onClose={() => setShowGenderModal(false)}
        containerStyle={styles.modalContainer}
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>選擇你的性別</Text>
          <ScrollView style={styles.optionsList} showsVerticalScrollIndicator={false}>
            {GENDER_OPTIONS.map((option) => (
              <Button
                key={option.value}
                onPress={() => {
                  setGender(option.value);
                  setShowGenderModal(false);
                }}
                style={StyleSheet.flatten([
                  styles.option,
                  gender === option.value && styles.optionSelected
                ])}
              >
                <Text style={StyleSheet.flatten([
                  styles.optionText,
                  gender === option.value && styles.optionTextSelected
                ])}>
                  {option.label}
                </Text>
              </Button>
            ))}
          </ScrollView>
        </View>
      </BottomSheetModal>

      {/* Orientation Modal */}
      {/* <BottomSheetModal
        visible={showOrientationModal}
        onClose={() => setShowOrientationModal(false)}
        containerStyle={styles.modalContainer}
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>選擇你的性向</Text>
          <ScrollView style={styles.optionsList} showsVerticalScrollIndicator={false}>
            {ORIENTATION_OPTIONS.map((option) => (
              <Button
                key={option.value}
                onPress={() => {
                  setSexualOrientation(option.value);
                  setShowOrientationModal(false);
                }}
                style={[
                  styles.option,
                  sexualOrientation === option.value && styles.optionSelected
                ]}
              >
                <Text style={[
                  styles.optionText,
                  sexualOrientation === option.value && styles.optionTextSelected
                ]}>
                  {option.label}
                </Text>
              </Button>
            ))}
          </ScrollView>
        </View>
      </BottomSheetModal> */}

      {/* Looking For Modal */}
      {/* <BottomSheetModal
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
      </BottomSheetModal> */}
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
    paddingBottom: 100,
    gap: 24,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.textSecondary,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  inputLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  ghostInstructionText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  selectButton: {
    width: '100%',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: colors.card,
    borderWidth: 1.5,
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
  bioInput: {
    width: '100%',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    fontSize: 16,
    color: colors.text,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  bioCount: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'right',
    marginTop: 4,
  },
  bioCountWarning: {
    color: colors.warning,
  },
  customQuestionInput: {
    width: '100%',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    fontSize: 16,
    color: colors.text,
    minHeight: 100,
    textAlignVertical: 'top',
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
    borderWidth: 1.5,
    borderColor: colors.border,
    fontSize: 16,
    color: colors.text,
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
    borderWidth: 1,
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
  customInterestTag: {
    opacity: 1,
  },
  avatarContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  avatarPlaceholder: {
    width: 200,
    height: 200,
    borderRadius: 80,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'visible',
    position: 'relative',
  },
  avatarImageWrapper: {
    width: '100%',
    height: '100%',
    borderRadius: 80,
    overflow: 'hidden',
    position: 'relative',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    borderRadius: 80,
  },
  avatarImageBlurred: {
    opacity: 0.6,
  },
  eyeIconContainer: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background + 'E6',
    borderWidth: 1.5,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background + '40',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  lockedStateContent: {
    alignItems: 'center',
    gap: 8,
  },
  ghostContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyAvatar: {
    alignItems: 'center',
    gap: 12,
  },
  uploadText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  reuploadLink: {
    marginTop: 16,
    padding: 8,
  },
  reuploadText: {
    color: colors.textSecondary,
    fontSize: 14,
    textDecorationLine: 'underline',
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
    borderWidth: 1,
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
  datePickerContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  dateColumn: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  dateScroll: {
    maxHeight: 200,
  },
  dateOption: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
    alignItems: 'center',
  },
  dateOptionSelected: {
    borderColor: colors.primary,
  },
  dateOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  dateOptionTextSelected: {
    color: colors.primary,
  },
  button: {
    width: '100%',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  modalButton: {
    marginTop: 12,
  },
});

export default ProfileSettingsScreen

