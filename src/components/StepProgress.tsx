import React, { memo, useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { ThemeColors } from "../config/theme";
import { LinearGradient } from "expo-linear-gradient";

type StepProgressProps = {
  steps: string[]; // labels
  progressPercent: number; // 0-100
  activeColor?: string;
  inactiveColor?: string;
  trackHeight?: number;
  dotSize?: number;
  activeGradient?: [string, string];
  animate?: boolean;
};

const StepProgress: React.FC<StepProgressProps> = memo(
  ({
    steps,
    progressPercent,
    activeColor = "#C28A52",
    inactiveColor = "rgba(255,255,255,0.25)",
    trackHeight = 4,
    dotSize = 18,
    activeGradient,
    animate = true,
  }) => {
    const clamped = Math.max(0, Math.min(100, progressPercent));
    const stepWidthPct = 100 / Math.max(1, steps.length - 1);

    const completedCount = Math.floor((clamped + 0.001) / (100 / steps.length));

    // Animate fill width on mount / updates
    const widthAnim = useRef(new Animated.Value(0)).current;
    useEffect(() => {
      if (!animate) return;
      Animated.timing(widthAnim, {
        toValue: clamped,
        duration: 600,
        useNativeDriver: false,
      }).start();
    }, [clamped, animate]);

    // Pulse the current dot subtly
    const pulse = useRef(new Animated.Value(0)).current;
    useEffect(() => {
      if (!animate) return;
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulse, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }, [animate]);

    return (
      <View>
        {/* Track */}
        <View style={[styles.track, { height: trackHeight }]}>
          <View
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 0,
              bottom: 0,
              backgroundColor: inactiveColor,
              borderRadius: trackHeight / 2,
            }}
          />
          <Animated.View
            style={{
              position: "absolute",
              left: 0,
              width: animate
                ? widthAnim.interpolate({
                    inputRange: [0, 100],
                    outputRange: ["0%", "100%"],
                  })
                : `${clamped}%`,
              top: 0,
              bottom: 0,
              overflow: "hidden",
              borderRadius: trackHeight / 2,
            }}
          >
            {activeGradient ? (
              <LinearGradient
                colors={activeGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ flex: 1 }}
              />
            ) : (
              <View style={{ flex: 1, backgroundColor: activeColor }} />
            )}
          </Animated.View>

          {/* Dots */}
          {steps.map((_, idx) => {
            const leftPct = idx * stepWidthPct;
            const isCompleted = idx < completedCount;
            const isCurrent =
              idx === completedCount && clamped % (100 / steps.length) !== 0;
            const dotColor =
              isCompleted || isCurrent ? activeColor : inactiveColor;
            const isCurrentDot = isCurrent && !isCompleted;
            return (
              <Animated.View
                key={`dot-${idx}`}
                style={{
                  position: "absolute",
                  left: `${leftPct}%`,
                  transform: [
                    { translateX: -dotSize / 2 },
                    ...(isCurrentDot
                      ? [
                          {
                            scale: pulse.interpolate({
                              inputRange: [0, 1],
                              outputRange: [1, 1.08],
                            }),
                          },
                        ]
                      : []),
                  ],
                  top: -(dotSize / 2 - trackHeight / 2),
                  width: dotSize,
                  height: dotSize,
                  borderRadius: dotSize / 2,
                  backgroundColor: dotColor,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                {isCompleted && (
                  <Icon name="checkmark" size={dotSize * 0.6} color="#fff" />
                )}
                {isCurrentDot && (
                  <View
                    style={{
                      width: dotSize * 0.5,
                      height: dotSize * 0.5,
                      borderRadius: (dotSize * 0.5) / 2,
                      backgroundColor: "#fff",
                    }}
                  />
                )}
              </Animated.View>
            );
          })}
        </View>

        {/* Labels */}
        <View style={styles.labelsRow}>
          {steps.map((label, idx) => {
            const isActive = idx < completedCount;
            return (
              <View key={`label-${idx}`} style={styles.labelCell}>
                <Text
                  style={[
                    styles.label,
                    {
                      color: isActive ? activeColor : ThemeColors.textSecondary,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {label}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  track: {
    width: "100%",
    position: "relative",
    borderRadius: 999,
    justifyContent: "center",
  },
  labelsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 14,
  },
  labelCell: {
    flex: 1,
    alignItems: "center",
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
  },
});

export default StepProgress;
