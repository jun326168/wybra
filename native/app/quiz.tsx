import { View, Text, StyleSheet, Animated } from 'react-native'
import React, { useEffect, useState, useRef } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as Haptics from 'expo-haptics'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '@/lib/colors'
import LogoIcon from '@/svgs/logo'
import Button from '@/components/ui/button'
import { useAppContext } from '@/contexts/AppContext'
import { updateChatInfo, fetchChat } from '@/lib/api'
import type { Chat, QuizQuestion, User } from '@/lib/types'
import LoadingSpinner from '@/svgs/spinner'
import FullReveal from '@/components/reward-overlays/full-reveal'


export default function QuizScreen() {
  const router = useRouter()
  const { id } = useLocalSearchParams()
  const { user } = useAppContext()

  // State
  const [chat, setChat] = useState<Chat | null>(null)
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [targetName, setTargetName] = useState('Ghost')
  const [currentQIndex, setCurrentQIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [gameState, setGameState] = useState<'loading' | 'intro' | 'playing' | 'result'>('loading')
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [showFullReveal, setShowFullReveal] = useState(false)

  // Animations
  const progressAnim = useRef(new Animated.Value(0)).current
  const cardScale = useRef(new Animated.Value(1)).current
  const fadeAnim = useRef(new Animated.Value(1)).current

  // 1. Fetch Chat Data
  useEffect(() => {
    const loadChat = async () => {
      if (!id || !user) return;

      try {
        setGameState('loading');
        const { chat: fetchedChat } = await fetchChat(id as string);
        setChat(fetchedChat);

        // Determine which quiz to take
        // If I am User 1, I take "user_1_quiz" (questions about User 2)
        const isUser1 = user.id === fetchedChat.user_1;
        const myQuiz = isUser1
          ? (fetchedChat.quiz_info?.user_1_quiz as QuizQuestion[])
          : (fetchedChat.quiz_info?.user_2_quiz as QuizQuestion[]);

        const targetUser = fetchedChat.other_user;
        setTargetName(targetUser?.username || '對方');

        if (myQuiz && myQuiz.length > 0) {
          setQuestions(myQuiz);
          // Initialize progress bar to first question
          progressAnim.setValue(1 / myQuiz.length);
          setGameState('intro');
        } else {
          // Fallback if no quiz data
          setGameState('intro');
          setQuestions([
            { question: "數據傳輸中...", options: ["Error", "Retry", "Exit"], correct: 0 }
          ]);
        }
      } catch (e) {
        console.error("Quiz load error", e);
        setGameState('intro');
      }
    };

    loadChat();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user]);

  // 2. Game Logic
  const handleOptionSelect = (optionIndex: number) => {
    if (isProcessing) return
    setIsProcessing(true)
    setSelectedOption(optionIndex)

    const currentQuestion = questions[currentQIndex]
    const isCorrect = optionIndex === currentQuestion.correct

    // Haptics
    if (isCorrect) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      setScore(prev => prev + 1)
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
    }

    // Delay before next question
    setTimeout(() => {
      animateTransition(() => {
        if (currentQIndex < questions.length - 1) {
          setCurrentQIndex(prev => prev + 1)
          setSelectedOption(null)
          setIsProcessing(false)

          // Animate Progress Bar
          Animated.timing(progressAnim, {
            toValue: (currentQIndex + 2) / questions.length,
            duration: 300,
            useNativeDriver: false
          }).start()
        } else {
          finishGame(isCorrect ? score + 1 : score)
        }
      })
    }, 800)
  }

  const animateTransition = (callback: () => void) => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(cardScale, { toValue: 0.95, duration: 150, useNativeDriver: true })
    ]).start(() => {
      callback()
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(cardScale, { toValue: 1, friction: 6, useNativeDriver: true })
      ]).start()
    })
  }

  const finishGame = async (finalScore: number) => {
    setScore(finalScore)

    // If passed (Score >= 3 or All Correct? Let's strictly say All Correct for "True Resonance")
    // Adjust logic: finalScore >= questions.length - 1 (Allow 1 mistake) or === length
    const passed = finalScore >= questions.length;

    if (passed && chat && user) {
      // Show FullReveal immediately while updating in background
      setShowFullReveal(true)
      
      try {
        setSubmitting(true)
        const isUser1 = user.id === chat.user_1

        // Prepare update payload
        const currentChatInfo = chat.chat_info || {}
        const updatedInfo = {
          ...currentChatInfo,
          [isUser1 ? 'user_1_unlocked' : 'user_2_unlocked']: true
        }

        // Call API in background
        await updateChatInfo(chat.id, updatedInfo)
      } catch (error) {
        console.error("Failed to unlock:", error)
      } finally {
        setSubmitting(false)
      }
    } else {
      // If not passed, show result screen
      setGameState('result')
    }
  }

  const handleExit = () => {
    router.back()
  }

  const handleFullRevealClose = () => {
    setShowFullReveal(false)
    router.back()
  }

  // --- Render ---

  if (gameState === 'loading') {
    return (
      <View style={styles.centerContainer}>
        <LoadingSpinner size={28} color={colors.primary} strokeWidth={3} />
      </View>
    )
  }

  // INTRO SCREEN
  if (gameState === 'intro') {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.introContent}>
            <View style={styles.ghostContainer}>
              <LogoIcon size={80} />
            </View>
            <Text style={styles.title}>默契考驗</Text>
            <Text style={styles.subtitle}>
              你有多了解 <Text style={{ fontWeight: 'bold', color: colors.primary }}>{targetName}</Text> ?
            </Text>

            <View style={styles.buttonContainer}>
              <Button
                onPress={() => setGameState('playing')}
                style={styles.startButton}
              >
                <Text style={styles.startButtonText}>開始挑戰</Text>
              </Button>
            </View>

            <View style={styles.buttonContainer}>
              <Button
                onPress={() => router.back()}
                style={styles.ghostButton}
              >
                <Text style={styles.ghostButtonText}>我還沒準備好</Text>
              </Button>
            </View>
          </View>
        </SafeAreaView>
      </View>
    )
  }

  // RESULT SCREEN
  if (gameState === 'result') {
    const passed = score >= questions.length;
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.resultContent}>
            <View style={[styles.resultIcon, { backgroundColor: passed ? colors.primary + '20' : colors.error + '20' }]}>
              <Ionicons
                name={passed ? "lock-open" : "close-circle"}
                size={80}
                color={passed ? colors.primary : colors.error}
              />
            </View>

            <Text style={styles.scoreText}>
              答對 {score} / {questions.length} 題
            </Text>

            <Text style={styles.subtitle}>
              {passed
                ? "已解鎖"
                : "別灰心，回去查看聊天內容，再試一次吧！"}
            </Text>

            <View style={styles.buttonContainer}>
              <Button
                onPress={handleExit}
                style={[styles.startButton, { marginTop: 40 }]}
              >
                {submitting ? (
                  <LoadingSpinner size={20} color={colors.primary} strokeWidth={3} />
                ) : (
                  <Text style={styles.startButtonText}>回到聊天室</Text>
                )}
              </Button>
            </View>
          </View>
        </SafeAreaView>
      </View>
    )
  }

  // PLAYING SCREEN
  const currentQ = questions[currentQIndex]

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <Button onPress={() => router.back()} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color={colors.textSecondary} />
          </Button>
          <View style={styles.progressBarContainer}>
            <Animated.View style={[styles.progressBarFill, {
              width: progressAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%']
              })
            }]} />
          </View>
          <Text style={styles.progressText}>{currentQIndex + 1}/{questions.length}</Text>
        </View>

        {/* Question Card */}
        <View style={styles.gameArea}>
          <Animated.View style={[styles.questionContainer, { opacity: fadeAnim, transform: [{ scale: cardScale }] }]}>
            <View style={styles.questionCard}>
              <Text style={styles.questionText}>{currentQ.question}</Text>
            </View>

            {/* Options */}
            <View style={styles.optionsContainer}>
              {currentQ.options.map((option, idx) => {
                let optionStyle = styles.optionButton
                let textStyle = styles.optionText
                let iconName = null

                const isSelected = selectedOption === idx
                const isCorrectAnswer = idx === currentQ.correct

                if (isSelected) {
                  if (isCorrectAnswer) {
                    optionStyle = styles.optionCorrect
                    textStyle = styles.optionTextSelected
                    iconName = "checkmark-circle"
                  } else {
                    optionStyle = styles.optionWrong
                    textStyle = styles.optionTextSelected
                    iconName = "close-circle"
                  }
                } else if (selectedOption !== null && isCorrectAnswer) {
                  // Reveal correct answer if user was wrong
                  optionStyle = styles.optionCorrectLight
                  textStyle = styles.optionTextSelected
                }

                return (
                  <Button
                    key={idx}
                    style={optionStyle}
                    onPress={() => handleOptionSelect(idx)}
                  >
                    <Text style={textStyle}>{option}</Text>
                    {iconName && (
                      <Ionicons name={iconName as any} size={20} color="white" style={{ marginLeft: 'auto' }} />
                    )}
                  </Button>
                )
              })}
            </View>
          </Animated.View>
        </View>
      </SafeAreaView>

      {/* Full Reveal */}
      {chat?.other_user && (
        <FullReveal 
          visible={showFullReveal}
          onClose={handleFullRevealClose}
          otherUser={chat.other_user as unknown as User}
        />
      )}
    </View>
  )
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
  },
  safeArea: {
    flex: 1,
  },
  // Intro & Result Shared
  introContent: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  ghostContainer: {
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  infoCard: {
    width: '100%',
    backgroundColor: colors.card,
    padding: 24,
    borderRadius: 20,
    marginBottom: 40,
    gap: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoText: {
    fontSize: 16,
    color: colors.text,
  },
  buttonContainer: {
    width: '100%',
  },
  startButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: colors.primary + '20',
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  ghostButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostButtonText: {
    fontSize: 16,
    color: colors.textSecondary,
  },

  // Game Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 16,
  },
  closeBtn: {
    padding: 4,
  },
  progressBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: colors.card,
    borderRadius: 4,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  progressText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.textSecondary,
    width: 40,
    textAlign: 'right',
  },

  // Game Area
  gameArea: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  questionContainer: {
    width: '100%',
  },
  questionCard: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 32,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: colors.border,
    minHeight: 180,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  questionText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
    lineHeight: 32,
    textAlign: 'center',
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    backgroundColor: colors.card,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionCorrect: {
    backgroundColor: colors.primary,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionCorrectLight: {
    backgroundColor: colors.card,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionWrong: {
    backgroundColor: colors.error,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.error,
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionText: {
    fontSize: 16,
    color: colors.text,
    flex: 1,
    fontWeight: 'bold',
  },
  optionTextSelected: {
    fontSize: 16,
    color: '#FFF',
    flex: 1,
    fontWeight: 'bold',
  },

  // Result
  resultIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  scoreText: {
    fontSize: 32,
    fontWeight: '900',
    color: colors.primary,
    marginVertical: 16,
  }
})