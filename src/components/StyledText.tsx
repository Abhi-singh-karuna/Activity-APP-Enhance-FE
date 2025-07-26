import React from "react";
import { Text, TextProps, StyleSheet } from "react-native";
import { useAppContext } from "../context/AppContext";

interface StyledTextProps extends TextProps {
  variant?: "title" | "subtitle" | "body" | "caption";
  color?: string;
}

const StyledText: React.FC<StyledTextProps> = ({
  variant = "body",
  color,
  style,
  children,
  ...props
}) => {
  const { fontSizeMultiplier } = useAppContext();

  // Base font sizes for different text variants
  const baseFontSizes = {
    title: 24,
    subtitle: 18,
    body: 16,
    caption: 14,
  };

  // Calculate adjusted font size based on user preference
  const fontSize = baseFontSizes[variant] * fontSizeMultiplier;

  // Calculate line height based on font size for better readability
  const lineHeight = fontSize * 1.5;

  // Combine styles with adjusted font size
  const combinedStyle = [
    styles[variant],
    { fontSize, lineHeight },
    color ? { color } : null,
    style,
  ];

  return (
    <Text style={combinedStyle} {...props}>
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  title: {
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
  },
  subtitle: {
    fontWeight: "600",
    color: "#fff",
    marginBottom: 6,
  },
  body: {
    color: "#fff",
  },
  caption: {
    color: "#8e8e93",
  },
});

export default StyledText;
