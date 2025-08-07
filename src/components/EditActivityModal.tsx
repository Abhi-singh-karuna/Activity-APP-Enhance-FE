import React, { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
  Dimensions,
  Platform,
  Animated,
  ActivityIndicator,
  StatusBar,
  Alert,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { Activity, Category } from "../types";
import { LinearGradient } from "expo-linear-gradient";
import { useAppContext } from "../context/AppContext";

interface EditActivityModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (activity: Partial<Activity>) => void;
  activity: Activity | null;
}

// Get device dimensions
const { width, height } = Dimensions.get("window");
const isSmallDevice = width < 375;

// Responsive scaling
const scale = (size: number) => {
  if (isSmallDevice) return size * 0.9;
  return size;
};

// Theme colors
const ThemeColors = {
  primary: "#00E5FF",
  secondary: "#9C6CDA",
  success: "#4ECDC4",
  warning: "#FF9500",
  danger: "#FF4757",
  background: "#000000",
  surface: "#121212",
  card: "#1E1E1E",
  cardSecondary: "#2C2C2E",
  text: "#FFFFFF",
  textSecondary: "#B0B0B0",
  textTertiary: "#808080",
  border: "rgba(255, 255, 255, 0.1)",
};

// Enhanced color palette
const ACTIVITY_COLORS = [
  "#00E5FF",
  "#9C6CDA",
  "#4ECDC4",
  "#FF9500",
  "#FF4757",
  "#FF6B9D",
  "#FFD93D",
  "#6C5CE7",
  "#1E88E5",
  "#8E24AA",
  "#43A047",
  "#FB8C00",
  "#E91E63",
  "#00ACC1",
  "#F44336",
  "#2196F3",
  "#009688",
  "#4CAF50",
  "#FFC107",
  "#9C27B0",
  "#FF5722",
  "#673AB7",
  "#03A9F4",
  "#8BC34A",
];

// Category options
const CATEGORIES = [
  {
    id: "Personal",
    label: "Personal",
    icon: "person",
    color: ThemeColors.primary,
  },
  {
    id: "Work",
    label: "Work",
    icon: "briefcase",
    color: ThemeColors.secondary,
  },
  {
    id: "Workout",
    label: "Workout",
    icon: "fitness",
    color: ThemeColors.success,
  },
  { id: "Study", label: "Study", icon: "school", color: ThemeColors.warning },
  { id: "Health", label: "Health", icon: "medical", color: "#FF6B9D" },
  { id: "Social", label: "Social", icon: "people", color: "#FFD93D" },
  { id: "Travel", label: "Travel", icon: "airplane", color: "#6C5CE7" },
  { id: "Food", label: "Food", icon: "restaurant", color: "#FB8C00" },
];

