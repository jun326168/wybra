import { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Text, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Google from 'expo-auth-session/providers/google';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as WebBrowser from 'expo-web-browser';
import Animated, { 
  FadeIn, 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { colors } from '@/lib/colors';
import Button from '@/components/ui/button';
import { signInWithGoogle, signInWithApple } from '@/lib/api';
import LogoIcon from '@/svgs/logo';
import LoadingSpinner from '@/svgs/spinner';
import { useAppContext } from '@/contexts/AppContext';
import { generateCallsign } from '@/lib/setup';
import { User } from '@/lib/types';

WebBrowser.maybeCompleteAuthSession();

export default function SplashAuthScreen() {
  const router = useRouter();
  const { user, loading, setUser } = useAppContext();
  const [showAuth, setShowAuth] = useState(false);
  const logoTranslateY = useSharedValue(0);
  const logoScale = useSharedValue(1);
  const authOpacity = useSharedValue(0);

  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);

  // Google OAuth configuration
  const [, response, promptAsync] = Google.useAuthRequest({
    iosClientId: process.env.EXPO_PUBLIC_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_ANDROID_CLIENT_ID,
  });

  const getNextRoute = (user: User) => {
    if (!user) return '/';
    return (
      !user.personal_info?.birthday || 
      !user.personal_info?.mbti ||
      !user.personal_info?.gender ||
      !user.personal_info?.sexual_orientation ||
      !user.personal_info?.looking_for ||
      !user.personal_info?.interests
    ) ? '/setup' : '/(tabs)';
  };

  const handleGoogleResponse = useCallback(async (accessToken?: string) => {
    if (!accessToken) return;

    try {
      setGoogleLoading(true);

      const userInfoResponse = await fetch(
        'https://www.googleapis.com/oauth2/v2/userinfo',
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      const userInfo = await userInfoResponse.json();

      const signedInUser = await signInWithGoogle(
        userInfo.email,
        generateCallsign(),
      );

      setUser(signedInUser);
      router.replace(getNextRoute(signedInUser));
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Google sign-in failed');
    } finally {
      setGoogleLoading(false);
    }
  }, [router, setUser]);

  useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      handleGoogleResponse(authentication?.accessToken);
    }
  }, [response, handleGoogleResponse]);

  useEffect(() => {
    // Check user state when loading is complete
    if (!loading) {
      if (user) {
        // User is authenticated, navigate to tabs
        router.replace(getNextRoute(user));
      } else {
        // No user, show auth screen
        setShowAuth(true);
        logoTranslateY.value = withTiming(-32, {
          duration: 600,
          easing: Easing.out(Easing.cubic),
        });
        logoScale.value = withTiming(0.8, {
          duration: 600,
          easing: Easing.out(Easing.cubic),
        });
        authOpacity.value = withDelay(300, withTiming(1, {
          duration: 600,
          easing: Easing.out(Easing.cubic),
        }));
      }
    }
  }, [loading, user, router, logoTranslateY, logoScale, authOpacity]);

  const handleGoogleSignIn = () => {
    promptAsync();
  };

  const handleAppleSignIn = async () => {
    try {
      setAppleLoading(true);
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      const identityToken = credential.identityToken;

      if (!identityToken) {
        Alert.alert('Error', 'Could not retrieve identity token from Apple');
        setAppleLoading(false);
        return;
      }

      const signedInUser = await signInWithApple(identityToken, generateCallsign());

      setUser(signedInUser);
      router.replace(getNextRoute(signedInUser));
    } catch (error: any) {
      if (error.code === 'ERR_REQUEST_CANCELED') {
        setAppleLoading(false);
        return;
      }
      Alert.alert('Error', error.message || 'Apple sign-in failed');
    } finally {
      setAppleLoading(false);
    }
  };

  const logoStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: logoTranslateY.value },
        { scale: logoScale.value }
      ],
    };
  });

  const authContentStyle = useAnimatedStyle(() => {
    return {
      opacity: authOpacity.value,
    };
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Animated.View entering={FadeIn.duration(400)} style={[styles.logoContainer, logoStyle]}>
          <LogoIcon size={100} />
        </Animated.View>

        <Animated.View style={[styles.authContent, authContentStyle]} pointerEvents={showAuth ? 'auto' : 'none'}>
          <View style={styles.headerContainer}>
            <Text style={styles.title}>Wybra</Text>
            <Text style={styles.subtitle}>在看見臉龐之前，先聽見靈魂</Text>
          </View>

          <View style={styles.formContainer}>
            <Button
              style={[styles.button, styles.googleButton]}
              onPress={handleGoogleSignIn}
              disabled={googleLoading || appleLoading}
            >
              {googleLoading ? (
                <LoadingSpinner size={20} color="#FFFFFF" strokeWidth={3} />
              ) : (
                <Text style={styles.buttonText}>Google 傳送門</Text>
              )}
            </Button>

            {Platform.OS === 'ios' && (
              <Button
                style={[styles.button, styles.appleButton]}
                onPress={handleAppleSignIn}
                disabled={googleLoading || appleLoading}
              >
                {appleLoading ? (
                  <LoadingSpinner size={20} color="#FFFFFF" strokeWidth={3} />
                ) : (
                  <Text style={styles.buttonText}>Apple 傳送門</Text>
                )}
              </Button>
            )}
          </View>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
    maxWidth: 500,
    width: '100%',
    alignSelf: 'center',
  },
  logoContainer: {
    alignItems: 'center',
  },
  authContent: {
    width: '100%',
    alignItems: 'center',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
    gap: 16,
  },
  button: {
    width: '100%',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleButton: {
    backgroundColor: '#4285F4',
  },
  appleButton: {
    backgroundColor: '#000000',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
