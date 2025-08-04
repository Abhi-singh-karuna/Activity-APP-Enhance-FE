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
  Alert,
  ActivityIndicator,
  Dimensions,
  Animated,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import Icon from "react-native-vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation";
import StyledText from "../../components/StyledText";
import { useAppContext } from "../../context/AppContext";
import Toast, { ToastType } from "../../components/Toast";
import { authService, LoginRequest } from "./api";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Get device dimensions
const { width, height } = Dimensions.get("window");
const isSmallDevice = width < 375;

// Responsive scaling
const scale = (size: number) => {
  if (isSmallDevice) return size * 0.9;
  return size;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const LoginScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login: contextLogin } = useAppContext();

  // Toast state
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<ToastType>("info");

  // Animation values
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(50)).current;

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

  // Show toast message
  const showToast = (message: string, type: ToastType = "info") => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  // Navigate to Activity screen with delay
  const navigateToActivity = (delay: number = 1000) => {
    setTimeout(() => {
      navigation.navigate("Activity");
    }, delay);
  };

  const handleLogin = async () => {
    // Input validation
    if (!email.trim()) {
      showToast("Email is required", "error");
      return;
    }

    if (!password.trim()) {
      showToast("Password is required", "error");
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
      // Create login request
      const loginRequest: LoginRequest = {
        email: email.trim(),
        password: password.trim(),
      };

      // Call the API
      const response = await authService.login(loginRequest);

      if (response.status && response.data) {
        // Successful login
        showToast("Login successful! Welcome back.", "success");

        try {
          // Update app context with user data
          await contextLogin();

          // Set login status
          await AsyncStorage.setItem("isLoggedIn", "true");
        } catch (contextError) {
          console.warn("Context login failed, but continuing:", contextError);
        }

        // Navigate to Activity on success
        navigateToActivity();
      } else {
        // Login failed
        const errorMessage =
          response.error?.message || "Login failed. Please try again.";
        showToast(errorMessage, "error");
      }
    } catch (error: any) {
      // Handle any unexpected errors
      console.error("Login error:", error);
      let errorMessage = "An unexpected error occurred. Please try again.";

      if (error.code === "NETWORK_ERROR") {
        errorMessage = "Network error. Please check your internet connection.";
      } else if (error.code === "UNAUTHORIZED") {
        errorMessage =
          "Invalid credentials. Please check your email and password.";
      }

      showToast(errorMessage, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    navigation.navigate("ForgotPassword");
  };

  const handleSignUp = () => {
    navigation.navigate("SignupScreen");
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar style="light" />

      {/* Background with subtle pattern */}
      <View style={styles.background}>
        {/* Animated background elements */}
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
              colors={["#00E5FF", "#9C6CDA"]}
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
        {/* Header with logo */}
        <Animated.View
          style={[
            styles.headerContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.logoContainer}>
            <LinearGradient
              colors={["#1A1A1A", "#2A2A2A"]}
              style={styles.logoBackground}
            >
              <Icon name="time-outline" size={scale(40)} color="#00E5FF" />
            </LinearGradient>
          </View>
          <Text style={styles.appName}>Learning Tracker</Text>
          <Text style={styles.appTagline}>
            Master your time, enhance your knowledge
          </Text>
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
            <View style={styles.formHeader}>
              <Text style={styles.welcomeText}>Welcome Back</Text>
              <Text style={styles.loginText}>
                Sign in to continue your learning journey
              </Text>
            </View>

            {/* Email Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <View
                style={[
                  styles.inputContainer,
                  email ? styles.inputContainerFocused : {},
                ]}
              >
                <LinearGradient
                  colors={
                    email
                      ? ["#00E5FF", "#9C6CDA"]
                      : ["transparent", "transparent"]
                  }
                  style={styles.inputBorder}
                >
                  <View style={styles.inputInner}>
                    <Icon
                      name="mail-outline"
                      size={scale(20)}
                      color={email ? "#00E5FF" : "#666"}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your email"
                      placeholderTextColor="#666"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      value={email}
                      onChangeText={setEmail}
                      editable={!isLoading}
                      returnKeyType="next"
                    />
                  </View>
                </LinearGradient>
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password</Text>
              <View
                style={[
                  styles.inputContainer,
                  password ? styles.inputContainerFocused : {},
                ]}
              >
                <LinearGradient
                  colors={
                    password
                      ? ["#00E5FF", "#9C6CDA"]
                      : ["transparent", "transparent"]
                  }
                  style={styles.inputBorder}
                >
                  <View style={styles.inputInner}>
                    <Icon
                      name="lock-closed-outline"
                      size={scale(20)}
                      color={password ? "#00E5FF" : "#666"}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your password"
                      placeholderTextColor="#666"
                      secureTextEntry={!showPassword}
                      value={password}
                      onChangeText={setPassword}
                      editable={!isLoading}
                      returnKeyType="done"
                      onSubmitEditing={handleLogin}
                    />
                    <TouchableOpacity
                      style={styles.eyeIcon}
                      onPress={() => setShowPassword(!showPassword)}
                      disabled={isLoading}
                    >
                      <Icon
                        name={showPassword ? "eye-off-outline" : "eye-outline"}
                        size={scale(20)}
                        color={password ? "#00E5FF" : "#666"}
                      />
                    </TouchableOpacity>
                  </View>
                </LinearGradient>
              </View>
            </View>

            {/* Forgot Password Link */}
            <TouchableOpacity
              style={styles.forgotPasswordContainer}
              onPress={handleForgotPassword}
              disabled={isLoading}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            {/* Login Button */}
            <TouchableOpacity
              style={[
                styles.loginButton,
                isLoading && styles.loginButtonDisabled,
              ]}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={isLoading ? ["#333", "#444"] : ["#00E5FF", "#9C6CDA"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.loginButtonGradient}
              >
                {isLoading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator color="#FFFFFF" size="small" />
                    <Text style={styles.loadingText}>Signing in...</Text>
                  </View>
                ) : (
                  <Text style={styles.loginButtonText}>Sign In</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Demo Credentials */}
            {/* <View style={styles.demoContainer}>
              <LinearGradient
                colors={["rgba(0, 229, 255, 0.1)", "rgba(156, 108, 218, 0.1)"]}
                style={styles.demoGradient}
              >
                <Icon
                  name="information-circle-outline"
                  size={scale(16)}
                  color="#00E5FF"
                />
                <View style={styles.demoContent}>
                  <Text style={styles.demoTitle}>Demo Credentials</Text>
                  <Text style={styles.demoText}>Email: user@example.com</Text>
                  <Text style={styles.demoText}>Password: password123</Text>
                </View>
              </LinearGradient>
            </View> */}

            {/* Sign Up Link */}
            <View style={styles.signUpContainer}>
              <Text style={styles.signUpText}>Don't have an account? </Text>
              <TouchableOpacity onPress={handleSignUp} disabled={isLoading}>
                <Text style={styles.signUpLink}>Sign Up</Text>
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
    marginBottom: scale(50),
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
    fontSize: scale(32),
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
  formHeader: {
    marginBottom: scale(30),
    alignItems: "center",
  },
  welcomeText: {
    fontSize: scale(28),
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: scale(8),
    letterSpacing: 0.5,
  },
  loginText: {
    fontSize: scale(14),
    color: "#9C9C9C",
    textAlign: "center",
    fontWeight: "500",
  },
  inputGroup: {
    marginBottom: scale(20),
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
  inputContainerFocused: {
    // Additional styling when focused
  },
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
  },
  eyeIcon: {
    padding: scale(8),
  },
  forgotPasswordContainer: {
    alignItems: "flex-end",
    marginBottom: scale(30),
  },
  forgotPasswordText: {
    color: "#00E5FF",
    fontSize: scale(14),
    fontWeight: "600",
  },
  loginButton: {
    height: scale(56),
    borderRadius: scale(12),
    overflow: "hidden",
    marginBottom: scale(25),
    elevation: 5,
    shadowColor: "#00E5FF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  loginButtonDisabled: {
    opacity: 0.7,
    elevation: 0,
    shadowOpacity: 0,
  },
  loginButtonGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loginButtonText: {
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
  demoContainer: {
    marginBottom: scale(25),
    borderRadius: scale(12),
    overflow: "hidden",
  },
  demoGradient: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: scale(16),
    borderWidth: 1,
    borderColor: "rgba(0, 229, 255, 0.2)",
  },
  demoContent: {
    flex: 1,
    marginLeft: scale(12),
  },
  demoTitle: {
    color: "#00E5FF",
    fontWeight: "700",
    fontSize: scale(14),
    marginBottom: scale(4),
  },
  demoText: {
    color: "#B0B0B0",
    fontSize: scale(12),
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    lineHeight: scale(16),
  },
  signUpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  signUpText: {
    color: "#9C9C9C",
    fontSize: scale(14),
    fontWeight: "500",
  },
  signUpLink: {
    color: "#9C6CDA",
    fontSize: scale(14),
    fontWeight: "700",
  },
});

export default LoginScreen;
