import { View, Text, StyleSheet, Platform, Pressable, ScrollView, Animated, Dimensions, Image, Alert } from 'react-native'
import React, { useState, useEffect, useRef } from 'react'
import LogoIcon from '@/svgs/logo'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors } from '@/lib/colors'
import Button from '@/components/ui/button'
import Input from '@/components/ui/input'
import BottomSheetModal from '@/components/ui/bottom-sheet-modal'
import { useAppContext } from '@/contexts/AppContext'
import { MBTI_OPTIONS, INTEREST_TAGS, GENDER_OPTIONS, ORIENTATION_OPTIONS, LOOKING_FOR_OPTIONS } from '@/lib/setup'
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

  // Step 1 - Basic Info
  const [username, setUsername] = useState(user?.username || '');
  const [mbti, setMbti] = useState<string | null>(
    (user?.personal_info?.mbti as string | undefined) || null
  );
  const [birthday, setBirthday] = useState<string>(
    (user?.personal_info?.birthday as string | undefined) || ''
  );

  // Step 2 - Personal Info
  const [gender, setGender] = useState<string | null>(
    (user?.personal_info?.gender as string | undefined) || null
  );
  const [sexualOrientation, setSexualOrientation] = useState<string | null>(
    (user?.personal_info?.sexual_orientation as string | undefined) || null
  );
  const [lookingFor, setLookingFor] = useState<string | null>(
    (user?.personal_info?.looking_for as string | undefined) || null
  );

  // Step 3 - Interests
  const [selectedInterests, setSelectedInterests] = useState<string[]>(
    (user?.personal_info?.interests as string[] | undefined) || []
  );

  // Step 4 - Photo
  const [photoUri, setPhotoUri] = useState<string | null>(
    (user?.personal_info?.avatar_url as string | undefined) || null
  );
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showImage, setShowImage] = useState(false);

  // Modal states
  const [showMbtiModal, setShowMbtiModal] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);
  const [showGenderModal, setShowGenderModal] = useState(false);
  const [showOrientationModal, setShowOrientationModal] = useState(false);
  const [showLookingForModal, setShowLookingForModal] = useState(false);

  const [loading, setLoading] = useState(false);

  // Animation
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Redirect if user already completed setup
  useEffect(() => {
    if (!userLoading && user?.personal_info?.bio) {
      router.replace('/(tabs)/home');
    }
  }, [user, userLoading, router]);

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
          mbti: mbti || undefined,
          birthday: birthday || undefined,
          gender: gender || undefined,
          sexual_orientation: sexualOrientation || undefined,
          looking_for: lookingFor || undefined,
          interests: selectedInterests.length > 0 ? selectedInterests : undefined,
          avatar_url: photoUri || undefined,
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

  const isStep1Valid = username && birthday && mbti;
  const isStep2Valid = gender && sexualOrientation && lookingFor;
  const isStep3Valid = selectedInterests.length > 0;
  const isStep4Valid = photoUri !== null;
  const isStep5Valid = true; // Always valid on the final screen

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
          <Text style={styles.title}>建立你的數位替身</Text>
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
              <View style={[
                styles.stepDot,
                currentStep >= step && styles.stepDotActive,
                step < currentStep && styles.stepDotClickable
              ]} />
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
            {/* Step 1 */}
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
                      placeholder="別透露你的真名喔"
                      onChangeText={setUsername}
                      editable={!loading}
                    />
                  </View>
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>生日</Text>
                    <Pressable onPress={() => !loading && setShowDateModal(true)}>
                      <View style={styles.selectButton}>
                        <Text style={[styles.selectButtonText, !birthday && styles.selectButtonPlaceholder]}>
                          {birthday || '輸入生日'}
                        </Text>
                      </View>
                    </Pressable>
                  </View>
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>屬性 (MBTI)</Text>
                    <Pressable onPress={() => !loading && setShowMbtiModal(true)}>
                      <View style={styles.selectButton}>
                        <Text style={[styles.selectButtonText, !mbti && styles.selectButtonPlaceholder]}>
                          {mbti ? MBTI_OPTIONS.find(opt => opt.value === mbti)?.label || mbti : '選擇你的 MBTI'}
                        </Text>
                      </View>
                    </Pressable>
                  </View>
                </View>
              </ScrollView>
            </View>

            {/* Step 2 */}
            <View style={styles.stepContent}>
              <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                <View style={styles.inputsContainer}>
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>性別</Text>
                    <Pressable onPress={() => !loading && setShowGenderModal(true)}>
                      <View style={styles.selectButton}>
                        <Text style={[styles.selectButtonText, !gender && styles.selectButtonPlaceholder]}>
                          {gender ? GENDER_OPTIONS.find(opt => opt.value === gender)?.label : '選擇你的性別'}
                        </Text>
                      </View>
                    </Pressable>
                  </View>
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>性向</Text>
                    <Pressable onPress={() => !loading && setShowOrientationModal(true)}>
                      <View style={styles.selectButton}>
                        <Text style={[styles.selectButtonText, !sexualOrientation && styles.selectButtonPlaceholder]}>
                          {sexualOrientation ? ORIENTATION_OPTIONS.find(opt => opt.value === sexualOrientation)?.label : '選擇你的性向'}
                        </Text>
                      </View>
                    </Pressable>
                  </View>
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>目標</Text>
                    <Pressable onPress={() => !loading && setShowLookingForModal(true)}>
                      <View style={styles.selectButton}>
                        <Text style={[styles.selectButtonText, !lookingFor && styles.selectButtonPlaceholder]}>
                          {lookingFor ? LOOKING_FOR_OPTIONS.find(opt => opt.value === lookingFor)?.label : '你在尋找什麼？'}
                        </Text>
                      </View>
                    </Pressable>
                  </View>
                </View>
              </ScrollView>
            </View>

            {/* Step 3 */}
            <View style={styles.stepContent}>
              <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.inputsContainer}>
                  <Text style={styles.vibeTitle}>我的 Vibe</Text>
                  <View style={styles.interestsGrid}>
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
              </ScrollView>
            </View>

            {/* Step 4 - Photo Upload (Revised Vibe Version) */}
            <View style={styles.stepContent}>
              <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.inputsContainer}>
                  <Text style={styles.vibeTitle}>選擇一張有你的相片</Text>
                  <Text style={styles.vibeDescription}>
                    相片會以「模糊狀態」顯示。在配對聊天滿 7 天後，你可以決定是否解鎖給對方看。
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
                            style={[
                              styles.avatarImage,
                              !showImage && styles.avatarImageBlurred
                            ]} 
                            blurRadius={showImage ? 0 : 60} 
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
                        style={[styles.avatarPlaceholder, { borderWidth: 2 }]}
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
                    請勿上傳不雅照，解鎖時若被檢舉將導致永久封鎖！
                  </Text>
                </View>
              </ScrollView>
            </View>

            {/* Step 5 - Completion */}
            <View style={styles.stepContent}>
              <View style={styles.completionContainer}>
                <LogoIcon size={80} floatingY={8} />
                <Text style={styles.completionText}>
                  設定完成，開始尋找頻率相符的夥伴吧！
                </Text>
              </View>
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
              <LoadingSpinner size={20} color={colors.text} strokeWidth={3} />
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
                style={[
                  styles.option,
                  mbti === option.value && styles.optionSelected
                ]}
              >
                <View style={styles.optionContent}>
                  <Text style={[
                    styles.optionText,
                    mbti === option.value && styles.optionTextSelected
                  ]}>
                    {option.label}
                  </Text>
                  {option.description && (
                    <Text style={[
                      styles.optionDescription,
                      mbti === option.value && styles.optionDescriptionSelected
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
                    style={[
                      styles.dateOption,
                      selectedYear === year && styles.dateOptionSelected
                    ]}
                  >
                    <Text style={[
                      styles.dateOptionText,
                      selectedYear === year && styles.dateOptionTextSelected
                    ]}>
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
                    style={[
                      styles.dateOption,
                      selectedMonth === month && styles.dateOptionSelected
                    ]}
                  >
                    <Text style={[
                      styles.dateOptionText,
                      selectedMonth === month && styles.dateOptionTextSelected
                    ]}>
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
                    style={[
                      styles.dateOption,
                      selectedDay === day && styles.dateOptionSelected
                    ]}
                  >
                    <Text style={[
                      styles.dateOptionText,
                      selectedDay === day && styles.dateOptionTextSelected
                    ]}>
                      {day}
                    </Text>
                  </Button>
                ))}
              </ScrollView>
            </View>
          </View>
          <Button
            onPress={handleDateConfirm}
            style={[styles.button, styles.modalButton]}
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
                style={[
                  styles.option,
                  gender === option.value && styles.optionSelected
                ]}
              >
                <Text style={[
                  styles.optionText,
                  gender === option.value && styles.optionTextSelected
                ]}>
                  {option.label}
                </Text>
              </Button>
            ))}
          </ScrollView>
        </View>
      </BottomSheetModal>

      {/* Orientation Modal */}
      <BottomSheetModal
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
      </BottomSheetModal>

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
    borderWidth: 2,
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
    backgroundColor: colors.primary,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
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
    borderWidth: 2,
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