const EditActivityModal: React.FC<EditActivityModalProps> = ({
  visible,
  onClose,
  onSave,
  activity,
}) => {
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const modalScaleAnim = useRef(new Animated.Value(0.8)).current;

  // Loading state
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [editForm, setEditForm] = useState<Partial<Activity>>({
    title: "",
    category: "Personal",
    color: ACTIVITY_COLORS[0],
    priority: 1,
  });

  // Modal states
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Get context
  const {} = useAppContext();

  // Initialize form when activity changes
  React.useEffect(() => {
    if (activity) {
      setEditForm({
        title: activity.title || "",
        category: activity.category || "Personal",
        color: activity.color || ACTIVITY_COLORS[0],
        priority: activity.priority || 1,
      });
    }
  }, [activity]);

  // Animation when modal opens/closes
  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 8,
          tension: 80,
          useNativeDriver: true,
        }),
        Animated.spring(modalScaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 80,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 50,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(modalScaleAnim, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  // Helper functions
  const validateForm = useCallback(() => {
    const newErrors: { [key: string]: string } = {};

    if (!editForm.title?.trim()) {
      newErrors.title = "Title required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [editForm]);

  const handleSave = useCallback(async () => {
    if (!validateForm()) return;

    try {
      setIsLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      onSave(editForm);
      onClose();
    } catch (error) {
      console.error("Failed to save activity:", error);
      Alert.alert("Error", "Failed to save activity. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [editForm, onSave, onClose, validateForm]);

  return (
    <Modal
      animationType="none"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      <Animated.View style={[styles.modalOverlay, { opacity: fadeAnim }]}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.modalBackdrop} />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[
            styles.modalContainer,
            {
              transform: [{ translateY: slideAnim }, { scale: modalScaleAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={["rgba(30, 30, 30, 0.98)", "rgba(44, 44, 46, 0.95)"]}
            style={styles.modalGradient}
          >
            {/* Header */}
            <View style={styles.modalHeader}>
              <View style={styles.headerLeft}>
                <View style={styles.headerIcon}>
                  <Icon
                    name="create"
                    size={scale(20)}
                    color={ThemeColors.primary}
                  />
                </View>
                <View>
                  <Text style={styles.modalTitle}>Edit Activity</Text>
                  <Text style={styles.modalSubtitle}>
                    Update activity details
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.closeButton}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <Icon
                  name="close"
                  size={scale(18)}
                  color={ThemeColors.textSecondary}
                />
              </TouchableOpacity>
            </View>

            {/* Content */}
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Title Input */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Activity Title</Text>
                <View
                  style={[
                    styles.inputContainer,
                    errors.title && styles.inputError,
                  ]}
                >
                  <TextInput
                    style={[styles.input, { fontSize: scale(14) }]}
                    placeholder="Enter activity title"
                    placeholderTextColor={ThemeColors.textTertiary}
                    value={editForm.title}
                    onChangeText={(text) => {
                      setEditForm((prev) => ({ ...prev, title: text }));
                      if (errors.title) {
                        setErrors((prev) => ({ ...prev, title: "" }));
                      }
                    }}
                    maxLength={40}
                  />
                  <Icon
                    name="create-outline"
                    size={scale(16)}
                    color={ThemeColors.textSecondary}
                  />
                </View>
                {errors.title && (
                  <Text style={styles.errorText}>{errors.title}</Text>
                )}
              </View>

              {/* Category Selection */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Category</Text>
                <View style={styles.categoryGrid}>
                  {CATEGORIES.map((category) => (
                    <TouchableOpacity
                      key={category.id}
                      style={[
                        styles.categoryItem,
                        editForm.category === category.id &&
                          styles.categoryItemSelected,
                      ]}
                      onPress={() =>
                        setEditForm((prev) => ({
                          ...prev,
                          category: category.id as any,
                        }))
                      }
                      activeOpacity={0.8}
                    >
                      <LinearGradient
                        colors={
                          editForm.category === category.id
                            ? [category.color, `${category.color}CC`]
                            : [
                                "rgba(255, 255, 255, 0.08)",
                                "rgba(255, 255, 255, 0.04)",
                              ]
                        }
                        style={styles.categoryGradient}
                      >
                        <Icon
                          name={category.icon}
                          size={scale(16)}
                          color={
                            editForm.category === category.id
                              ? "#fff"
                              : ThemeColors.textSecondary
                          }
                        />
                        <Text
                          style={[
                            styles.categoryText,
                            editForm.category === category.id &&
                              styles.categoryTextSelected,
                          ]}
                        >
                          {category.label}
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Priority Selection */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Priority Level</Text>
                <View style={styles.priorityContainer}>
                  {[1, 2, 3].map((priority) => (
                    <TouchableOpacity
                      key={priority}
                      style={[
                        styles.priorityItem,
                        editForm.priority === priority &&
                          styles.priorityItemSelected,
                      ]}
                      onPress={() =>
                        setEditForm((prev) => ({ ...prev, priority }))
                      }
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.priorityText,
                          editForm.priority === priority &&
                            styles.priorityTextSelected,
                        ]}
                      >
                        {priority}
                      </Text>
                      <Text style={styles.priorityLabel}>
                        {priority === 1
                          ? "Low"
                          : priority === 2
                          ? "Medium"
                          : "High"}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Color Selection */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Activity Color</Text>
                <View style={styles.colorGrid}>
                  {ACTIVITY_COLORS.map((color) => (
                    <TouchableOpacity
                      key={color}
                      style={[
                        styles.colorItem,
                        { backgroundColor: color },
                        editForm.color === color && styles.colorItemSelected,
                      ]}
                      onPress={() =>
                        setEditForm((prev) => ({ ...prev, color }))
                      }
                      activeOpacity={0.8}
                    >
                      {editForm.color === color && (
                        <Icon name="checkmark" size={scale(14)} color="#fff" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>

            {/* Footer Actions */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={onClose}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[
                    "rgba(255, 255, 255, 0.1)",
                    "rgba(255, 255, 255, 0.05)",
                  ]}
                  style={styles.cancelButtonGradient}
                >
                  <Icon
                    name="close-circle-outline"
                    size={scale(16)}
                    color={ThemeColors.textSecondary}
                  />
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSave}
                disabled={isLoading}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={[ThemeColors.success, "#44A08D"]}
                  style={[
                    styles.saveButtonGradient,
                    isLoading && styles.saveButtonDisabled,
                  ]}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Icon
                        name="checkmark-circle"
                        size={scale(18)}
                        color="#fff"
                      />
                      <Text style={styles.saveButtonText}>Save Changes</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    width: "90%",
    maxWidth: 500,
    maxHeight: height * 0.85,
    borderRadius: scale(20),
    overflow: "hidden",
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 25,
  },
  modalGradient: {
    flex: 1,
    borderWidth: 1,
    borderColor: ThemeColors.border,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: scale(24),
    paddingVertical: scale(20),
    borderBottomWidth: 0.5,
    borderBottomColor: ThemeColors.border,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  headerIcon: {
    marginRight: scale(12),
  },
  modalTitle: {
    color: ThemeColors.text,
    fontSize: scale(20),
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  modalSubtitle: {
    color: ThemeColors.textSecondary,
    fontSize: scale(12),
    marginTop: scale(2),
  },
  closeButton: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: scale(24),
    paddingVertical: scale(20),
  },
  formGroup: {
    marginBottom: scale(20),
  },
  formLabel: {
    color: ThemeColors.text,
    fontSize: scale(14),
    fontWeight: "600",
    marginBottom: scale(8),
    letterSpacing: 0.2,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: scale(12),
    paddingHorizontal: scale(16),
    paddingVertical: scale(14),
    borderWidth: 1,
    borderColor: ThemeColors.border,
  },
  input: {
    flex: 1,
    color: ThemeColors.text,
    fontWeight: "500",
  },
  inputError: {
    borderColor: ThemeColors.danger,
  },
  errorText: {
    color: ThemeColors.danger,
    fontSize: scale(11),
    marginTop: scale(4),
    marginLeft: scale(4),
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: scale(8),
  },
  categoryItem: {
    borderRadius: scale(10),
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  categoryItemSelected: {
    elevation: 4,
    shadowOpacity: 0.3,
  },
  categoryGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: scale(12),
    paddingVertical: scale(8),
    borderWidth: 1,
    borderColor: ThemeColors.border,
    gap: scale(6),
    minWidth: scale(80),
    justifyContent: "center",
  },
  categoryText: {
    color: ThemeColors.textSecondary,
    fontSize: scale(12),
    fontWeight: "600",
  },
  categoryTextSelected: {
    color: "#fff",
  },
  priorityContainer: {
    flexDirection: "row",
    gap: scale(8),
  },
  priorityItem: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: scale(10),
    paddingVertical: scale(12),
    borderWidth: 1,
    borderColor: ThemeColors.border,
  },
  priorityItemSelected: {
    backgroundColor: "rgba(0, 229, 255, 0.15)",
    borderColor: ThemeColors.primary,
  },
  priorityText: {
    color: ThemeColors.text,
    fontSize: scale(18),
    fontWeight: "700",
  },
  priorityTextSelected: {
    color: ThemeColors.primary,
  },
  priorityLabel: {
    color: ThemeColors.textSecondary,
    fontSize: scale(10),
    marginTop: scale(2),
  },
  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: scale(8),
  },
  colorItem: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  colorItemSelected: {
    elevation: 6,
    shadowOpacity: 0.4,
    borderWidth: 3,
    borderColor: "#fff",
  },
  textAreaContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: scale(12),
    paddingHorizontal: scale(16),
    paddingVertical: scale(12),
    borderWidth: 1,
    borderColor: ThemeColors.border,
  },
  textArea: {
    color: ThemeColors.text,
    fontWeight: "500",
    textAlignVertical: "top",
    minHeight: scale(80),
  },

  modalFooter: {
    flexDirection: "row",
    paddingHorizontal: scale(24),
    paddingVertical: scale(20),
    borderTopWidth: 0.5,
    borderTopColor: ThemeColors.border,
    gap: scale(12),
  },
  cancelButton: {
    flex: 1,
    borderRadius: scale(12),
    overflow: "hidden",
  },
  cancelButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: scale(14),
    borderWidth: 1,
    borderColor: ThemeColors.border,
    gap: scale(6),
  },
  cancelButtonText: {
    color: ThemeColors.textSecondary,
    fontSize: scale(14),
    fontWeight: "600",
  },
  saveButton: {
    flex: 2,
    borderRadius: scale(12),
    overflow: "hidden",
  },
  saveButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: scale(16),
    gap: scale(8),
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: scale(15),
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});

export default EditActivityModal;
