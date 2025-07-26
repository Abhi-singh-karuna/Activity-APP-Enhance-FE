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
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import Icon from "react-native-vector-icons/Ionicons";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation";
import Toast, { ToastType } from "../../components/Toast";
import { authService } from "../../api";

// Get device dimensions
const { width, height } = Dimensions.get("window");
const isSmallDevice = width < 375;

// Responsive scaling
const scale = (size: number) => {
  if (isSmallDevice) return size * 0.9;
  return size;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type ResetPasswordRouteProp = RouteProp<RootStackParamList, "ResetPassword">;

const ResetPasswordScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ResetPasswordRouteProp>();
  const { email, otpToken } = route.params;

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  // Toast state
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<ToastType>("info");

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const successAnim = useRef(new Animated.Value(0)).current;
  const [showSuccess, setShowSuccess] = useState(false);

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

  // Calculate password strength
  useEffect(() => {
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    setPasswordStrength(strength);
  }, [password]);

  // Show toast message
  const showToast = (message: string, type: ToastType = "info") => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  // Get password strength info
  const getPasswordStrengthInfo = () => {
    switch (passwordStrength) {
      case 0:
      case 1:
        return { text: "Very Weak", color: "#FF4444" };
      case 2:
        return { text: "Weak", color: "#FF8800" };
      case 3:
        return { text: "Fair", color: "#FFAA00" };
      case 4:
        return { text: "Good", color: "#88DD00" };
      case 5:
        return { text: "Strong", color: "#44DD44" };
      default:
        return { text: "", color: "#666" };
    }
  };

  // Validate password requirements
  const validatePassword = () => {
    if (password.length < 8) {
      showToast("Password must be at least 8 characters long", "error");
      return false;
    }
    if (!/(?=.*[a-z])/.test(password)) {
      showToast("Password must contain at least one lowercase letter", "error");
      return false;
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      showToast("Password must contain at least one uppercase letter", "error");
      return false;
    }
    if (!/(?=.*\d)/.test(password)) {
      showToast("Password must contain at least one number", "error");
      return false;
    }
    if (password !== confirmPassword) {
      showToast("Passwords do not match", "error");
      return false;
    }
    return true;
  };

  // Handle password reset
  const handleResetPassword = async () => {
    if (!validatePassword()) return;

    setIsLoading(true);

    try {
      const response = await authService.resetPassword({
        email,
        otpToken,
        newPassword: password,
        confirmPassword,
      });

      if (response.success) {
        setShowSuccess(true);

        // Success animation
        Animated.spring(successAnim, {
          toValue: 1,
          friction: 6,
          tension: 80,
          useNativeDriver: true,
        }).start();

        showToast("Password reset successfully!", "success");

        // Navigate to login after delay
        setTimeout(() => {
          navigation.reset({
            index: 0,
            routes: [{ name: "Login" }],
          });
        }, 3000);
      } else {
        showToast(
          response.error?.message || "Failed to reset password",
          "error"
        );
      }
    } catch (error: any) {
      console.error("Reset password error:", error);
      showToast("An error occurred. Please try again.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  // Success view
  if (showSuccess) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.background} />

        <View style={styles.successContainer}>
          <Animated.View
            style={[
              styles.successContent,
              {
                opacity: fadeAnim,
                transform: [{ scale: successAnim }, { translateY: slideAnim }],
              },
            ]}
          >
            <LinearGradient
              colors={["#0A0A0A", "#1A1A1A"]}
              style={styles.successGradient}
            >
              <View style={styles.successIconContainer}>
                <LinearGradient
                  colors={["#44DD44", "#66FF66"]}
                  style={styles.successIconGradient}
                >
                  <Icon
                    name="checkmark-outline"
                    size={scale(50)}
                    color="#FFFFFF"
                  />
                </LinearGradient>
              </View>

              <Text style={styles.successTitle}>
                Password Reset Successfully!
              </Text>
              <Text style={styles.successMessage}>
                Your password has been updated successfully.{"\n"}
                You can now login with your new password.
              </Text>

              <View style={styles.successFooter}>
                <Text style={styles.redirectText}>
                  Redirecting to login in 3 seconds...
                </Text>
              </View>
            </LinearGradient>
          </Animated.View>
        </View>

        <Toast
          visible={toastVisible}
          message={toastMessage}
          type={toastType}
          onHide={() => setToastVisible(false)}
        />
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
              colors={["#44DD44", "#66FF66"]}
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
            <Icon name="chevron-back" size={scale(24)} color="#44DD44" />
          </TouchableOpacity>

          <View style={styles.logoContainer}>
            <LinearGradient
              colors={["#1A1A1A", "#2A2A2A"]}
              style={styles.logoBackground}
            >
              <Icon
                name="lock-closed-outline"
                size={scale(40)}
                color="#44DD44"
              />
            </LinearGradient>
          </View>
          <Text style={styles.appName}>Reset Password</Text>
          <Text style={styles.appTagline}>Create a new secure password</Text>
        </Animated.View>

        {/* Reset Password Form */}
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
            {/* New Password Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>New Password</Text>
              <View
                style={[
                  styles.inputContainer,
                  password ? styles.inputContainerFocused : {},
                ]}
              >
                <LinearGradient
                  colors={
                    password
                      ? ["#44DD44", "#66FF66"]
                      : ["transparent", "transparent"]
                  }
                  style={styles.inputBorder}
                >
                  <View style={styles.inputInner}>
                    <Icon
                      name="lock-closed-outline"
                      size={scale(20)}
                      color={password ? "#44DD44" : "#666"}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Enter new password"
                      placeholderTextColor="#666"
                      secureTextEntry={!showPassword}
                      value={password}
                      onChangeText={setPassword}
                      editable={!isLoading}
                      returnKeyType="next"
                    />
                    <TouchableOpacity
                      style={styles.eyeIcon}
                      onPress={() => setShowPassword(!showPassword)}
                      disabled={isLoading}
                    >
                      <Icon
                        name={showPassword ? "eye-off-outline" : "eye-outline"}
                        size={scale(20)}
                        color={password ? "#44DD44" : "#666"}
                      />
                    </TouchableOpacity>
                  </View>
                </LinearGradient>
              </View>

              {/* Password Strength Indicator */}
              {password && (
                <View style={styles.strengthContainer}>
                  <View style={styles.strengthBar}>
                    {[1, 2, 3, 4, 5].map((level) => (
                      <View
                        key={level}
                        style={[
                          styles.strengthSegment,
                          {
                            backgroundColor:
                              level <= passwordStrength
                                ? getPasswordStrengthInfo().color
                                : "#333",
                          },
                        ]}
                      />
                    ))}
                  </View>
                  <Text
                    style={[
                      styles.strengthText,
                      { color: getPasswordStrengthInfo().color },
                    ]}
                  >
                    {getPasswordStrengthInfo().text}
                  </Text>
                </View>
              )}
            </View>

            {/* Confirm Password Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Confirm Password</Text>
              <View
                style={[
                  styles.inputContainer,
                  confirmPassword ? styles.inputContainerFocused : {},
                ]}
              >
                <LinearGradient
                  colors={
                    confirmPassword
                      ? ["#44DD44", "#66FF66"]
                      : ["transparent", "transparent"]
                  }
                  style={styles.inputBorder}
                >
                  <View style={styles.inputInner}>
                    <Icon
                      name="shield-checkmark-outline"
                      size={scale(20)}
                      color={confirmPassword ? "#44DD44" : "#666"}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Confirm new password"
                      placeholderTextColor="#666"
                      secureTextEntry={!showConfirmPassword}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      editable={!isLoading}
                      returnKeyType="done"
                      onSubmitEditing={handleResetPassword}
                    />
                    <TouchableOpacity
                      style={styles.eyeIcon}
                      onPress={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      disabled={isLoading}
                    >
                      <Icon
                        name={
                          showConfirmPassword
                            ? "eye-off-outline"
                            : "eye-outline"
                        }
                        size={scale(20)}
                        color={confirmPassword ? "#44DD44" : "#666"}
                      />
                    </TouchableOpacity>
                  </View>
                </LinearGradient>
              </View>

              {/* Password Match Indicator */}
              {confirmPassword && (
                <View style={styles.matchContainer}>
                  <Icon
                    name={
                      password === confirmPassword
                        ? "checkmark-circle"
                        : "close-circle"
                    }
                    size={scale(16)}
                    color={password === confirmPassword ? "#44DD44" : "#FF4444"}
                  />
                  <Text
                    style={[
                      styles.matchText,
                      {
                        color:
                          password === confirmPassword ? "#44DD44" : "#FF4444",
                      },
                    ]}
                  >
                    {password === confirmPassword
                      ? "Passwords match"
                      : "Passwords don't match"}
                  </Text>
                </View>
              )}
            </View>

            {/* Password Requirements */}
            <View style={styles.requirementsContainer}>
              <Text style={styles.requirementsTitle}>
                Password Requirements:
              </Text>
              <View style={styles.requirementsList}>
                {[
                  { text: "At least 8 characters", test: password.length >= 8 },
                  {
                    text: "One uppercase letter",
                    test: /[A-Z]/.test(password),
                  },
                  {
                    text: "One lowercase letter",
                    test: /[a-z]/.test(password),
                  },
                  { text: "One number", test: /\d/.test(password) },
                  {
                    text: "One special character",
                    test: /[^A-Za-z0-9]/.test(password),
                  },
                ].map((req, index) => (
                  <View key={index} style={styles.requirementItem}>
                    <Icon
                      name={req.test ? "checkmark-circle" : "ellipse-outline"}
                      size={scale(14)}
                      color={req.test ? "#44DD44" : "#666"}
                    />
                    <Text
                      style={[
                        styles.requirementText,
                        { color: req.test ? "#44DD44" : "#9C9C9C" },
                      ]}
                    >
                      {req.text}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Reset Button */}
            <TouchableOpacity
              style={[
                styles.resetButton,
                isLoading && styles.resetButtonDisabled,
              ]}
              onPress={handleResetPassword}
              disabled={isLoading || !password || !confirmPassword}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={
                  isLoading || !password || !confirmPassword
                    ? ["#333", "#444"]
                    : ["#44DD44", "#66FF66"]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.resetButtonGradient}
              >
                {isLoading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator color="#FFFFFF" size="small" />
                    <Text style={styles.loadingText}>Updating Password...</Text>
                  </View>
                ) : (
                  <Text style={styles.resetButtonText}>Reset Password</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
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
  backButton: {
    position: "absolute",
    left: 0,
    top: 0,
    width: scale(44),
    height: scale(44),
    justifyContent: "center",
    alignItems: "center",
    borderRadius: scale(22),
    backgroundColor: "rgba(68, 221, 68, 0.1)",
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
  inputGroup: {
    marginBottom: scale(25),
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
  eyeIcon: {
    padding: scale(8),
  },
  strengthContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: scale(10),
  },
  strengthBar: {
    flexDirection: "row",
    flex: 1,
    height: scale(4),
    borderRadius: scale(2),
    backgroundColor: "#333",
    marginRight: scale(12),
    overflow: "hidden",
  },
  strengthSegment: {
    flex: 1,
    height: "100%",
    marginRight: scale(2),
    borderRadius: scale(1),
  },
  strengthText: {
    fontSize: scale(12),
    fontWeight: "600",
    minWidth: scale(60),
  },
  matchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: scale(8),
  },
  matchText: {
    fontSize: scale(12),
    fontWeight: "500",
    marginLeft: scale(6),
  },
  requirementsContainer: {
    backgroundColor: "rgba(68, 221, 68, 0.05)",
    padding: scale(15),
    borderRadius: scale(12),
    marginBottom: scale(25),
    borderWidth: 1,
    borderColor: "rgba(68, 221, 68, 0.1)",
  },
  requirementsTitle: {
    color: "#E0E0E0",
    fontSize: scale(14),
    fontWeight: "600",
    marginBottom: scale(10),
  },
  requirementsList: {
    gap: scale(6),
  },
  requirementItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  requirementText: {
    fontSize: scale(12),
    marginLeft: scale(8),
    fontWeight: "500",
  },
  resetButton: {
    height: scale(56),
    borderRadius: scale(12),
    overflow: "hidden",
    elevation: 5,
    shadowColor: "#44DD44",
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
  // Success screen styles
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
    color: "#44DD44",
    textAlign: "center",
    marginBottom: scale(15),
    letterSpacing: 1,
  },
  successMessage: {
    fontSize: scale(16),
    color: "#B0B0B0",
    textAlign: "center",
    lineHeight: scale(24),
    marginBottom: scale(30),
    fontWeight: "500",
  },
  successFooter: {
    alignItems: "center",
  },
  redirectText: {
    fontSize: scale(14),
    color: "#9C9C9C",
    fontWeight: "500",
  },
});

export default ResetPasswordScreen;
