import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radii, shadows, spacing, typography } from '../../theme';
import { Avatar, Button, Card, EmptyState, useToast } from '../../components';
import { useCouple } from '../../services/coupleContext';
import { useNotifications } from '../../services/useNotifications';
import { useNotes } from './useNotes';
import {
  ListFilter,
  sortCoupleListItems,
  sortPartnerNotes,
  DEFAULT_PARTNER_CATEGORIES,
  SUGGESTED_PARTNER_PROMPTS,
  validateNoteContent,
  validatePartnerNote,
} from './notesLogic';
import {
  X,
  Heart,
  CheckSquare,
  Square,
  Lock,
  Plus,
  Trash2,
  Sparkles,
  Edit3,
  Bookmark,
  Send,
  ListPlus,
  Check,
  Bell,
} from 'lucide-react-native';
import { CoupleNote, PartnerNote } from '../../types';

interface NotesScreenProps {
  visible?: boolean;
  onClose?: () => void;
}

type TabKey = 'gratitude' | 'list' | 'partner';

export const NotesScreen: React.FC<NotesScreenProps> = ({ visible = true, onClose }) => {
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { userProfile, partnerProfile } = useCouple();
  const partnerName = partnerProfile?.displayName || 'Partner';
  const { sendNudge } = useNotifications();
  const [nudging, setNudging] = useState(false);

  const handleNudgePartnerToWrite = async () => {
    if (nudging) return;
    setNudging(true);
    const res = await sendNudge('nudge_write_note');
    setNudging(false);
    if (res.success) {
      toast.success('Nudge Sent! 💌', `Asked ${partnerName} to write a sweet note today.`);
    } else if (res.reason === 'throttled') {
      toast.error('Cooldown Active', `Please wait ${res.remainingMinutes}m before nudging again.`);
    } else {
      toast.error('Unavailable', 'Couple must be linked to send nudges.');
    }
  };

  const {
    gratitudeNotes,
    allListItems,
    partnerNotes,
    loading,
    addGratitude,
    addListItem,
    toggleListItem,
    deleteCoupleNote,
    addPartnerNote,
    updatePartnerNote,
    deletePartnerNote,
    currentUid,
  } = useNotes();

  const [activeTab, setActiveTab] = useState<TabKey>('gratitude');

  // Gratitude compose state
  const [gratitudeInput, setGratitudeInput] = useState('');
  const [isSubmittingGratitude, setIsSubmittingGratitude] = useState(false);

  // List compose state
  const [listInput, setListInput] = useState('');
  const [listFilter, setListFilter] = useState<ListFilter>('all');
  const [isSubmittingList, setIsSubmittingList] = useState(false);

  // Partner note state
  const [partnerTitle, setPartnerTitle] = useState('');
  const [partnerContent, setPartnerContent] = useState('');
  const [partnerCategory, setPartnerCategory] = useState<string>('Favorites');
  const [editingPartnerNoteId, setEditingPartnerNoteId] = useState<string | null>(null);
  const [showPartnerComposer, setShowPartnerComposer] = useState(false);
  const [partnerCategoryFilter, setPartnerCategoryFilter] = useState<string>('all');
  const [isSubmittingPartnerNote, setIsSubmittingPartnerNote] = useState(false);

  // Computed data
  const filteredListItems = useMemo(
    () => sortCoupleListItems(allListItems, listFilter),
    [allListItems, listFilter]
  );

  const filteredPartnerNotes = useMemo(
    () => sortPartnerNotes(partnerNotes, partnerCategoryFilter),
    [partnerNotes, partnerCategoryFilter]
  );

  // Handlers
  const handleAddGratitude = async () => {
    const val = validateNoteContent(gratitudeInput);
    if (!val.valid) {
      toast.error('Empty Note', val.error);
      return;
    }

    try {
      setIsSubmittingGratitude(true);
      await addGratitude(gratitudeInput);
      setGratitudeInput('');
      toast.success('Gratitude Shared', 'Your note has been posted.');
    } catch (e: any) {
      toast.error('Failed to post', e.message);
    } finally {
      setIsSubmittingGratitude(false);
    }
  };

  const handleAddListItem = async () => {
    const val = validateNoteContent(listInput);
    if (!val.valid) {
      toast.error('Empty Item', val.error);
      return;
    }

    try {
      setIsSubmittingList(true);
      await addListItem(listInput);
      setListInput('');
    } catch (e: any) {
      toast.error('Failed to add item', e.message);
    } finally {
      setIsSubmittingList(false);
    }
  };

  const handleDeleteCoupleNote = (note: CoupleNote, label: string) => {
    Alert.alert('Delete', `Remove this ${label}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteCoupleNote(note.id);
          } catch (e: any) {
            toast.error('Delete failed', e.message);
          }
        },
      },
    ]);
  };

  const handleSavePartnerNote = async () => {
    const val = validatePartnerNote(partnerTitle, partnerContent);
    if (!val.valid) {
      toast.error('Invalid Note', val.error);
      return;
    }

    try {
      setIsSubmittingPartnerNote(true);
      if (editingPartnerNoteId) {
        await updatePartnerNote(editingPartnerNoteId, {
          title: partnerTitle,
          content: partnerContent,
          category: partnerCategory,
        });
        toast.success('Note Updated', 'Saved to your private notes.');
      } else {
        await addPartnerNote({
          title: partnerTitle,
          content: partnerContent,
          category: partnerCategory,
        });
        toast.success('Note Added', 'Saved to your private notes.');
      }
      setPartnerTitle('');
      setPartnerContent('');
      setEditingPartnerNoteId(null);
      setShowPartnerComposer(false);
    } catch (e: any) {
      toast.error('Save failed', e.message);
    } finally {
      setIsSubmittingPartnerNote(false);
    }
  };

  const handleEditPartnerNote = (note: PartnerNote) => {
    setPartnerTitle(note.title);
    setPartnerContent(note.content);
    setPartnerCategory(note.category || 'General');
    setEditingPartnerNoteId(note.id);
    setShowPartnerComposer(true);
  };

  const handleDeletePartnerNote = (note: PartnerNote) => {
    Alert.alert('Delete Private Note', `Remove "${note.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deletePartnerNote(note.id);
            toast.success('Deleted', 'Note removed.');
          } catch (e: any) {
            toast.error('Delete failed', e.message);
          }
        },
      },
    ]);
  };

  const content = (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
    >
      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Notes & Lists</Text>
          <Text style={styles.headerSubtitle}>Shared memories & private reminders</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
          <TouchableOpacity
            style={styles.nudgeBtnHeader}
            onPress={handleNudgePartnerToWrite}
            activeOpacity={0.7}
            disabled={nudging}
          >
            <Bell size={16} color={colors.primary} />
            <Text style={styles.nudgeBtnHeaderText}>Nudge</Text>
          </TouchableOpacity>
          {onClose && (
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <X size={24} color={colors.onSurface} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Segmented Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'gratitude' && styles.tabItemActive]}
          onPress={() => setActiveTab('gratitude')}
        >
          <Heart
            size={16}
            color={activeTab === 'gratitude' ? colors.onPrimary : colors.primary}
            fill={activeTab === 'gratitude' ? colors.onPrimary : 'none'}
          />
          <Text style={[styles.tabText, activeTab === 'gratitude' && styles.tabTextActive]}>
            Gratitude
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'list' && styles.tabItemActive]}
          onPress={() => setActiveTab('list')}
        >
          <CheckSquare
            size={16}
            color={activeTab === 'list' ? colors.onPrimary : colors.primary}
          />
          <Text style={[styles.tabText, activeTab === 'list' && styles.tabTextActive]}>
            Couple List
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'partner' && styles.tabItemActive]}
          onPress={() => setActiveTab('partner')}
        >
          <Lock
            size={16}
            color={activeTab === 'partner' ? colors.onPrimary : colors.primary}
          />
          <Text style={[styles.tabText, activeTab === 'partner' && styles.tabTextActive]}>
            About {partnerName.split(' ')[0]}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main View Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading notes...</Text>
        </View>
      ) : activeTab === 'gratitude' ? (
        /* ================= 1. GRATITUDE TAB ================= */
        <View style={styles.tabContent}>
          {/* Quick Compose Card */}
          <View style={styles.composerCard}>
            <Text style={styles.composerLabel}>I'm grateful for...</Text>
            <TextInput
              style={styles.gratitudeInput}
              placeholder="A sweet thing they did, a shared memory, or life today..."
              placeholderTextColor={colors.outline}
              value={gratitudeInput}
              onChangeText={setGratitudeInput}
              multiline
              maxLength={1000}
            />
            <View style={styles.composerFooter}>
              <View style={styles.promptChips}>
                <TouchableOpacity
                  onPress={() => setGratitudeInput("I'm grateful for how you always ")}
                  style={styles.promptChip}
                >
                  <Text style={styles.promptChipText}>Partner ❤️</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setGratitudeInput("I'm grateful for our time together when ")}
                  style={styles.promptChip}
                >
                  <Text style={styles.promptChipText}>Together ✨</Text>
                </TouchableOpacity>
              </View>
              <Button
                title="Share"
                onPress={handleAddGratitude}
                loading={isSubmittingGratitude}
                size="sm"
                variant="primary"
                leftIcon={<Send size={14} color={colors.onPrimary} />}
              />
            </View>
          </View>

          {/* List of Gratitude Notes */}
          <FlatList
            data={gratitudeNotes}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={
              <EmptyState
                icon={<Sparkles size={32} color={colors.primary} />}
                title="No Gratitude Notes Yet"
                description="Take a moment to share something you appreciate about each other."
              />
            }
            renderItem={({ item }) => {
              const isMe = item.authorUid === currentUid;
              const authorLabel = isMe ? 'You' : item.authorName || partnerName;
              return (
                <View style={styles.noteCard}>
                  <View style={styles.noteHeader}>
                    <View style={styles.authorRow}>
                      <Avatar
                        name={authorLabel}
                        size="sm"
                      />
                      <Text style={styles.authorName}>{authorLabel}</Text>
                    </View>
                    {isMe && (
                      <TouchableOpacity
                        onPress={() => handleDeleteCoupleNote(item, 'gratitude note')}
                        style={styles.deleteBtn}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Trash2 size={16} color={colors.outline} />
                      </TouchableOpacity>
                    )}
                  </View>
                  <Text style={styles.noteContent}>{item.content}</Text>
                </View>
              );
            }}
          />
        </View>
      ) : activeTab === 'list' ? (
        /* ================= 2. COUPLE LIST TAB ================= */
        <View style={styles.tabContent}>
          {/* Quick Add Input Bar */}
          <View style={styles.listAddRow}>
            <TextInput
              style={styles.listInput}
              placeholder="Add an adventure, date idea, or goal..."
              placeholderTextColor={colors.outline}
              value={listInput}
              onChangeText={setListInput}
              returnKeyType="done"
              onSubmitEditing={handleAddListItem}
            />
            <TouchableOpacity
              style={styles.listAddBtn}
              onPress={handleAddListItem}
              disabled={isSubmittingList}
            >
              <Plus size={20} color={colors.onPrimary} />
            </TouchableOpacity>
          </View>

          {/* Filter Chips */}
          <View style={styles.filterRow}>
            {(['all', 'todo', 'done'] as ListFilter[]).map((f) => (
              <TouchableOpacity
                key={f}
                style={[styles.filterChip, listFilter === f && styles.filterChipActive]}
                onPress={() => setListFilter(f)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    listFilter === f && styles.filterChipTextActive,
                  ]}
                >
                  {f === 'all'
                    ? `All (${allListItems.length})`
                    : f === 'todo'
                    ? `To Do (${allListItems.filter((i) => !i.completed).length})`
                    : `Done (${allListItems.filter((i) => i.completed).length})`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Items List */}
          <FlatList
            data={filteredListItems}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={
              <EmptyState
                icon={<ListPlus size={32} color={colors.primary} />}
                title="Your List is Empty"
                description="Add bucket list items, travel plans, or fun activities to do together!"
              />
            }
            renderItem={({ item }) => (
              <View style={[styles.listItemCard, item.completed && styles.listItemCardDone]}>
                <TouchableOpacity
                  style={styles.checkboxTouch}
                  onPress={() => toggleListItem(item.id, item.completed)}
                >
                  {item.completed ? (
                    <View style={styles.checkedBox}>
                      <Check size={14} color={colors.onPrimary} />
                    </View>
                  ) : (
                    <View style={styles.uncheckedBox} />
                  )}
                </TouchableOpacity>

                <Text
                  style={[
                    styles.listItemText,
                    item.completed && styles.listItemTextDone,
                  ]}
                >
                  {item.content}
                </Text>

                <TouchableOpacity
                  onPress={() => handleDeleteCoupleNote(item, 'item')}
                  style={styles.deleteBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Trash2 size={16} color={colors.outline} />
                </TouchableOpacity>
              </View>
            )}
          />
        </View>
      ) : (
        /* ================= 3. ABOUT PARTNER (PRIVATE) TAB ================= */
        <View style={styles.tabContent}>
          {/* Privacy Banner */}
          <View style={styles.privacyBanner}>
            <Lock size={16} color={colors.primary} style={{ marginRight: 6 }} />
            <Text style={styles.privacyBannerText}>
              Private to you. {partnerName} cannot view these notes.
            </Text>
          </View>

          {/* Prompt Suggestion Chips */}
          <View style={styles.suggestionsWrapper}>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={SUGGESTED_PARTNER_PROMPTS}
              keyExtractor={(item) => item.title}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.suggestionChip}
                  onPress={() => {
                    setPartnerTitle(item.title.replace(/^[^\w\s]+\s*/, ''));
                    setPartnerCategory(item.category);
                    setShowPartnerComposer(true);
                  }}
                >
                  <Text style={styles.suggestionChipText}>{item.title}</Text>
                </TouchableOpacity>
              )}
            />
          </View>

          {/* Composer or Add Note Button */}
          {showPartnerComposer ? (
            <View style={styles.partnerComposerCard}>
              <View style={styles.composerHeaderRow}>
                <Text style={styles.composerLabel}>
                  {editingPartnerNoteId ? 'Edit Private Note' : 'New Note About Partner'}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setShowPartnerComposer(false);
                    setEditingPartnerNoteId(null);
                    setPartnerTitle('');
                    setPartnerContent('');
                  }}
                >
                  <X size={18} color={colors.outline} />
                </TouchableOpacity>
              </View>

              <TextInput
                style={styles.partnerTitleInput}
                placeholder="Title (e.g. Favorite Flowers, Coffee Order...)"
                placeholderTextColor={colors.outline}
                value={partnerTitle}
                onChangeText={setPartnerTitle}
              />

              {/* Category selector */}
              <View style={styles.categoryPills}>
                {DEFAULT_PARTNER_CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryPill,
                      partnerCategory === cat && styles.categoryPillActive,
                    ]}
                    onPress={() => setPartnerCategory(cat)}
                  >
                    <Text
                      style={[
                        styles.categoryPillText,
                        partnerCategory === cat && styles.categoryPillTextActive,
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput
                style={styles.partnerContentInput}
                placeholder="Details, sizes, preferences, or ideas..."
                placeholderTextColor={colors.outline}
                value={partnerContent}
                onChangeText={setPartnerContent}
                multiline
              />

              <View style={styles.partnerComposerActions}>
                <Button
                  title="Cancel"
                  variant="secondary"
                  size="sm"
                  onPress={() => {
                    setShowPartnerComposer(false);
                    setEditingPartnerNoteId(null);
                  }}
                />
                <Button
                  title={editingPartnerNoteId ? 'Save Changes' : 'Save Note'}
                  variant="primary"
                  size="sm"
                  loading={isSubmittingPartnerNote}
                  onPress={handleSavePartnerNote}
                />
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.openComposerBtn}
              onPress={() => {
                setEditingPartnerNoteId(null);
                setPartnerTitle('');
                setPartnerContent('');
                setShowPartnerComposer(true);
              }}
            >
              <Plus size={18} color={colors.onPrimary} style={{ marginRight: 6 }} />
              <Text style={styles.openComposerBtnText}>Add Note About {partnerName}</Text>
            </TouchableOpacity>
          )}

          {/* Category Filter */}
          <View style={styles.filterRow}>
            {['all', ...DEFAULT_PARTNER_CATEGORIES].map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.filterChip,
                  partnerCategoryFilter === cat && styles.filterChipActive,
                ]}
                onPress={() => setPartnerCategoryFilter(cat)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    partnerCategoryFilter === cat && styles.filterChipTextActive,
                  ]}
                >
                  {cat === 'all' ? 'All Notes' : cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Private Notes Cards */}
          <FlatList
            data={filteredPartnerNotes}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={
              <EmptyState
                icon={<Bookmark size={32} color={colors.primary} />}
                title={`Notes About ${partnerName}`}
                description="Keep track of favorites, gift ideas, sizes, and little preferences in one private place."
              />
            }
            renderItem={({ item }) => (
              <View style={styles.partnerNoteCard}>
                <View style={styles.partnerCardTop}>
                  <View style={styles.partnerTag}>
                    <Text style={styles.partnerTagText}>{item.category || 'General'}</Text>
                  </View>
                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      onPress={() => handleEditPartnerNote(item)}
                      style={styles.cardActionBtn}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Edit3 size={15} color={colors.outline} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDeletePartnerNote(item)}
                      style={styles.cardActionBtn}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Trash2 size={15} color={colors.outline} />
                    </TouchableOpacity>
                  </View>
                </View>
                <Text style={styles.partnerCardTitle}>{item.title}</Text>
                <Text style={styles.partnerCardContent}>{item.content}</Text>
              </View>
            )}
          />
        </View>
      )}
    </KeyboardAvoidingView>
  );

  if (!visible) {
    return null;
  }

  if (onClose) {
    return (
      <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
        {content}
      </Modal>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.marginMobile,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },
  headerTitle: {
    fontFamily: typography.fonts.serif,
    fontSize: typography.sizes.xl,
    fontWeight: '600',
    color: colors.primary,
  },
  headerSubtitle: {
    fontFamily: typography.fonts.sans,
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceContainer,
  },
  nudgeBtnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: radii.full,
    backgroundColor: colors.primaryLight,
  },
  nudgeBtnHeaderText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semiBold,
    color: colors.primary,
  },
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: spacing.marginMobile,
    marginVertical: spacing.sm,
    backgroundColor: colors.surfaceContainer,
    borderRadius: radii.full,
    padding: 4,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: radii.full,
    gap: 6,
  },
  tabItemActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontFamily: typography.fonts.sans,
    fontSize: typography.sizes.xs,
    fontWeight: '600',
    color: colors.primary,
  },
  tabTextActive: {
    color: colors.onPrimary,
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: spacing.marginMobile,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
  },
  composerCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    ...shadows.sm,
  },
  composerLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 6,
  },
  gratitudeInput: {
    minHeight: 70,
    fontSize: typography.sizes.sm,
    color: colors.onSurface,
    textAlignVertical: 'top',
    padding: 0,
  },
  composerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant,
  },
  promptChips: {
    flexDirection: 'row',
    gap: 6,
  },
  promptChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceContainerLow,
  },
  promptChipText: {
    fontSize: typography.sizes.xs,
    color: colors.primary,
    fontWeight: '500',
  },
  listContainer: {
    paddingBottom: spacing.xl,
  },
  noteCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    ...shadows.sm,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  authorName: {
    fontSize: typography.sizes.xs,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  noteContent: {
    fontSize: typography.sizes.sm,
    color: colors.onSurface,
    lineHeight: 20,
  },
  deleteBtn: {
    padding: 4,
  },
  listAddRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.sm,
    gap: 8,
  },
  listInput: {
    flex: 1,
    height: 44,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radii.full,
    paddingHorizontal: 16,
    fontSize: typography.sizes.sm,
    color: colors.onSurface,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  listAddBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceContainer,
  },
  filterChipActive: {
    backgroundColor: colors.primaryFixed,
  },
  filterChipText: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: colors.onPrimaryFixedVariant,
    fontWeight: '600',
  },
  listItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  listItemCardDone: {
    backgroundColor: colors.surfaceContainerLow,
    opacity: 0.75,
  },
  checkboxTouch: {
    marginRight: 12,
  },
  checkedBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uncheckedBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.outline,
  },
  listItemText: {
    flex: 1,
    fontSize: typography.sizes.sm,
    color: colors.onSurface,
  },
  listItemTextDone: {
    textDecorationLine: 'line-through',
    color: colors.outline,
  },
  privacyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryFixed,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.md,
    marginVertical: spacing.xs,
  },
  privacyBannerText: {
    fontSize: typography.sizes.xs,
    color: colors.onPrimaryFixedVariant,
    fontWeight: '600',
    flex: 1,
  },
  suggestionsWrapper: {
    marginVertical: spacing.xs,
  },
  suggestionChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    marginRight: 6,
  },
  suggestionChipText: {
    fontSize: typography.sizes.xs,
    color: colors.primary,
    fontWeight: '500',
  },
  openComposerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: radii.full,
    paddingVertical: 10,
    marginVertical: spacing.sm,
    ...shadows.sm,
  },
  openComposerBtnText: {
    color: colors.onPrimary,
    fontWeight: '600',
    fontSize: typography.sizes.sm,
  },
  partnerComposerCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    gap: 8,
    ...shadows.sm,
  },
  composerHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  partnerTitleInput: {
    height: 40,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
    fontSize: typography.sizes.sm,
    color: colors.onSurface,
    fontWeight: '600',
    paddingVertical: 4,
  },
  categoryPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginVertical: 4,
  },
  categoryPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceContainer,
  },
  categoryPillActive: {
    backgroundColor: colors.primaryFixed,
  },
  categoryPillText: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
  },
  categoryPillTextActive: {
    color: colors.onPrimaryFixedVariant,
    fontWeight: '600',
  },
  partnerContentInput: {
    minHeight: 60,
    fontSize: typography.sizes.sm,
    color: colors.onSurface,
    textAlignVertical: 'top',
    paddingVertical: 4,
  },
  partnerComposerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 4,
  },
  partnerNoteCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    ...shadows.sm,
  },
  partnerCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  partnerTag: {
    backgroundColor: colors.primaryFixed,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.full,
  },
  partnerTagText: {
    fontSize: typography.sizes.xs - 1,
    color: colors.onPrimaryFixedVariant,
    fontWeight: '600',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  cardActionBtn: {
    padding: 2,
  },
  partnerCardTitle: {
    fontSize: typography.sizes.md,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 4,
  },
  partnerCardContent: {
    fontSize: typography.sizes.sm,
    color: colors.onSurface,
    lineHeight: 20,
  },
});
