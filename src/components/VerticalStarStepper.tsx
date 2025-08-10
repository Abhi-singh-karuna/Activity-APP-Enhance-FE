import React, { memo } from "react";
import { View, Text, StyleSheet } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { ThemeColors } from "../config/theme";

type VerticalStarStepperProps = {
  progressPercent: number; // 0-100
  labels?: string[]; // 5 labels for each stage
  height?: number; // rail height in px
  icons?: (string | React.ReactNode)[]; // optional emoji or node for each row
};

const DEFAULT_LABELS = [
  "Very low",
  "Getting started",
  "On track",
  "Nearly there",
  "Excellent",
];

function getColorByPercent(percent: number): string {
  if (percent < 20) return "#FF3B30"; // red
  if (percent < 40) return "#FF6B6B"; // light red
  if (percent < 60) return "#FFC400"; // yellow
  if (percent < 80) return "#FFE082"; // light yellow
  return "#4CAF50"; // green
}

const VerticalStarStepper: React.FC<VerticalStarStepperProps> = memo(
  ({ progressPercent, labels = DEFAULT_LABELS, height = 280, icons }) => {
    const clamped = Math.max(0, Math.min(100, progressPercent));
    const activeStep = Math.max(1, Math.ceil(clamped / 20)); // 1..5
    const color = getColorByPercent(clamped);
    const steps = 5;

    const spacing = height / (steps - 1);
    const fillHeight = (clamped / 100) * height;
    const ROW_HEIGHT = 28;
    const DOT_SIZE = 18;
    const DOT_RADIUS = DOT_SIZE / 2;

    return (
      <View style={[styles.container, { minHeight: height }]}>
        {/* Left column: star rows with text */}
        <View style={[styles.leftColumn, { height, position: "relative" }]}>
          {Array.from({ length: steps }).map((_, idx) => {
            const step = idx + 1;
            const isActive = step <= activeStep;
            return (
              <View
                key={`row-${idx}`}
                style={[
                  styles.row,
                  {
                    position: "absolute",
                    top: idx * spacing,
                    transform: [{ translateY: -ROW_HEIGHT / 2 }],
                    height: ROW_HEIGHT,
                  },
                ]}
              >
                {icons && icons[idx] ? (
                  <View style={styles.iconCell}>
                    {typeof icons[idx] === "string" ? (
                      <Text style={styles.emoji}>{icons[idx] as string}</Text>
                    ) : (
                      icons[idx]
                    )}
                  </View>
                ) : (
                  <View style={styles.iconCell} />
                )}
                <View style={styles.starsRow}>
                  {Array.from({ length: step }).map((__, starIdx) => (
                    <Icon
                      key={`star-${idx}-${starIdx}`}
                      name="star"
                      size={14}
                      color={isActive ? color : ThemeColors.textSecondary}
                      style={{ marginRight: 2 }}
                    />
                  ))}
                </View>
                <Text
                  style={[
                    styles.label,
                    { color: isActive ? color : ThemeColors.textSecondary },
                  ]}
                >
                  {labels[idx]}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Right column: vertical rail with nodes */}
        <View style={[styles.rightColumn, { height }]}>
          <View
            style={[
              styles.rail,
              { backgroundColor: "rgba(255,255,255,0.2)", height },
            ]}
          />
          <View
            style={[
              styles.railFill,
              { height: fillHeight, backgroundColor: color },
            ]}
          />

          {Array.from({ length: steps }).map((_, idx) => {
            const step = idx + 1;
            const isCompleted = step < activeStep;
            const isCurrent = step === activeStep && clamped % 20 !== 0;
            return (
              <View
                key={`dot-${idx}`}
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: idx * spacing - DOT_RADIUS,
                  alignItems: "center",
                }}
              >
                <View
                  style={[
                    styles.dot,
                    {
                      width: DOT_SIZE,
                      height: DOT_SIZE,
                      borderRadius: DOT_RADIUS,
                      backgroundColor: isCompleted ? color : ThemeColors.card,
                      borderColor: isCompleted || isCurrent ? color : "#9E9E9E",
                    },
                  ]}
                >
                  {isCompleted ? (
                    <Icon name="checkmark" size={10} color="#fff" />
                  ) : isCurrent ? (
                    <View
                      style={{
                        width: DOT_SIZE * 0.45,
                        height: DOT_SIZE * 0.45,
                        borderRadius: (DOT_SIZE * 0.45) / 2,
                        backgroundColor: color,
                      }}
                    />
                  ) : null}
                </View>
              </View>
            );
          })}
        </View>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "stretch",
    marginVertical: 12,
  },
  leftColumn: {
    flex: 1,
    paddingRight: 12,
    gap: 0,
  },
  rightColumn: {
    width: 32,
    position: "relative",
    justifyContent: "flex-start",
  },
  iconCell: {
    width: 26,
    alignItems: "center",
    marginRight: 6,
  },
  emoji: {
    fontSize: 18,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  starsRow: {
    flexDirection: "row",
    alignItems: "center",
    minWidth: 70,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
  },
  rail: {
    position: "absolute",
    left: 15,
    top: 0,
    width: 2.5,
    borderRadius: 2,
  },
  railFill: {
    position: "absolute",
    left: 15,
    top: 0,
    width: 2.5,
    borderRadius: 2,
  },
  dot: {
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: ThemeColors.card,
  },
});

export default VerticalStarStepper;
