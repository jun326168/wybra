import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Animated, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import React, { useEffect, useState, useRef } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Image } from 'expo-image'
import * as Haptics from 'expo-haptics'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '@/lib/colors'
import LogoIcon from '@/svgs/logo'
import Button from '@/components/ui/button'
import { useAppContext } from '@/contexts/AppContext' // Assuming you have this
import type { Chat, QuizQuestion } from '@/lib/types'

const { width } = Dimensions.get('window')

export default function QuizScreen() {
  const router = useRouter()
  const { id, chatData } = useLocalSearchParams()
  const { user } = useAppContext() // Need to know who "I" am to pick the right quiz
  
  // State
  const [chat, setChat] = useState<Chat | null>(null)
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [targetName, setTargetName] = useState('Ghost')
  const [currentQIndex, setCurrentQIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [gameState, setGameState] = useState<'loading' | 'intro' | 'playing' | 'result'>('loading')
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [isProcessing, setIsProcessing] = useState(false) // Prevent double taps

  // Animations
  const progressAnim = useRef(new Animated.Value(0)).current
  const cardScale = useRef(new Animated.Value(1)).current
  const fadeAnim = useRef(new Animated.Value(1)).current

  // 1. Initialize & Parse Data
  useEffect(() => {
    if (chatData && typeof chatData === 'string' && user) {
      try {
        const parsedChat: Chat = JSON.parse(chatData)
        setChat(parsedChat)

        // LOGIC: If I am User 1, I take "user_1_quiz" (which contains questions about User 2)
        const isUser1 = user.id === parsedChat.user_1
        const myQuiz = isUser1 
          ? parsedChat.quiz_info?.user_1_quiz 
          : parsedChat.quiz_info?.user_2_quiz

        const targetUser = parsedChat.other_user
        setTargetName(targetUser?.username || parsedChat.other_user?.personal_info?.callsign as string || 'The Ghost')

        if (myQuiz && myQuiz.length > 0) {
          setQuestions(myQuiz)
          setGameState('intro')
        } else {
          // Error handling if no quiz exists
          alert("No quiz data found!")
          router.back()
        }
      } catch (e) {
        console.error("Quiz parse error", e)
      }
    }
  }, [chatData, user])

  // 2. Game Logic
  const handleOptionSelect = (optionIndex: number) => {
    if (isProcessing) return
    setIsProcessing(true)
    setSelectedOption(optionIndex)

    const currentQuestion = questions[currentQIndex]
    const isCorrect = optionIndex === currentQuestion.correct

    // Feedback Haptics
    if (isCorrect) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      setScore(prev => prev + 1)
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
    }

    // Wait 1 second then move next
    setTimeout(() => {
      animateTransition(() => {
        if (currentQIndex < questions.length - 1) {
          setCurrentQIndex(prev => prev + 1)
          setSelectedOption(null)
          setIsProcessing(false)
          // Update progress bar
          Animated.timing(progressAnim, {
            toValue: (currentQIndex + 2) / questions.length, // +2 because index is 0-based and we're moving to next
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
    // Card "Swipe" effect
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(cardScale, { toValue: 0.95, duration: 150, useNativeDriver: true })
    ]).start(() => {
      callback()
      // Reset
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(cardScale, { toValue: 1, friction: 6, useNativeDriver: true })
      ]).start()
    })
  }

  const finishGame = async (finalScore: number) => {
    setGameState('result')
    setScore(finalScore)
    
    // API CALL PLACEHOLDER
    // if (finalScore === questions.length) {
    //    await api.post('/unlock-photo', { chatId: chat.id })
    // }
  }

  const handleExit = () => {
    const passed = score === questions.length
    // If passed, we might pass a param back to chat to trigger the "Full Reveal"
    if (passed) {
      // Navigate back implies "Refresh" or "Update"
      // Ideally, using a global state or triggering a pusher event is better,
      // but for router, we can just go back.
      router.back() 
    } else {
      router.back()
    }
  }

  // --- Render Helpers ---

  if (gameState === 'loading') {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  // SCREEN: INTRO
  if (gameState === 'intro') {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.introContent}>
            <View style={styles.ghostContainer}>
              <LogoIcon size={120} stroke={colors.primary} />
            </View>
            <Text style={styles.title}>默契大考驗</Text>
            <Text style={styles.subtitle}>
              你有多了解 <Text style={{fontWeight: 'bold', color: colors.primary}}>{targetName}</Text>?
            </Text>
            
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Ionicons name="help-circle-outline" size={24} color={colors.textSecondary} />
                <Text style={styles.infoText}>共 {questions.length} 題</Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="trophy-outline" size={24} color={colors.textSecondary} />
                <Text style={styles.infoText}>需全對才可解鎖</Text>
              </View>
            </View>

            <Button 
              onPress={() => setGameState('playing')}
              style={styles.startButton} 
            >
              <Text style={styles.buttonText}>開始挑戰</Text>
            </Button>
            <Button 
              onPress={() => router.back()} 
            >
              <Text style={styles.buttonText}>我還沒準備好</Text>
            </Button>
          </View>
        </SafeAreaView>
      </View>
    )
  }

  // SCREEN: RESULT
  if (gameState === 'result') {
    const passed = score === questions.length // Must get all right
    return (
      <View style={[styles.container, { backgroundColor: passed ? colors.background : colors.background }]}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.resultContent}>
            <View style={[styles.resultIcon, { backgroundColor: passed ? colors.primary + '20' : colors.error + '20' }]}>
              <Ionicons 
                name={passed ? "lock-open" : "close-circle"} 
                size={80} 
                color={passed ? colors.primary : colors.error} 
              />
            </View>
            
            <Text style={styles.title}>
              {passed ? "共鳴同步完成！" : "頻率未對上..."}
            </Text>
            <Text style={styles.scoreText}>
              答對 {score} / {questions.length} 題
            </Text>
            
            <Text style={styles.subtitle}>
              {passed 
                ? "恭喜！迷霧已散去，準備好見面了嗎？" 
                : "別灰心，多聊聊天，再試一次吧！"}
            </Text>

            <Button 
              onPress={handleExit}
              style={{ marginTop: 40, width: '100%' }}
            >
              <Text style={styles.buttonText}>{passed ? "揭曉真面目" : "回到聊天室"}</Text>
            </Button>
          </View>
        </SafeAreaView>
      </View>
    )
  }

  // SCREEN: PLAYING
  const currentQ = questions[currentQIndex]

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header / Progress */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
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
        <Animated.View style={[styles.questionContainer, { opacity: fadeAnim, transform: [{ scale: cardScale }] }]}>
          <View style={styles.questionCard}>
            <Text style={styles.questionText}>{currentQ.question}</Text>
          </View>

          {/* Options */}
          <View style={styles.optionsContainer}>
            {currentQ.options.map((option, idx) => {
              // Visual State Logic
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
                // Show the correct answer if they picked wrong
                optionStyle = styles.optionCorrectLight
              }

              return (
                <TouchableOpacity 
                  key={idx} 
                  style={optionStyle}
                  onPress={() => handleOptionSelect(idx)}
                  disabled={isProcessing}
                  activeOpacity={0.8}
                >
                  <Text style={textStyle}>{option}</Text>
                  {iconName && (
                    <Ionicons name={iconName as any} size={24} color="white" style={{marginLeft: 'auto'}} />
                  )}
                </TouchableOpacity>
              )
            })}
          </View>
        </Animated.View>

      </SafeAreaView>
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
  
  // Intro Styles
  introContent: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostContainer: {
    marginBottom: 40,
    transform: [{ rotate: '-5deg' }]
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
    padding: 20,
    borderRadius: 16,
    marginBottom: 40,
    gap: 16,
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
  startButton: {
    width: '100%',
    marginBottom: 12,
  },
  buttonText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: 'bold',
  },

  // Game Header Styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 12,
  },
  closeBtn: {
    padding: 4,
  },
  progressBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  progressText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.textSecondary,
    width: 40,
    textAlign: 'right',
  },

  // Question Styles
  questionContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  questionCard: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 30,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 200,
    justifyContent: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  questionText: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    lineHeight: 30,
    textAlign: 'center',
  },
  optionsContainer: {
    gap: 12,
  },
  
  // Option Button States
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
    borderWidth: 2,
    borderColor: colors.primary, // Highlight correct one if user picked wrong
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
  },
  optionTextSelected: {
    fontSize: 16,
    color: 'white',
    fontWeight: 'bold',
    flex: 1,
  },

  // Result Styles
  resultContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  resultIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  scoreText: {
    fontSize: 48,
    fontWeight: '900',
    color: colors.primary,
    marginVertical: 16,
  }
})