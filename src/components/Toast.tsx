import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Platform,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import StyledText from "./StyledText";

export type ToastType = "success" | "error" | "info" | "warning";

interface ToastProps {
  visible: boolean;
  message: string;
  type?: ToastType;
  duration?: number;
  onHide?: () => void;
}

const Toast: React.FC<ToastProps> = ({
  visible,
  message,
  type = "info",
  duration = 3000,
  onHide,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(100)).current;

  // Color configurations for different toast types
  const toastConfigs = {
    success: {
      backgroundColor: "#4CAF50",
      icon: "checkmark-circle",
      borderColor: "#43A047",
    },
    error: {
      backgroundColor: "#F44336",
      icon: "close-circle",
      borderColor: "#D32F2F",
    },
    info: {
      backgroundColor: "#2196F3",
      icon: "information-circle",
      borderColor: "#1976D2",
    },
    warning: {
      backgroundColor: "#FF9800",
      icon: "warning",
      borderColor: "#F57C00",
    },
  };

  // Get the config for the current toast type
  const config = toastConfigs[type];

  useEffect(() => {
    if (visible) {
      // Start animations when visible changes to true
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          friction: 8,
          tension: 80,
          useNativeDriver: true,
        }),
      ]).start();

      // Set up timer to hide the toast
      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      // Clear the timeout when component unmounts or visible changes
      return () => clearTimeout(timer);
    } else {
      // Reset animations when visible changes to false
      fadeAnim.setValue(0);
      translateY.setValue(100);
    }
  }, [visible]);

  const hideToast = () => {
    // Animate toast disappearance
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 100,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Call onHide callback when animation is complete
      if (onHide) {
        onHide();
      }
    });
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY }],
          backgroundColor: config.backgroundColor,
          borderColor: config.borderColor,
        },
      ]}
    >
      <View style={styles.contentContainer}>
        <Icon name={config.icon} size={24} color="#fff" style={styles.icon} />
        <StyledText variant="body" style={styles.message}>
          {message}
        </StyledText>
      </View>
      <TouchableOpacity style={styles.closeButton} onPress={hideToast}>
        <Icon name="close" size={20} color="#fff" />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: "#333",
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
    elevation: 6,
    borderWidth: 1,
    borderLeftWidth: 5,
  },
  contentContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    marginRight: 12,
  },
  message: {
    color: "#fff",
    flex: 1,
    fontSize: 14,
  },
  closeButton: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
});

export default Toast;
