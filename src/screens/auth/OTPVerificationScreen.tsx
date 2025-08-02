import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  Animated,
  Alert,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import Icon from "react-native-vector-icons/Ionicons";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation";
import Toast, { ToastType } from "../../components/Toast";
import { authService } from "./api";

// Get device dimensions
const { width, height } = Dimensions.get("window");
const isSmallDevice = width < 375;

// Responsive scaling
const scale = (size: number) => {
  if (isSmallDevice) return size * 0.9;
  return size;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type OtpVerificationRouteProp = RouteProp<
  RootStackParamList,
  "OtpVerification"
>;

const OtpVerificationScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<OtpVerificationRouteProp>();
  const { email } = route.params;

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  // Toast state
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<ToastType>("info");

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const otpInputRefs = useRef<TextInput[]>([]);

  // Initialize animations
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Timer countdown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer > 0 && !canResend) {
      interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer, canResend]);

  // Show toast message
  const showToast = (message: string, type: ToastType = "info") => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  // Shake animation for invalid OTP
  const shakeAnimation = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 50,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Handle OTP input change
  const handleOtpChange = (value: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }

    // Auto-verify when all 6 digits are entered
    if (newOtp.every((digit) => digit !== "") && newOtp.join("").length === 6) {
      setTimeout(() => handleVerifyOtp(newOtp.join("")), 500);
    }
  };

  // Handle backspace
  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  // Verify OTP
  const handleVerifyOtp = async (otpCode?: string) => {
    const otpToVerify = otpCode || otp.join("");

    if (otpToVerify.length !== 6) {
      showToast("Please enter all 6 digits", "error");
      shakeAnimation();
      return;
    }

    setIsLoading(true);

    try {
      const response = await authService.verifyOtp({
        email,
        otp: otpToVerify,
      });

      if (response.status) {
        showToast("OTP verified successfully!", "success");

        // Navigate to Reset Password screen
        setTimeout(() => {
          navigation.navigate("ResetPassword", {
            email,
            otpToken: response.data?.token || otpToVerify,
          });
        }, 1000);
      } else {
        showToast(
          response.error?.message || "Invalid OTP. Please try again.",
          "error"
        );
        shakeAnimation();
        // Clear OTP inputs
        setOtp(["", "", "", "", "", ""]);
        otpInputRefs.current[0]?.focus();
      }
    } catch (error: any) {
      console.error("OTP verification error:", error);
      showToast("Verification failed. Please try again.", "error");
      shakeAnimation();
      setOtp(["", "", "", "", "", ""]);
      otpInputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (!canResend || isResending) return;

    setIsResending(true);

    try {
      const response = await authService.resendOtp({ email });

      if (response.status) {
        showToast("New OTP sent to your email!", "success");
        setTimer(60);
        setCanResend(false);
        setOtp(["", "", "", "", "", ""]);
        otpInputRefs.current[0]?.focus();
      } else {
        showToast(response.error?.message || "Failed to resend OTP", "error");
      }
    } catch (error: any) {
      console.error("Resend OTP error:", error);
      showToast("Failed to resend OTP. Please try again.", "error");
    } finally {
      setIsResending(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar style="light" />

      {/* Background with subtle pattern */}
      <View style={styles.background}>
        {[...Array(6)].map((_, index) => (
          <Animated.View
            key={`bg-element-${index}`}
            style={[
              styles.backgroundElement,
              {
                left: `${15 + index * 15}%`,
                top: `${10 + (index % 3) * 20}%`,
                opacity: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 0.1],
                }),
              },
            ]}
          >
            <LinearGradient
              colors={["#4ECDC4", "#44A08D"]}
              style={styles.backgroundElementGradient}
            />
          </Animated.View>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View
          style={[
            styles.headerContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Icon name="chevron-back" size={scale(24)} color="#4ECDC4" />
          </TouchableOpacity>

          <View style={styles.logoContainer}>
            <LinearGradient
              colors={["#1A1A1A", "#2A2A2A"]}
              style={styles.logoBackground}
            >
              <Icon name="mail-outline" size={scale(40)} color="#4ECDC4" />
            </LinearGradient>
          </View>
          <Text style={styles.appName}>Verify OTP</Text>
          <Text style={styles.appTagline}>
            Enter the 6-digit code sent to{"\n"}
            <Text style={styles.emailText}>{email}</Text>
          </Text>
        </Animated.View>

        {/* OTP Input Form */}
        <Animated.View
          style={[
            styles.formContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }, { translateX: shakeAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={["#0A0A0A", "#1A1A1A"]}
            style={styles.formGradient}
          >
            {/* OTP Input Row */}
            <View style={styles.otpContainer}>
              {otp.map((digit, index) => (
                <View key={index} style={styles.otpInputWrapper}>
                  <LinearGradient
                    colors={
                      digit
                        ? ["#4ECDC4", "#44A08D"]
                        : ["transparent", "transparent"]
                    }
                    style={styles.otpInputBorder}
                  >
                    <TextInput
                      ref={(ref) => {
                        if (ref) otpInputRefs.current[index] = ref;
                      }}
                      style={[styles.otpInput, digit && styles.otpInputFilled]}
                      value={digit}
                      onChangeText={(value) => {
                        if (/^\d*$/.test(value) && value.length <= 1) {
                          handleOtpChange(value, index);
                        }
                      }}
                      onKeyPress={(e) => handleKeyPress(e, index)}
                      keyboardType="numeric"
                      maxLength={1}
                      selectTextOnFocus
                      editable={!isLoading}
                      autoFocus={index === 0}
                    />
                  </LinearGradient>
                </View>
              ))}
            </View>

            {/* Timer and Resend */}
            <View style={styles.resendContainer}>
              {!canResend ? (
                <Text style={styles.timerText}>
                  Resend code in{" "}
                  <Text style={styles.timerNumber}>{timer}s</Text>
                </Text>
              ) : (
                <TouchableOpacity
                  style={styles.resendButton}
                  onPress={handleResendOtp}
                  disabled={isResending}
                >
                  {isResending ? (
                    <ActivityIndicator color="#4ECDC4" size="small" />
                  ) : (
                    <Text style={styles.resendButtonText}>Resend OTP</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>

            {/* Verify Button */}
            <TouchableOpacity
              style={[
                styles.verifyButton,
                isLoading && styles.verifyButtonDisabled,
              ]}
              onPress={() => handleVerifyOtp()}
              disabled={isLoading || otp.some((digit) => !digit)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={
                  isLoading || otp.some((digit) => !digit)
                    ? ["#333", "#444"]
                    : ["#4ECDC4", "#44A08D"]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.verifyButtonGradient}
              >
                {isLoading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator color="#FFFFFF" size="small" />
                    <Text style={styles.loadingText}>Verifying...</Text>
                  </View>
                ) : (
                  <Text style={styles.verifyButtonText}>Verify & Continue</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Help Text */}
            <View style={styles.helpContainer}>
              <Icon
                name="information-circle-outline"
                size={scale(16)}
                color="#666"
              />
              <Text style={styles.helpText}>
                Didn't receive the code? Check your spam folder or try
                resending.
              </Text>
            </View>
          </LinearGradient>
        </Animated.View>
      </ScrollView>

      {/* Toast component */}
      <Toast
        visible={toastVisible}
        message={toastMessage}
        type={toastType}
        onHide={() => setToastVisible(false)}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  background: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  backgroundElement: {
    position: "absolute",
    width: scale(8),
    height: scale(8),
    borderRadius: scale(4),
    overflow: "hidden",
  },
  backgroundElementGradient: {
    flex: 1,
    borderRadius: scale(4),
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: Platform.OS === "ios" ? scale(60) : scale(40),
    paddingBottom: scale(40),
    paddingHorizontal: scale(20),
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: scale(50),
    position: "relative",
  },
  backButton: {
    position: "absolute",
    left: 0,
    top: 0,
    width: scale(44),
    height: scale(44),
    justifyContent: "center",
    alignItems: "center",
    borderRadius: scale(22),
    backgroundColor: "rgba(78, 205, 196, 0.1)",
  },
  logoContainer: {
    marginBottom: scale(20),
  },
  logoBackground: {
    width: scale(80),
    height: scale(80),
    borderRadius: scale(40),
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  appName: {
    fontSize: scale(28),
    fontWeight: "900",
    color: "#FFFFFF",
    marginBottom: scale(12),
    letterSpacing: 1,
  },
  appTagline: {
    fontSize: scale(14),
    color: "#B0B0B0",
    textAlign: "center",
    fontWeight: "500",
    lineHeight: scale(20),
  },
  emailText: {
    color: "#4ECDC4",
    fontWeight: "700",
  },
  formContainer: {
    borderRadius: scale(20),
    overflow: "hidden",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  formGradient: {
    padding: scale(30),
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: scale(30),
    paddingHorizontal: scale(10),
  },
  otpInputWrapper: {
    width: scale(50),
    height: scale(60),
    borderRadius: scale(12),
    overflow: "hidden",
  },
  otpInputBorder: {
    padding: 2,
    borderRadius: scale(12),
    flex: 1,
  },
  otpInput: {
    flex: 1,
    backgroundColor: "#1A1A1A",
    borderRadius: scale(10),
    textAlign: "center",
    fontSize: scale(24),
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  otpInputFilled: {
    backgroundColor: "#1A1A1A",
  },
  resendContainer: {
    alignItems: "center",
    marginBottom: scale(30),
  },
  timerText: {
    color: "#9C9C9C",
    fontSize: scale(14),
    fontWeight: "500",
  },
  timerNumber: {
    color: "#4ECDC4",
    fontWeight: "700",
  },
  resendButton: {
    paddingVertical: scale(8),
    paddingHorizontal: scale(16),
  },
  resendButtonText: {
    color: "#4ECDC4",
    fontSize: scale(14),
    fontWeight: "700",
  },
  verifyButton: {
    height: scale(56),
    borderRadius: scale(12),
    overflow: "hidden",
    marginBottom: scale(25),
    elevation: 5,
    shadowColor: "#4ECDC4",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  verifyButtonDisabled: {
    opacity: 0.7,
    elevation: 0,
    shadowOpacity: 0,
  },
  verifyButtonGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  verifyButtonText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: scale(16),
    letterSpacing: 1,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  loadingText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: scale(16),
    marginLeft: scale(12),
  },
  helpContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "rgba(78, 205, 196, 0.1)",
    padding: scale(15),
    borderRadius: scale(12),
    borderWidth: 1,
    borderColor: "rgba(78, 205, 196, 0.2)",
  },
  helpText: {
    color: "#B0B0B0",
    fontSize: scale(12),
    lineHeight: scale(16),
    marginLeft: scale(8),
    flex: 1,
  },
});

export default OtpVerificationScreen;
