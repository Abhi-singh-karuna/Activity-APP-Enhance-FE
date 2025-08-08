import React, { useState, useCallback, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  Animated,
  Modal,
  TextInput,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Icon from "react-native-vector-icons/Ionicons";
import { Activity } from "../../types";
import { ThemeColors } from "../../config/theme";

const { width, height } = Dimensions.get("window");
const scale = (size: number) => (width / 375) * size;

interface Note {
  id: string;
  title?: string;
  content: string;
  timestamp: string;
  author: string;
  isRichText: boolean;
  tags?: string[];
  color?: string;
  pinned?: boolean;
  folder?: string;
}

interface NotesScreenProps {
  activity: Activity;
}

// Using centralized ThemeColors

const NoteColors = [
  "#00E5FF",
  "#4ECDC4",
  "#FF9500",
  "#FF3B30",
  "#9C6CDA",
  "#AF52DE",
  "#FF2D92",
  "#00C7BE",
  "#FFD60A",
];

type FolderMeta = { id: string; name: string; color: string };

const FOLDER_REGISTRY: Record<string, string> = {
  All: ThemeColors.textSecondary,
  Fitness: "#4ECDC4",
  Health: "#FF9500",
  Development: "#9C6CDA",
  Work: "#00E5FF",
  Personal: "#FF2D92",
  General: ThemeColors.primary,
};

const slugify = (name: string) => name.toLowerCase().replace(/\s+/g, "-");

// Enhanced mock data with better content
const mockNotes: Note[] = [
  {
    id: "1",
    title: "Morning Workout Progress 💪",
    content:
      "Completed 3x8 bench press @ 185lbs, 3x10 squats @ 225lbs, and 3x5 deadlifts @ 275lbs. Energy level was 9/10. Felt amazing today! New PR on bench press 🎉",
    timestamp: "2025-01-15T08:45:00Z",
    author: "John Doe",
    isRichText: false,
    tags: ["workout", "progress", "strength"],
    color: ThemeColors.success,
    pinned: true,
    folder: "Fitness",
  },
  {
    id: "2",
    title: "Nutrition Plan Update",
    content:
      "Updated daily nutrition plan with oatmeal breakfast, pre-workout banana, and post-workout protein shake. Targeting 180g protein, 250g carbs, 70g fat.",
    timestamp: "2025-01-14T07:30:00Z",
    author: "John Doe",
    isRichText: false,
    tags: ["nutrition", "meal-prep", "health"],
    color: ThemeColors.warning,
    folder: "Health",
  },
  {
    id: "3",
    title: "Code Snippet Collection",
    content:
      "Added React Native animation snippets and styled components examples. Useful for future reference and quick implementation.",
    timestamp: "2025-01-13T16:20:00Z",
    author: "John Doe",
    isRichText: false,
    tags: ["code", "react-native", "development"],
    color: ThemeColors.accent,
    folder: "Development",
  },
  {
    id: "4",
    title: "Project Planning",
    content:
      "Phase 1: Foundation setup complete. Phase 2: Core features in progress. Phase 3: Enhancement planned. Timeline: 2 weeks, 4 weeks, 3 weeks respectively.",
    timestamp: "2025-01-12T10:15:00Z",
    author: "John Doe",
    isRichText: false,
    tags: ["planning", "project", "roadmap"],
    color: ThemeColors.primary,
    folder: "Work",
  },
  {
    id: "5",
    title: "Quick Note",
    content:
      "Remember to call the client tomorrow about the project updates. Need to discuss the new requirements and timeline changes.",
    timestamp: "2025-01-11T18:30:00Z",
    author: "John Doe",
    isRichText: false,
    tags: ["reminder", "client"],
    color: ThemeColors.warning,
    folder: "Work",
  },
  {
    id: "6",
    title: "Reading List",
    content:
      "Added 'Atomic Habits' and 'Deep Work' to reading list. Focus on productivity and habit formation. Schedule 30 minutes daily reading.",
    timestamp: "2025-01-10T14:20:00Z",
    author: "John Doe",
    isRichText: false,
    tags: ["reading", "productivity", "habits"],
    color: ThemeColors.secondary,
    folder: "Personal",
  },
];

const NotesScreen: React.FC<NotesScreenProps> = ({ activity }) => {
  const [notes, setNotes] = useState<Note[]>(mockNotes);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFolder, setSelectedFolder] = useState("All");
  const [newNote, setNewNote] = useState({
    title: "",
    content: "",
    isRichText: false,
    color: ThemeColors.primary,
    folder: "General",
  });

  // Animations
  const [modalTranslateY] = useState(new Animated.Value(height));
  const [backdropOpacity] = useState(new Animated.Value(0));
  const [floatingButtonScale] = useState(new Animated.Value(1));

  // Enhanced floating button animation
  useEffect(() => {
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(floatingButtonScale, {
          toValue: 1.05,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(floatingButtonScale, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimation.start();
    return () => pulseAnimation.stop();
  }, []);

  // Filter and search functionality
  const filteredNotes = notes
    .filter((note) => {
      const matchesSearch =
        !searchQuery ||
        note.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.tags?.some((tag) =>
          tag.toLowerCase().includes(searchQuery.toLowerCase())
        );

      const matchesFolder =
        selectedFolder === "All" || note.folder === selectedFolder;

      return matchesSearch && matchesFolder;
    })
    .sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

  const folders: FolderMeta[] = useMemo(() => {
    const base: FolderMeta[] = [
      { id: "all", name: "All", color: FOLDER_REGISTRY["All"] },
    ];
    const dynamic = Array.from(
      new Set(notes.map((n) => n.folder || "General").filter(Boolean))
    ).map((name) => ({
      id: slugify(name),
      name,
      color: FOLDER_REGISTRY[name] || ThemeColors.textSecondary,
    }));
    // Ensure "General" exists in the list if used
    const names = new Set(dynamic.map((f) => f.name));
    if (!names.has("General")) {
      dynamic.push({
        id: "general",
        name: "General",
        color: FOLDER_REGISTRY["General"],
      });
    }
    return [...base, ...dynamic];
  }, [notes]);

  const folderCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    notes.forEach((n) => {
      const name = n.folder || "General";
      counts[name] = (counts[name] || 0) + 1;
    });
    counts["All"] = notes.length;
    return counts;
  }, [notes]);

  // Modal animations
  const showModal = () => {
    setShowAddModal(true);
    Animated.parallel([
      Animated.timing(modalTranslateY, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const hideModal = () => {
    Animated.parallel([
      Animated.timing(modalTranslateY, {
        toValue: height,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowAddModal(false);
      setIsEditMode(false);
      setSelectedNote(null);
      setNewNote({
        title: "",
        content: "",
        isRichText: false,
        color: ThemeColors.primary,
        folder: "General",
      });
    });
  };

  const renderNoteCard = useCallback(({ item }: { item: Note }) => {
    const cardColors: [string, string] = item.color
      ? [item.color + "20", item.color + "10"]
      : [ThemeColors.card, ThemeColors.surface];

    return (
      <TouchableOpacity
        style={styles.noteCardContainer}
        onPress={() => handleEditNote(item)}
        activeOpacity={0.7}
      >
        <LinearGradient colors={cardColors} style={styles.noteCard}>
          <View style={styles.noteHeader}>
            <View style={styles.noteHeaderLeft}>
              {item.pinned && (
                <Icon name="pin" size={scale(12)} color={ThemeColors.warning} />
              )}
              {item.title && (
                <Text style={styles.noteTitle} numberOfLines={1}>
                  {item.title}
                </Text>
              )}
            </View>
            <View style={styles.noteHeaderRight}>
              <Text style={styles.noteTimestamp}>
                {new Date(item.timestamp).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </Text>
            </View>
          </View>

          <View style={styles.noteContentContainer}>
            <Text style={styles.noteContent} numberOfLines={3}>
              {item.content}
            </Text>
          </View>

          {/* Tags removed per request for cleaner cards */}

          <View style={styles.noteFooter}>
            <View style={styles.noteFolder}>
              <Icon
                name="folder"
                size={scale(10)}
                color={ThemeColors.textSecondary}
              />
              <Text style={styles.noteFolderText}>
                {item.folder || "General"}
              </Text>
            </View>
            <View style={styles.noteActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => togglePin(item.id)}
              >
                <Icon
                  name={item.pinned ? "pin" : "pin-outline"}
                  size={scale(14)}
                  color={
                    item.pinned
                      ? ThemeColors.warning
                      : ThemeColors.textSecondary
                  }
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleDeleteNote(item.id)}
              >
                <Icon
                  name="trash-outline"
                  size={scale(14)}
                  color={ThemeColors.danger}
                />
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  }, []);

  const handleAddNote = () => {
    setNewNote({
      title: "",
      content: "",
      isRichText: false,
      color: ThemeColors.primary,
      folder: selectedFolder === "All" ? "General" : selectedFolder,
    });
    setIsEditMode(false);
    showModal();
  };

  const handleEditNote = (note: Note) => {
    setSelectedNote(note);
    setNewNote({
      title: note.title || "",
      content: note.content,
      isRichText: note.isRichText,
      color: note.color || ThemeColors.primary,
      folder: note.folder || "General",
    });
    setIsEditMode(true);
    showModal();
  };

  const handleSaveNote = () => {
    if (!newNote.content.trim()) {
      Alert.alert("Error", "Note content cannot be empty");
      return;
    }

    const noteData = {
      ...newNote,
      timestamp: new Date().toISOString(),
      author: "John Doe",
      tags: extractTags(newNote.content),
    };

    if (isEditMode && selectedNote) {
      setNotes(
        notes.map((note) =>
          note.id === selectedNote.id ? { ...note, ...noteData } : note
        )
      );
    } else {
      const newNoteData: Note = {
        id: Date.now().toString(),
        ...noteData,
      };
      setNotes([newNoteData, ...notes]);
    }

    hideModal();
  };

  const extractTags = (content: string) => {
    const tagRegex = /#(\w+)/g;
    const matches = content.match(tagRegex);
    return matches ? matches.map((tag) => tag.substring(1)) : [];
  };

  const togglePin = (noteId: string) => {
    setNotes(
      notes.map((note) =>
        note.id === noteId ? { ...note, pinned: !note.pinned } : note
      )
    );
  };

  const handleDeleteNote = (noteId: string) => {
    Alert.alert("Delete Note", "Are you sure you want to delete this note?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => setNotes(notes.filter((note) => note.id !== noteId)),
      },
    ]);
  };

  const renderColorPicker = () => (
    <View style={styles.colorPicker}>
      <Text style={styles.sectionTitle}>Color</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {NoteColors.map((color, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.colorOption,
              { backgroundColor: color },
              newNote.color === color && styles.selectedColor,
            ]}
            onPress={() => setNewNote({ ...newNote, color })}
          />
        ))}
      </ScrollView>
    </View>
  );

  const renderModal = () => (
    <Modal
      visible={showAddModal}
      transparent
      animationType="none"
      onRequestClose={hideModal}
    >
      <Animated.View
        style={[styles.modalBackdrop, { opacity: backdropOpacity }]}
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          onPress={hideModal}
          activeOpacity={1}
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.modalContainer,
          {
            transform: [{ translateY: modalTranslateY }],
          },
        ]}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardAvoid}
        >
          <LinearGradient
            colors={[ThemeColors.surface, ThemeColors.card]}
            style={styles.modalContent}
          >
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHandle} />
              <View style={styles.modalHeaderContent}>
                <TouchableOpacity
                  onPress={hideModal}
                  style={styles.modalButton}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.modalTitle}>
                  {isEditMode ? "Edit Note" : "New Note"}
                </Text>
                <TouchableOpacity
                  onPress={handleSaveNote}
                  style={styles.modalButton}
                >
                  <Text
                    style={[
                      styles.modalButtonText,
                      { color: ThemeColors.primary },
                    ]}
                  >
                    Save
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView style={styles.modalScrollView}>
              {/* Title Input */}
              <View style={styles.inputSection}>
                <TextInput
                  style={styles.titleInput}
                  value={newNote.title}
                  onChangeText={(text) =>
                    setNewNote({ ...newNote, title: text })
                  }
                  placeholder="Title"
                  placeholderTextColor={ThemeColors.textSecondary}
                />
              </View>

              {/* Content Input */}
              <View style={styles.inputSection}>
                <TextInput
                  style={styles.contentInput}
                  value={newNote.content}
                  onChangeText={(text) =>
                    setNewNote({ ...newNote, content: text })
                  }
                  placeholder="Start writing..."
                  placeholderTextColor={ThemeColors.textSecondary}
                  multiline
                  textAlignVertical="top"
                />
              </View>

              {/* Color Picker */}
              {renderColorPicker()}

              {/* Folder Selection */}
              <View style={styles.folderSection}>
                <Text style={styles.sectionTitle}>Folder</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {folders
                    .filter((f) => f.name !== "All")
                    .map((folder) => (
                      <TouchableOpacity
                        key={folder.id}
                        style={[
                          styles.folderOption,
                          newNote.folder === folder.name &&
                            styles.selectedFolder,
                        ]}
                        onPress={() =>
                          setNewNote({ ...newNote, folder: folder.name })
                        }
                      >
                        <View
                          style={[
                            styles.folderColorDot,
                            { backgroundColor: folder.color },
                          ]}
                        />
                        <Text
                          style={[
                            styles.folderOptionText,
                            newNote.folder === folder.name &&
                              styles.selectedFolderText,
                          ]}
                        >
                          {folder.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                </ScrollView>
              </View>
            </ScrollView>
          </LinearGradient>
        </KeyboardAvoidingView>
      </Animated.View>
    </Modal>
  );

  const renderListHeader = () => (
    <View style={styles.listHeader}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Icon
            name="search"
            size={scale(16)}
            color={ThemeColors.textSecondary}
          />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search notes..."
            placeholderTextColor={ThemeColors.textSecondary}
          />
        </View>
      </View>

      {/* Folder Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.folderFilter}
      >
        {folders.map((folder) => {
          const isActive = selectedFolder === folder.name;
          const ring = folder.color;
          const textColor = isActive ? folder.color : ThemeColors.textSecondary;
          const count = folderCounts[folder.name] ?? 0;
          return (
            <TouchableOpacity
              key={folder.id}
              style={styles.folderChip}
              onPress={() => setSelectedFolder(folder.name)}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={[`${folder.color}26`, `${folder.color}14`]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[
                  styles.folderInner,
                  {
                    borderColor: isActive ? ring : ThemeColors.border,
                    borderWidth: 1,
                  },
                ]}
              >
                <Text style={[styles.folderChipText, { color: textColor }]}>
                  {folder.name}
                </Text>
                <View
                  style={[
                    styles.countPill,
                    { backgroundColor: `${folder.color}26` },
                  ]}
                >
                  <Text style={[styles.countPillText, { color: folder.color }]}>
                    {count}
                  </Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={ThemeColors.background}
      />

      {/* Header removed per request */}

      {/* Notes List */}
      <FlatList
        data={filteredNotes}
        renderItem={renderNoteCard}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[0]}
        ListHeaderComponent={renderListHeader}
        contentContainerStyle={styles.listContainer}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
      />

      {/* Enhanced Floating Action Button */}
      <Animated.View
        style={[
          styles.floatingButton,
          { transform: [{ scale: floatingButtonScale }] },
        ]}
      >
        <TouchableOpacity
          style={styles.floatingButtonTouchable}
          onPress={handleAddNote}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[ThemeColors.primary, ThemeColors.secondary]}
            style={styles.floatingButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Icon name="add" size={scale(24)} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      {renderModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ThemeColors.background,
  },
  // Header styles retained for reference but not used
  // Ensure header controls always visible against background
  // Add subtle backdrop behind the header action row
  headerButtonsBackdrop: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: "rgba(0,0,0,0.2)",
    padding: 4,
    borderRadius: 12,
  },
  headerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: ThemeColors.surface,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: ThemeColors.border,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 10,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: ThemeColors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: ThemeColors.text,
    fontSize: scale(16),
  },
  folderFilter: {
    paddingLeft: 20,
    marginBottom: 10,
  },
  folderChip: {
    borderRadius: 20,
    marginRight: 8,
    minHeight: 36,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  selectedFolderChip: {
    backgroundColor: ThemeColors.primary,
    borderWidth: 1,
    borderColor: ThemeColors.primary,
  },
  folderInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  folderColorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  countPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  countPillText: {
    fontSize: scale(12),
    fontWeight: "700",
  },
  folderChipText: {
    color: ThemeColors.textSecondary,
    fontSize: scale(14),
    fontWeight: "500",
  },
  selectedFolderChipText: {
    color: "#fff",
  },
  listContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  listHeader: {
    backgroundColor: ThemeColors.background,
  },
  columnWrapper: {
    justifyContent: "space-between",
  },
  separator: {
    height: 12,
  },
  noteCardContainer: {
    flex: 1,
    marginHorizontal: 6,
    marginBottom: 12,
  },
  noteCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: ThemeColors.border,
    height: 180, // Reduced height by 50% as requested
  },
  noteHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  noteHeaderLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  noteHeaderRight: {
    marginLeft: 8,
  },
  noteTitle: {
    fontSize: scale(14),
    fontWeight: "600",
    color: ThemeColors.text,
    flex: 1,
  },
  noteTimestamp: {
    fontSize: scale(10),
    color: ThemeColors.textSecondary,
    fontWeight: "500",
  },
  noteContentContainer: {
    flex: 1,
    marginBottom: 8,
  },
  noteContent: {
    fontSize: scale(12),
    color: ThemeColors.text,
    lineHeight: 16,
  },
  noteTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginBottom: 8,
  },
  noteTag: {
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  noteTagText: {
    fontSize: scale(8),
    fontWeight: "600",
  },
  noteFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  noteFolder: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  noteFolderText: {
    fontSize: scale(9),
    color: ThemeColors.textSecondary,
    fontWeight: "500",
  },
  noteActions: {
    flexDirection: "row",
    gap: 6,
  },
  actionButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  floatingButton: {
    position: "absolute",
    bottom: 30,
    right: 20,
    zIndex: 1000,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  floatingButtonTouchable: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  floatingButtonGradient: {
    width: "100%",
    height: "100%",
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.9,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
  },
  keyboardAvoid: {
    flex: 1,
  },
  modalContent: {
    flex: 1,
  },
  modalHeader: {
    paddingTop: 8,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: ThemeColors.border,
  },
  modalHandle: {
    width: 36,
    height: 4,
    backgroundColor: ThemeColors.textTertiary,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  modalHeaderContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  modalButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  modalButtonText: {
    fontSize: scale(16),
    fontWeight: "600",
    color: ThemeColors.textSecondary,
  },
  modalTitle: {
    fontSize: scale(18),
    fontWeight: "600",
    color: ThemeColors.text,
  },
  modalScrollView: {
    flex: 1,
  },
  inputSection: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  titleInput: {
    fontSize: scale(20),
    fontWeight: "600",
    color: ThemeColors.text,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: ThemeColors.border,
  },
  contentInput: {
    fontSize: scale(16),
    color: ThemeColors.text,
    minHeight: 200,
    paddingVertical: 16,
    textAlignVertical: "top",
    lineHeight: 24,
  },
  colorPicker: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: scale(16),
    fontWeight: "600",
    color: ThemeColors.text,
    marginBottom: 12,
  },
  colorOption: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
    borderWidth: 2,
    borderColor: "transparent",
  },
  selectedColor: {
    borderColor: ThemeColors.text,
  },
  folderSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  folderOption: {
    backgroundColor: ThemeColors.surface,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: ThemeColors.border,
    minHeight: 36,
  },
  selectedFolder: {
    backgroundColor: ThemeColors.primary,
    borderWidth: 1,
    borderColor: ThemeColors.primary,
  },
  folderOptionText: {
    color: ThemeColors.textSecondary,
    fontSize: scale(14),
    fontWeight: "500",
  },
  selectedFolderText: {
    color: "#fff",
  },
});

export default NotesScreen;
