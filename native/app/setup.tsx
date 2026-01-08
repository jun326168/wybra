import { View, Text, StyleSheet, Platform, Pressable, ScrollView, Animated, Dimensions, Image, Alert, TextInput, KeyboardAvoidingView } from 'react-native'
import React, { useState, useEffect, useRef } from 'react'
import LogoIcon from '@/svgs/logo'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors } from '@/lib/colors'
import Button from '@/components/ui/button'
import Input from '@/components/ui/input'
import BottomSheetModal from '@/components/ui/bottom-sheet-modal'
import { useAppContext } from '@/contexts/AppContext'
import { MBTI_OPTIONS, INTEREST_TAGS, GENDER_OPTIONS, /* ORIENTATION_OPTIONS, LOOKING_FOR_OPTIONS, */ COLOR_OPTIONS, PHOTO_BLUR_AMOUNT } from '@/lib/setup'
import LoadingSpinner from '@/svgs/spinner'
import { updateUserProfile, uploadUserPhoto } from '@/lib/api'
import { useRouter } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import { EyeIcon, EyeSlashIcon } from '@/svgs'

const SetupScreen = () => {
  const { user, setUser, loading: userLoading } = useAppContext();
  const router = useRouter();

  const logoStrokeColor = (user?.personal_info?.color as string | undefined) || colors.background;

  // Step state
  const [currentStep, setCurrentStep] = useState(1);

  // Step 1 - Basic Info + Gender & Orientation
  const [username, setUsername] = useState(user?.username || '');
  const [realName, setRealName] = useState(user?.personal_info?.real_name || '');
  const [birthday, setBirthday] = useState<string>(
    (user?.personal_info?.birthday as string | undefined) || ''
  );
  const [mbti, setMbti] = useState<string | null>(
    (user?.personal_info?.mbti as string | undefined) || null
  );
  const [gender, setGender] = useState<string | null>(
    (user?.personal_info?.gender as string | undefined) || null
  );
  // const [sexualOrientation, setSexualOrientation] = useState<string | null>(
  //   (user?.personal_info?.sexual_orientation as string | undefined) || null
  // );

  // Step 2 - Looking For, Bio, Custom Question
  // const [lookingFor, setLookingFor] = useState<string | null>(
  //   (user?.personal_info?.looking_for as string | undefined) || null
  // );
  const [bio, setBio] = useState<string>(
    (user?.personal_info?.bio as string | undefined) || ''
  );
  const [customQuestionLove, setCustomQuestionLove] = useState<string>(
    (user?.personal_info?.custom_question as any)?.love || ''
  );
  const [customQuestionHate, setCustomQuestionHate] = useState<string>(
    (user?.personal_info?.custom_question as any)?.hate || ''
  );

  // Step 3 - Interests
  const [selectedInterests, setSelectedInterests] = useState<string[]>(
    (user?.personal_info?.interests as string[] | undefined) || []
  );
  const [customTagInput, setCustomTagInput] = useState<string>('#');
  const [customTags, setCustomTags] = useState<string[]>([]);

  // Step 4 - Photo
  const [photoUri, setPhotoUri] = useState<string | null>(
    (user?.personal_info?.avatar_url as string | undefined) || null
  );
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showImage, setShowImage] = useState(false);

  // Step 5 - Color
  const [selectedColor, setSelectedColor] = useState<string>(
    (user?.personal_info?.color as string | undefined) || colors.background
  );

  // Modal states
  const [showMbtiModal, setShowMbtiModal] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);
  const [showGenderModal, setShowGenderModal] = useState(false);
  // const [showOrientationModal, setShowOrientationModal] = useState(false);
  // const [showLookingForModal, setShowLookingForModal] = useState(false);

  const [loading, setLoading] = useState(false);

  // Animation
  const slideAnim = useRef(new Animated.Value(0)).current;

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

  useEffect(() => {
    if (selectedYear && selectedMonth) {
      const maxDays = getDaysInMonth(selectedYear, selectedMonth);
      if (selectedDay && selectedDay > maxDays) {
        setSelectedDay(maxDays);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear, selectedMonth]);

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

  const animateToStep = (step: number) => {
    Animated.spring(slideAnim, {
      toValue: step - 1,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start();
    setCurrentStep(step);
  };

  const handleNext = () => {
    if (currentStep < 5) {
      animateToStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const updatedUser = await updateUserProfile(user.id, {
        username,
        personal_info: {
          real_name: realName || undefined,
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
          mbti: mbti || undefined,
          birthday: birthday || undefined,
          color: selectedColor,
        }
      });
      setUser(updatedUser);
      router.replace('/(tabs)/home');
    } catch (error: any) {
      console.error('Setup error:', error);
      alert(error.message || 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  const isStep1Valid = username && realName && birthday && mbti && gender /* && sexualOrientation */;
  const isStep2Valid = /* lookingFor && */ bio.length >= 30 && customQuestionLove.trim() && customQuestionHate.trim();
  const isStep3Valid = selectedInterests.length > 0;
  const isStep4Valid = photoUri !== null;
  const isStep5Valid = true; // Color selection is optional

  const canProceed = currentStep === 1 ? isStep1Valid :
    currentStep === 2 ? isStep2Valid :
      currentStep === 3 ? isStep3Valid :
        currentStep === 4 ? isStep4Valid :
          isStep5Valid;

  const buttonText = currentStep === 5 ? '開始！' : '下一步';

  return (
    <>
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Fixed header */}
        <View style={styles.header}>
          <LogoIcon size={36} floatingY={4} />
          <Text style={styles.title}>建立你的數位靈魂</Text>
        </View>

        {/* Step indicator */}
        <View style={styles.stepIndicator}>
          {[1, 2, 3, 4, 5].map((step) => (
            <Pressable
              key={step}
              style={styles.stepDotContainer}
              onPress={() => {
                // Only allow navigation to completed steps or current step
                if (step < currentStep) {
                  animateToStep(step);
                }
              }}
              disabled={step >= currentStep}
            >
              <View style={StyleSheet.flatten([
                styles.stepDot,
                currentStep >= step && styles.stepDotActive,
                step < currentStep && styles.stepDotClickable
              ])} />
            </Pressable>
          ))}
        </View>

        {/* Animated steps container */}
        <View style={styles.stepsContainer}>
          <Animated.View style={[
            styles.stepsWrapper,
            {
              transform: [{
                translateX: slideAnim.interpolate({
                  inputRange: [0, 1, 2, 3, 4],
                  outputRange: [
                    0,
                    -Dimensions.get('window').width,
                    -Dimensions.get('window').width * 2,
                    -Dimensions.get('window').width * 3,
                    -Dimensions.get('window').width * 4
                  ]
                })
              }]
            }
          ]}>
            {/* Step 1 - Basic Info + Gender & Orientation */}
            <View style={styles.stepContent}>
              <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                <View style={styles.inputsContainer}>
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>代號</Text>
                    <Input
                      value={username}
                      placeholder=""
                      readOnly
                      onChangeText={setUsername}
                      editable={!loading}
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>真實姓名</Text>
                    <Input
                      value={realName}
                      placeholder="輸入你的真實姓名"
                      onChangeText={setRealName}
                      editable={!loading}
                    />
                  </View>
                  
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>生日</Text>
                    <Pressable onPress={() => !loading && setShowDateModal(true)}>
                      <View style={styles.selectButton}>
                        <Text style={StyleSheet.flatten([styles.selectButtonText, !birthday && styles.selectButtonPlaceholder])}>
                          {birthday || '輸入生日'}
                        </Text>
                      </View>
                    </Pressable>
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>性別</Text>
                    <Pressable onPress={() => !loading && setShowGenderModal(true)}>
                      <View style={styles.selectButton}>
                        <Text style={StyleSheet.flatten([styles.selectButtonText, !gender && styles.selectButtonPlaceholder])}>
                          {gender ? GENDER_OPTIONS.find(opt => opt.value === gender)?.label : '選擇你的性別'}
                        </Text>
                      </View>
                    </Pressable>
                  </View>
                  
                  {/* <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>性向</Text>
                    <Pressable onPress={() => !loading && setShowOrientationModal(true)}>
                      <View style={styles.selectButton}>
                        <Text style={StyleSheet.flatten([styles.selectButtonText, !sexualOrientation && styles.selectButtonPlaceholder])}>
                          {sexualOrientation ? ORIENTATION_OPTIONS.find(opt => opt.value === sexualOrientation)?.label : '選擇你的性向'}
                        </Text>
                      </View>
                    </Pressable>
                  </View> */}

                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>MBTI</Text>
                    <Pressable onPress={() => !loading && setShowMbtiModal(true)}>
                      <View style={styles.selectButton}>
                        <Text style={StyleSheet.flatten([styles.selectButtonText, !mbti && styles.selectButtonPlaceholder])}>
                          {mbti ? MBTI_OPTIONS.find(opt => opt.value === mbti)?.label || mbti : '選擇你的 MBTI'}
                        </Text>
                      </View>
                    </Pressable>
                  </View>
                </View>
              </ScrollView>
            </View>

            {/* Step 2 - Looking For, Bio, Custom Question */}
            <View style={styles.stepContent}>
              <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
                style={styles.keyboardAvoidingView}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
              >
                <ScrollView
                  style={styles.scrollView}
                  contentContainerStyle={[styles.scrollContent, styles.scrollContentStep2]}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                >
                  <View style={styles.inputsContainer}>
                    {/* <View style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>訊號</Text>
                      <Pressable onPress={() => !loading && setShowLookingForModal(true)}>
                        <View style={styles.selectButton}>
                          <Text style={StyleSheet.flatten([styles.selectButtonText, !lookingFor && styles.selectButtonPlaceholder])}>
                            {lookingFor ? LOOKING_FOR_OPTIONS.find(opt => opt.value === lookingFor)?.label : '你在尋找什麼？'}
                          </Text>
                        </View>
                      </Pressable>
                    </View> */}

                    <View style={styles.inputContainer}>
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

                    <View style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>在你住的地方，你最喜歡和最討厭什麼？</Text>
                      <TextInput
                        value={customQuestionLove}
                        placeholder="我最喜歡..."
                        onChangeText={setCustomQuestionLove}
                        editable={!loading}
                        multiline
                        numberOfLines={2}
                        style={styles.customQuestionInput}
                        placeholderTextColor={colors.textSecondary}
                        maxLength={100}
                      />
                      <Text style={styles.bioCount}>{customQuestionLove.length}/100</Text>
                    </View>

                    <View style={styles.inputContainer}>
                      <TextInput
                        value={customQuestionHate}
                        placeholder="我最討厭..."
                        onChangeText={setCustomQuestionHate}
                        editable={!loading}
                        multiline
                        numberOfLines={2}
                        style={styles.customQuestionInput}
                        placeholderTextColor={colors.textSecondary}
                        maxLength={100}
                      />
                      <Text style={styles.bioCount}>{customQuestionHate.length}/100</Text>
                    </View>
                  </View>
                </ScrollView>
              </KeyboardAvoidingView>
            </View>

            {/* Step 3 - Interests with Custom Tags */}
            <View style={styles.stepContent}>
              <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
                style={styles.keyboardAvoidingView}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
              >
                <ScrollView
                  style={styles.scrollView}
                  contentContainerStyle={[styles.scrollContent, styles.scrollContentStep3]}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                >
                  <View style={styles.inputsContainer}>
                    <Text style={styles.vibeTitle}>我的 Vibe</Text>
                    
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
            </View>

            {/* Step 4 - Photo Upload (Revised Vibe Version) */}
            <View style={styles.stepContent}>
              <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.inputsContainer}>
                  <Text style={styles.vibeTitle}>選擇一張有你的照片</Text>
                  <Text style={styles.vibeDescription}>
                    聊天時，解鎖一場默契小遊戲，通過才能互相看見對方的照片。
                  </Text>

                  <View style={styles.avatarContainer}>
                    {photoUri ? (
                      <Button
                        onPress={() => setShowImage(!showImage)}
                        style={styles.avatarPlaceholder}
                      >
                        <View style={styles.avatarImageWrapper}>
                          <Image 
                            source={{ uri: photoUri }} 
                            style={StyleSheet.flatten([
                              styles.avatarImage,
                              !showImage && styles.avatarImageBlurred
                            ])} 
                            blurRadius={showImage ? 0 : PHOTO_BLUR_AMOUNT} 
                          />
                          {!showImage && (
                            <View style={styles.blurOverlay}>
                              {uploadingPhoto ? (
                                <LoadingSpinner size={30} color={colors.text} strokeWidth={3} />
                              ) : (
                                <View style={styles.lockedStateContent}>
                                  <LogoIcon size={92} floatingY={0} stroke={logoStrokeColor} />
                                </View>
                              )}
                            </View>
                          )}
                        </View>
                        {/* Eye icon indicator */}
                        <View style={styles.eyeIconContainer}>
                          {showImage ? (
                            <EyeIcon size={18} color={colors.text} />
                          ) : (
                            <EyeSlashIcon size={18} color={colors.textSecondary} />
                          )}
                        </View>
                      </Button>
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

                  <Text style={styles.photoWarning}>
                    請勿上傳不雅照，解鎖後若被檢舉將導致永久封鎖。
                  </Text>
                </View>
              </ScrollView>
            </View>

            {/* Step 5 - Color Picker & Completion */}
            <View style={styles.stepContent}>
              <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                <View style={styles.inputsContainer}>
                  <Text style={styles.vibeTitle}>最後一步</Text>
                  <Text style={styles.vibeDescription}>選擇你的主題色</Text>

                  {/* Color Picker */}
                  <View style={styles.inputContainer}>
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

                  <View style={styles.completionMessageContainer}>
                    <Text style={styles.completionText}>
                      設定完成，開始漫遊，看命運帶你連上了誰？
                    </Text>
                  </View>
                </View>
              </ScrollView>
            </View>
          </Animated.View>
        </View>

        {/* Fixed submit button */}
        <View style={styles.buttonContainer}>
          <Button
            onPress={handleNext}
            style={styles.button}
            disabled={loading || !canProceed}
          >
            {loading ? (
              <LoadingSpinner size={20} color={colors.primary} strokeWidth={3} />
            ) : (
              <Text style={styles.buttonText}>{buttonText}</Text>
            )}
          </Button>
        </View>
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
    paddingBottom: 20,
  },
  header: {
    width: '100%',
    marginBottom: 20,
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  stepDotContainer: {
    flex: 1,
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  stepDot: {
    height: '100%',
    width: '100%',
    backgroundColor: colors.border,
    borderRadius: 4,
  },
  stepDotActive: {
    backgroundColor: colors.primary,
  },
  stepDotClickable: {
    cursor: 'pointer',
  },
  stepsContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  stepsWrapper: {
    flexDirection: 'row',
    height: '100%',
  },
  stepContent: {
    width: Dimensions.get('window').width,
    height: '100%',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  scrollContentStep2: {
    paddingBottom: 80,
  },
  scrollContentStep3: {
    paddingBottom: 80,
  },
  inputsContainer: {
    width: '100%',
    gap: 20,
  },
  inputContainer: {
    width: '100%',
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
  keyboardAvoidingView: {
    flex: 1,
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
    minHeight: 100,
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
    minHeight: 80,
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
  vibeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  vibeDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 20,
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
    // flex: 1,
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
  colorDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: -4,
    marginBottom: 12,
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
    borderWidth: 3,
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
  completionMessageContainer: {
    marginTop: 40,
    alignItems: 'center',
  },
  completionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    gap: 40,
  },
  completionText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    lineHeight: 36,
  },
  photoWarning: {
    fontSize: 12,
    color: colors.warning,
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 20,
  },
  avatarContainer: {
    alignItems: 'center',
    marginVertical: 30,
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
  emptyAvatar: {
    alignItems: 'center',
    gap: 12,
  },
  uploadText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  lockedText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 4,
    marginTop: 8,
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
  buttonContainer: {
    width: '100%',
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: Platform.OS === 'ios' ? 20 : 20,
  },
  button: {
    width: '100%',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary + '20',
    borderColor: colors.primary,
    borderWidth: 1,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    // color: colors.text,
    color: colors.primary,
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
  modalButton: {
    marginTop: 12,
  },
});

export default SetupScreen
