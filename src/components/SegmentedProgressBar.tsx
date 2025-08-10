import React, { memo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { ThemeColors } from "../config/theme";

export type SegmentedValue = {
  value: number; // raw units for this segment (e.g., minutes)
  color?: string;
  label?: string; // text displayed inside the segment
};

type SegmentedProgressBarProps = {
  segments: SegmentedValue[];
  total: number; // total capacity of the bar in the same units as value
  height?: number;
  radius?: number;
  showLabels?: boolean;
  minLabelPctToShow?: number; // hide labels if the segment is too thin
};

const SegmentedProgressBar: React.FC<SegmentedProgressBarProps> = memo(
  ({
    segments,
    total,
    height = 18,
    radius = 10,
    showLabels = true,
    minLabelPctToShow = 12,
  }) => {
    const sanitizedTotal = Math.max(total, 0.0001);
    const used = Math.max(
      0,
      segments.reduce((acc, s) => acc + Math.max(s.value, 0), 0)
    );
    const remainder = Math.max(0, sanitizedTotal - used);

    const normalized = segments.map((s) => ({
      pct: Math.min(100, (Math.max(s.value, 0) / sanitizedTotal) * 100),
      color: s.color || ThemeColors.success,
      label: s.label,
    }));

    return (
      <View
        style={[
          styles.track,
          {
            height,
            borderRadius: radius,
          },
        ]}
      >
        {/* Colored segments */}
        {normalized.map((seg, idx) => {
          const isFirst = idx === 0;
          const isLast = idx === normalized.length - 1 && remainder === 0;
          const showLabel = showLabels && seg.pct >= minLabelPctToShow;
          return (
            <View
              key={`seg-${idx}`}
              style={{
                width: `${seg.pct}%`,
                backgroundColor: seg.color,
                height: "100%",
                justifyContent: "center",
                alignItems: "center",
                borderTopLeftRadius: isFirst ? radius : 0,
                borderBottomLeftRadius: isFirst ? radius : 0,
                borderTopRightRadius: isLast ? radius : 0,
                borderBottomRightRadius: isLast ? radius : 0,
              }}
            >
              {showLabel && (
                <Text style={styles.segmentLabel} numberOfLines={1}>
                  {seg.label}
                </Text>
              )}
            </View>
          );
        })}

        {/* Remainder (keeps rounded end visible) */}
        {remainder > 0 && (
          <View
            style={{
              width: `${(remainder / sanitizedTotal) * 100}%`,
              height: "100%",
              borderTopRightRadius: radius,
              borderBottomRightRadius: radius,
            }}
          />
        )}
      </View>
    );
  }
);

const styles = StyleSheet.create({
  track: {
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    overflow: "hidden",
    flexDirection: "row",
  },
  segmentLabel: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 12,
  },
});

export default SegmentedProgressBar;
