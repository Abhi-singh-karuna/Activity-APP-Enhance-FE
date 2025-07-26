import React from "react";
import { View, StyleSheet, TouchableOpacity, FlatList } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { format } from "date-fns";
import StyledText from "./StyledText";
import { SkipDayEntry } from "../api/apiClient";

interface SkipDayListProps {
  skipDayEntries: SkipDayEntry[];
  onEditSkipDay: (entry: SkipDayEntry) => void;
  onDeleteSkipDay: (id: string) => void;
}

const SkipDayList: React.FC<SkipDayListProps> = ({
  skipDayEntries,
  onEditSkipDay,
  onDeleteSkipDay,
}) => {
  // Function to format date display
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return format(date, "MMM dd, yyyy");
    } catch (error) {
      return dateString;
    }
  };

  // Function to get a color for a skip reason
  const getReasonColor = (reason: string): string => {
    switch (reason.toLowerCase()) {
      case "sick":
        return "#FF5722";
      case "vacation":
        return "#4CAF50";
      case "holiday":
        return "#2196F3";
      case "personal day":
        return "#9C27B0";
      case "emergency":
        return "#F44336";
      default:
        return "#607D8B";
    }
  };

  // Render empty state
  if (skipDayEntries.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Icon name="calendar-outline" size={40} color="rgba(255,255,255,0.2)" />
        <StyledText variant="body" style={styles.emptyStateText}>
          No skip days scheduled
        </StyledText>
      </View>
    );
  }

  return (
    <FlatList
      data={skipDayEntries}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View style={styles.skipDayItem}>
          <View style={styles.skipDayHeader}>
            <View
              style={[
                styles.skipDayBadge,
                { backgroundColor: getReasonColor(item.reason) },
              ]}
            >
              <Icon name="time-outline" size={16} color="#fff" />
              <StyledText variant="body" style={styles.skipDayReasonText}>
                {item.reason}
              </StyledText>
            </View>
            <View style={styles.skipDayActions}>
              <TouchableOpacity
                style={styles.skipDayEditButton}
                onPress={() => onEditSkipDay(item)}
              >
                <Icon name="pencil-outline" size={18} color="#36D1DC" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.skipDayDeleteButton}
                onPress={() => onDeleteSkipDay(item.id)}
              >
                <Icon name="trash-outline" size={18} color="#FF4757" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.skipDayDates}>
            <StyledText variant="caption" style={styles.skipDayDatesLabel}>
              Dates:
            </StyledText>
            <View style={styles.dateChips}>
              {item.dates.map((date, idx) => (
                <View key={idx} style={styles.dateChip}>
                  <Icon name="calendar-outline" size={12} color="#fff" />
                  <StyledText style={styles.dateChipText}>
                    {formatDate(date.date)}
                  </StyledText>
                </View>
              ))}
            </View>
          </View>

          {item.generalNote && (
            <View style={styles.skipDayNote}>
              <StyledText variant="caption" style={styles.skipDayNoteLabel}>
                Note:
              </StyledText>
              <StyledText variant="body" style={styles.skipDayNoteText}>
                {item.generalNote}
              </StyledText>
            </View>
          )}
        </View>
      )}
    />
  );
};

const styles = StyleSheet.create({
  skipDayItem: {
    backgroundColor: "#2C2C2E",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  skipDayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  skipDayBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  skipDayReasonText: {
    color: "#fff",
    marginLeft: 6,
    fontWeight: "500",
  },
  skipDayActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  skipDayEditButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(54, 209, 220, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  skipDayDeleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 71, 87, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  skipDayDates: {
    marginBottom: 8,
  },
  skipDayDatesLabel: {
    color: "#999",
    marginBottom: 6,
  },
  dateChips: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dateChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(54, 209, 220, 0.2)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  dateChipText: {
    color: "#fff",
    fontSize: 12,
    marginLeft: 4,
  },
  skipDayNote: {
    marginTop: 4,
  },
  skipDayNoteLabel: {
    color: "#999",
    marginBottom: 2,
  },
  skipDayNoteText: {
    color: "#fff",
    fontStyle: "italic",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 30,
  },
  emptyStateText: {
    color: "rgba(255,255,255,0.5)",
    marginTop: 10,
  },
});

export default SkipDayList;
