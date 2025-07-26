import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  TextInput,
  Alert,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  parseISO,
} from "date-fns";
import StyledText from "./StyledText";
import { SkipDayDate } from "../api/apiClient";

interface DatePickerProps {
  selectedDates: SkipDayDate[];
  onDateSelect: (dates: SkipDayDate[]) => void;
  maxSelectableDates?: number;
}

const DatePicker: React.FC<DatePickerProps> = ({
  selectedDates,
  onDateSelect,
  maxSelectableDates = 5,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [noteModalVisible, setNoteModalVisible] = useState(false);
  const [currentDate, setCurrentDate] = useState<string>("");
  const [currentNote, setCurrentNote] = useState<string>("");

  // Generate days for current month
  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  // Move to previous month
  const prevMonth = () => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() - 1);
    setCurrentMonth(newMonth);
  };

  // Move to next month
  const nextMonth = () => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + 1);
    setCurrentMonth(newMonth);
  };

  // Convert a Date to ISO string date (YYYY-MM-DD)
  const toISODateString = (date: Date): string => {
    return format(date, "yyyy-MM-dd");
  };

  // Format a date for display
  const formatDateForDisplay = (dateString: string): string => {
    try {
      const date = parseISO(dateString);
      return format(date, "MMM dd, yyyy");
    } catch (error) {
      return dateString;
    }
  };

  // Find a date object in the selected dates
  const findDateObject = (dateString: string): SkipDayDate | undefined => {
    return selectedDates.find((d) => d.date === dateString);
  };

  // Check if a date is selected
  const isDateSelected = (date: Date): boolean => {
    const dateString = toISODateString(date);
    const isSelected = selectedDates.some((d) => d.date === dateString);
    return isSelected;
  };

  // Handle date selection
  const toggleDateSelection = (date: Date) => {
    const dateString = toISODateString(date);
    const existingDateObject = findDateObject(dateString);

    if (existingDateObject) {
      // Remove the date if already selected
      console.log("Removing date:", dateString);
      const updatedDates = selectedDates.filter((d) => d.date !== dateString);
      console.log("Updated dates after removal:", updatedDates);
      onDateSelect(updatedDates);
    } else {
      // Add the date if not at max limit
      if (selectedDates.length < maxSelectableDates) {
        // Show note modal for the new date
        console.log("Opening note modal for new date:", dateString);
        setCurrentDate(dateString);
        setCurrentNote("");
        setNoteModalVisible(true);
      } else {
        // Alert user that they've reached the maximum
        Alert.alert(
          "Maximum Dates Reached",
          `You can select up to ${maxSelectableDates} dates.`
        );
      }
    }
  };

  // Handle adding a date with note
  const handleAddDateWithNote = () => {
    if (!currentDate) {
      console.error("No current date to add");
      return;
    }

    // Check if the date already exists in the selected dates
    const dateExists = selectedDates.some((d) => d.date === currentDate);
    if (dateExists) {
      console.warn("Date already exists:", currentDate);
      setNoteModalVisible(false);
      return;
    }

    const newEntry: SkipDayDate = {
      date: currentDate,
      note: currentNote.trim() || undefined,
    };

    console.log("Adding new date:", newEntry);
    console.log("Current selected dates:", JSON.stringify(selectedDates));

    // Create a new array with the new date added
    const updatedDates = [...selectedDates, newEntry];
    console.log("Updated dates after adding:", JSON.stringify(updatedDates));

    // Make sure to call onDateSelect with the updated dates
    onDateSelect(updatedDates);
    setNoteModalVisible(false);
  };

  // Handle editing a note for an existing date
  const handleEditNote = (date: string) => {
    const dateObject = findDateObject(date);
    if (dateObject) {
      setCurrentDate(date);
      setCurrentNote(dateObject.note || "");
      setNoteModalVisible(true);
    }
  };

  // Handle saving an edited note
  const handleSaveNote = () => {
    if (!currentDate) {
      console.error("No current date selected for editing note");
      setNoteModalVisible(false);
      return;
    }

    console.log("Saving note for date:", currentDate);
    console.log("Note content:", currentNote);
    console.log("Current selected dates:", JSON.stringify(selectedDates));

    // Create a new array with the updated note
    const updatedDates = selectedDates.map((d) =>
      d.date === currentDate
        ? { ...d, note: currentNote.trim() || undefined }
        : d
    );

    console.log(
      "Updated dates after saving note:",
      JSON.stringify(updatedDates)
    );

    // Make sure to call onDateSelect with the updated dates
    onDateSelect(updatedDates);
    setNoteModalVisible(false);
  };

  // Handle removing a date
  const handleRemoveDate = (dateToRemove: string) => {
    console.log("Removing date:", dateToRemove);
    console.log("Current dates before removal:", JSON.stringify(selectedDates));

    // Create a new array without the removed date
    const updatedDates = selectedDates.filter((d) => d.date !== dateToRemove);

    console.log("Updated dates after removal:", JSON.stringify(updatedDates));

    // Make sure we're updating the selected dates
    onDateSelect(updatedDates);
  };

  // Format the display of selected dates for the button
  const getSelectedDatesDisplay = () => {
    if (!selectedDates || selectedDates.length === 0) {
      return "Select dates";
    } else if (selectedDates.length === 1) {
      return formatDateForDisplay(selectedDates[0].date);
    } else {
      return `${selectedDates.length} dates selected`;
    }
  };

  // Add useEffect to log when selectedDates prop changes
  useEffect(() => {
    console.log(
      "DatePicker selectedDates changed:",
      JSON.stringify(selectedDates)
    );
  }, [selectedDates]);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.button}
        onPress={() => setModalVisible(true)}
      >
        <Icon name="calendar-outline" size={20} color="#36D1DC" />
        <StyledText style={styles.buttonText}>
          {getSelectedDatesDisplay()}
        </StyledText>
        <Icon name="chevron-down" size={16} color="#999" />
      </TouchableOpacity>

      {selectedDates.length > 0 && (
        <View style={styles.selectedDatesContainer}>
          <FlatList
            data={selectedDates}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.date}
            renderItem={({ item }) => {
              console.log("Rendering date chip for:", item.date);
              return (
                <View style={styles.dateChip}>
                  <StyledText style={styles.dateChipText}>
                    {formatDateForDisplay(item.date)}
                  </StyledText>
                  <View style={styles.dateChipActions}>
                    <TouchableOpacity
                      onPress={() => handleEditNote(item.date)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      style={styles.noteButton}
                    >
                      <Icon
                        name={item.note ? "document" : "document-outline"}
                        size={14}
                        color={item.note ? "#36D1DC" : "#fff"}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleRemoveDate(item.date)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Icon name="close-circle" size={16} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            }}
          />
        </View>
      )}

      {/* Date Calendar Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={prevMonth}>
                <Icon name="chevron-back" size={24} color="#36D1DC" />
              </TouchableOpacity>

              <StyledText variant="subtitle" style={styles.monthTitle}>
                {format(currentMonth, "MMMM yyyy")}
              </StyledText>

              <TouchableOpacity onPress={nextMonth}>
                <Icon name="chevron-forward" size={24} color="#36D1DC" />
              </TouchableOpacity>
            </View>

            <View style={styles.weekdayHeader}>
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                (day, index) => (
                  <StyledText key={index} style={styles.weekdayText}>
                    {day}
                  </StyledText>
                )
              )}
            </View>

            <View style={styles.daysGrid}>
              {/* Add empty placeholders for days before the first of the month */}
              {Array.from({ length: daysInMonth[0].getDay() }).map(
                (_, index) => (
                  <View key={`empty-${index}`} style={styles.dayPlaceholder} />
                )
              )}

              {/* Render days of the month */}
              {daysInMonth.map((date) => {
                const dateString = toISODateString(date);
                const isSelected = isDateSelected(date);
                const dateObj = findDateObject(dateString);
                const hasNote = dateObj?.note;

                return (
                  <TouchableOpacity
                    key={date.toISOString()}
                    style={[
                      styles.dayButton,
                      isSelected && styles.selectedDayButton,
                    ]}
                    onPress={() => {
                      console.log("Day pressed:", dateString);
                      toggleDateSelection(date);
                    }}
                  >
                    <StyledText
                      style={[
                        styles.dayText,
                        isSelected && styles.selectedDayText,
                      ]}
                    >
                      {date.getDate()}
                    </StyledText>
                    {hasNote && <View style={styles.noteDot} />}
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.footerButton}
                onPress={() => {
                  setModalVisible(false);
                }}
              >
                <StyledText style={styles.footerButtonText}>
                  Done ({selectedDates.length}/{maxSelectableDates})
                </StyledText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Note Input Modal */}
      <Modal
        visible={noteModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setNoteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.noteModalContent]}>
            <StyledText variant="subtitle" style={styles.noteModalTitle}>
              {findDateObject(currentDate)
                ? "Edit Note for Date"
                : "Add Note for Date"}
            </StyledText>

            <StyledText style={styles.dateDisplay}>
              {currentDate ? formatDateForDisplay(currentDate) : ""}
            </StyledText>

            <TextInput
              style={styles.noteInput}
              placeholder="Add a note for this date (optional)"
              placeholderTextColor="#999"
              value={currentNote}
              onChangeText={setCurrentNote}
              multiline
              numberOfLines={4}
            />

            <View style={styles.noteModalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  if (!findDateObject(currentDate)) {
                    // If adding new date and canceled, don't add the date
                    setNoteModalVisible(false);
                  } else {
                    // If editing existing date, just close the modal
                    setNoteModalVisible(false);
                  }
                }}
              >
                <StyledText style={styles.cancelButtonText}>Cancel</StyledText>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveButton}
                onPress={() => {
                  if (findDateObject(currentDate)) {
                    handleSaveNote();
                  } else {
                    handleAddDateWithNote();
                  }
                }}
              >
                <StyledText style={styles.saveButtonText}>Save</StyledText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#2C2C2E",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  buttonText: {
    color: "#fff",
    flex: 1,
    marginLeft: 8,
  },
  selectedDatesContainer: {
    marginTop: 8,
  },
  dateChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(54, 209, 220, 0.2)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  dateChipText: {
    color: "#fff",
    marginRight: 6,
  },
  dateChipActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  noteButton: {
    marginRight: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#1E1E1E",
    borderRadius: 16,
    width: "85%",
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  monthTitle: {
    color: "#fff",
    fontWeight: "bold",
  },
  weekdayHeader: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 10,
  },
  weekdayText: {
    color: "#999",
    width: 40,
    textAlign: "center",
  },
  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
  },
  dayPlaceholder: {
    width: 40,
    height: 40,
    margin: 2,
  },
  dayButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    margin: 2,
    borderRadius: 20,
    position: "relative",
  },
  selectedDayButton: {
    backgroundColor: "#36D1DC",
  },
  dayText: {
    color: "#fff",
  },
  selectedDayText: {
    fontWeight: "bold",
  },
  noteDot: {
    position: "absolute",
    bottom: 6,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FFC107",
  },
  modalFooter: {
    marginTop: 20,
    alignItems: "center",
  },
  footerButton: {
    backgroundColor: "#36D1DC",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  footerButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  // Note Modal Styles
  noteModalContent: {
    width: "90%",
    padding: 20,
  },
  noteModalTitle: {
    color: "#fff",
    textAlign: "center",
    marginBottom: 10,
  },
  dateDisplay: {
    color: "#36D1DC",
    textAlign: "center",
    marginBottom: 20,
  },
  noteInput: {
    backgroundColor: "#2C2C2E",
    borderRadius: 8,
    padding: 12,
    color: "#fff",
    height: 100,
    textAlignVertical: "top",
    marginBottom: 20,
  },
  noteModalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cancelButton: {
    backgroundColor: "#3A3A3C",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
    marginRight: 10,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#fff",
  },
  saveButton: {
    backgroundColor: "#36D1DC",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
    marginLeft: 10,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});

export default DatePicker;
