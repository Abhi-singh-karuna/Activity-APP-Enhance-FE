import React, { useState } from "react";
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
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import Icon from "react-native-vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation";
import Toast, { ToastType } from "../components/Toast";
import { authService } from "../api";

// Get device dimensions
const { width, height } = Dimensions.get("window");
const isSmallDevice = width < 375;

// Responsive scaling
const scale = (size: number) => {
  if (isSmallDevice) return size * 0.9;
  return size;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const ForgotPasswordScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  // Toast state
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<ToastType>("info");

  // Animation values
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(50)).current;
  const successAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
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

  React.useEffect(() => {
    if (emailSent) {
      Animated.spring(successAnim, {
        toValue: 1,
        friction: 8,
        tension: 100,
        useNativeDriver: true,
      }).start();
    }
  }, [emailSent]);

  // Show toast message
  const showToast = (message: string, type: ToastType = "info") => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  const handleForgotPassword = async () => {
    // Input validation
    if (!email.trim()) {
      showToast("Email is required", "error");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      showToast("Please enter a valid email address", "error");
      return;
    }

    setIsLoading(true);

    try {
      const response = await authService.forgotPassword({
        email: email.trim(),
      });

      if (response.success) {
        setEmailSent(true);
        showToast("OTP sent to your email successfully!", "success");
        
        // Navigate to OTP verification screen after a short delay
        setTimeout(() => {
          navigation.navigate("OtpVerification", { 
            email: email.trim() 
          });
        }, 2000); // 2 second delay to show success message
        
      } else {
        const errorMessage = response.error?.message || "Failed to send reset email. Please try again.";
        showToast(errorMessage, "error");
      }
    } catch (error: any) {
      console.error("Forgot password error:", error);
      let errorMessage = "An unexpected error occurred. Please try again.";

      if (error.code === "NETWORK_ERROR") {
        errorMessage = "Network error. Please check your internet connection.";
      }

      showToast(errorMessage, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigation.navigate("Login");
  };

  // Navigate to OTP screen manually
  const handleGoToOtp = () => {
    navigation.navigate("OtpVerification", { 
      email: email.trim() 
    });
  };

  if (emailSent) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        
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

        <View style={styles.successContainer}>
          <Animated.View
            style={[
              styles.successContent,
              {
                opacity: fadeAnim,
                transform: [
                  { scale: successAnim },
                  { translateY: slideAnim },
                ],
              },
            ]}
          >
            <LinearGradient
              colors={["#0A0A0A", "#1A1A1A"]}
              style={styles.successGradient}
            >
              <View style={styles.successIconContainer}>
                <LinearGradient
                  colors={["#4ECDC4", "#44A08D"]}
                  style={styles.successIconGradient}
                >
                  <Icon name="mail-outline" size={scale(50)} color="#FFFFFF" />
                </LinearGradient>
              </View>
              
              <Text style={styles.successTitle}>OTP Sent!</Text>
              <Text style={styles.successMessage}>
                We've sent a 6-digit verification code to:
              </Text>
              <Text style={styles.emailText}>{email}</Text>
              
              <Text style={styles.instructionText}>
                Please check your email and enter the OTP to verify your identity.
              </Text>

              {/* Go to OTP Button */}
              <TouchableOpacity
                style={styles.otpButton}
                onPress={handleGoToOtp}
              >
                <LinearGradient
                  colors={["#4ECDC4", "#44A08D"]}
                  style={styles.otpButtonGradient}
                >
                  <Text style={styles.otpButtonText}>Enter OTP</Text>
                  <Icon name="arrow-forward" size={scale(20)} color="#FFFFFF" />
                </LinearGradient>
              </TouchableOpacity>

              {/* Back to Login Button */}
              <TouchableOpacity
                style={styles.backButton}
                onPress={handleBackToLogin}
              >
                <Text style={styles.backButtonText}>Back to Login</Text>
              </TouchableOpacity>
            </LinearGradient>
          </Animated.View>
        </View>
      </View>
    );
  }

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
              colors={["#FF6B6B", "#FF8E53"]}
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
          <TouchableOpacity style={styles.backIconButton} onPress={() => navigation.goBack()}>
            <Icon name="chevron-back" size={scale(24)} color="#FF6B6B" />
          </TouchableOpacity>
          
          <View style={styles.logoContainer}>
            <LinearGradient
              colors={["#1A1A1A", "#2A2A2A"]}
              style={styles.logoBackground}
            >
              <Icon
                name="key-outline"
                size={scale(40)}
                color="#FF6B6B"
              />
            </LinearGradient>
          </View>
          <Text style={styles.appName}>Forgot Password</Text>
          <Text style={styles.appTagline}>Don't worry, we'll help you reset it</Text>
        </Animated.View>

        {/* Main form container */}
        <Animated.View
          style={[
            styles.formContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={["#0A0A0A", "#1A1A1A"]}
            style={styles.formGradient}
          >
            <View style={styles.instructionContainer}>
              <Text style={styles.instructionTitle}>Reset Your Password</Text>
              <Text style={styles.instructionText}>
                Enter your email address and we'll send you a 6-digit OTP to verify your identity.
              </Text>
            </View>

            {/* Email Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <View style={[styles.inputContainer, email ? styles.inputContainerFocused : {}]}>
                <LinearGradient
                  colors={email ? ["#FF6B6B", "#FF8E53"] : ["transparent", "transparent"]}
                  style={styles.inputBorder}
                >
                  <View style={styles.inputInner}>
                    <Icon
                      name="mail-outline"
                      size={scale(20)}
                      color={email ? "#FF6B6B" : "#666"}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your email address"
                      placeholderTextColor="#666"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      value={email}
                      onChangeText={setEmail}
                      editable={!isLoading}
                      returnKeyType="done"
                      onSubmitEditing={handleForgotPassword}
                    />
                  </View>
                </LinearGradient>
              </View>
            </View>

            {/* Send OTP Button */}
            <TouchableOpacity
              style={[styles.resetButton, isLoading && styles.resetButtonDisabled]}
              onPress={handleForgotPassword}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={isLoading ? ["#333", "#444"] : ["#FF6B6B", "#FF8E53"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.resetButtonGradient}
              >
                {isLoading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator color="#FFFFFF" size="small" />
                    <Text style={styles.loadingText}>Sending OTP...</Text>
                  </View>
                ) : (
                  <Text style={styles.resetButtonText}>Send OTP</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Back to Login Link */}
            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Remember your password? </Text>
              <TouchableOpacity onPress={handleBackToLogin} disabled={isLoading}>
                <Text style={styles.loginLink}>Back to Login</Text>
              </TouchableOpacity>
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
    marginBottom: scale(40),
    position: "relative",
  },
  backIconButton: {
    position: "absolute",
    left: 0,
    top: 0,
    width: scale(44),
    height: scale(44),
    justifyContent: "center",
    alignItems: "center",
    borderRadius: scale(22),
    backgroundColor: "rgba(255, 107, 107, 0.1)",
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
    marginBottom: scale(8),
    letterSpacing: 1,
  },
  appTagline: {
    fontSize: scale(14),
    color: "#B0B0B0",
    textAlign: "center",
    fontWeight: "500",
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
  instructionContainer: {
    marginBottom: scale(30),
    alignItems: "center",
  },
  instructionTitle: {
    fontSize: scale(22),
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: scale(12),
    letterSpacing: 0.5,
  },
  instructionText: {
    fontSize: scale(14),
    color: "#B0B0B0",
    textAlign: "center",
    lineHeight: scale(20),
    fontWeight: "500",
  },
  inputGroup: {
    marginBottom: scale(30),
  },
  inputLabel: {
    fontSize: scale(14),
    color: "#E0E0E0",
    marginBottom: scale(8),
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  inputContainer: {
    borderRadius: scale(12),
    overflow: "hidden",
  },
  inputContainerFocused: {},
  inputBorder: {
    padding: 1,
    borderRadius: scale(12),
  },
  inputInner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A1A1A",
    borderRadius: scale(11),
    height: scale(56),
    paddingHorizontal: scale(16),
  },
  inputIcon: {
    marginRight: scale(12),
  },
  input: {
    flex: 1,
    height: "100%",
    color: "#FFFFFF",
    fontWeight: "500",
    fontSize: scale(16),
  },
  resetButton: {
    height: scale(56),
    borderRadius: scale(12),
    overflow: "hidden",
    marginBottom: scale(25),
    elevation: 5,
    shadowColor: "#FF6B6B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  resetButtonDisabled: {
    opacity: 0.7,
    elevation: 0,
    shadowOpacity: 0,
  },
  resetButtonGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  resetButtonText: {
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
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  loginText: {
    color: "#9C9C9C",
    fontSize: scale(14),
    fontWeight: "500",
  },
  loginLink: {
    color: "#FF6B6B",
    fontSize: scale(14),
    fontWeight: "700",
  },
  // Success screen specific styles
  successContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: scale(20),
  },
  successContent: {
    width: "100%",
    maxWidth: scale(400),
    borderRadius: scale(20),
    overflow: "hidden",
    elevation: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.4,
    shadowRadius: 25,
  },
  successGradient: {
    padding: scale(40),
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  successIconContainer: {
    marginBottom: scale(30),
    borderRadius: scale(50),
    overflow: "hidden",
  },
  successIconGradient: {
    width: scale(100),
    height: scale(100),
    borderRadius: scale(50),
    justifyContent: "center",
    alignItems: "center",
  },
  successTitle: {
    fontSize: scale(24),
    fontWeight: "900",
    color: "#FFFFFF",
    marginBottom: scale(15),
    letterSpacing: 1,
  },
  successMessage: {
    fontSize: scale(16),
    color: "#B0B0B0",
    textAlign: "center",
    marginBottom: scale(10),
    fontWeight: "500",
  },
  emailText: {
    fontSize: scale(16),
    color: "#4ECDC4",
    fontWeight: "700",
    marginBottom: scale(20),
    textAlign: "center",
  },
  // New OTP Button Styles
  otpButton: {
    width: "100%",
    height: scale(56),
    borderRadius: scale(12),
    overflow: "hidden",
    marginBottom: scale(15),
    elevation: 5,
    shadowColor: "#4ECDC4",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  otpButtonGradient: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  otpButtonText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: scale(16),
    letterSpacing: 1,
    marginRight: scale(8),
  },
  backButton: {
    width: "100%",
    height: scale(48),
    justifyContent: "center",
    alignItems: "center",
    borderRadius: scale(12),
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    marginTop: scale(10),
  },
  backButtonText: {
    color: "#B0B0B0",
    fontWeight: "600",
    fontSize: scale(14),
    letterSpacing: 0.5,
  },
});

export default ForgotPasswordScreen;
