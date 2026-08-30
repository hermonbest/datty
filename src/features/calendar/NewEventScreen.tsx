import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { format } from 'date-fns';
import { colors, radii, spacing, typography } from '../../theme';
import { Input, Button, Card, useToast } from '../../components';
import { useEvents } from './useEvents';
import { isValidEventDate } from './eventUtils';
import { ArrowLeft, Calendar as CalendarIcon, Heart, Sparkles } from 'lucide-react-native';

interface NewEventScreenProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export const NewEventScreen: React.FC<NewEventScreenProps> = ({ onClose, onSuccess }) => {
  const [title, setTitle] = useState('');
  const [dateStr, setDateStr] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [recurringYearly, setRecurringYearly] = useState(true);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { addEvent } = useEvents();
  const toast = useToast();

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Missing Title', 'Please enter a name for this date.');
      return;
    }
    if (!dateStr.trim() || !isValidEventDate(dateStr.trim())) {
      toast.error('Invalid Date', 'Please enter date in YYYY-MM-DD or MM-DD format.');
      return;
    }

    setSubmitting(true);
    try {
      await addEvent({
        title: title.trim(),
        date: dateStr.trim(),
        recurringYearly,
        notes: notes.trim() || undefined,
      });

      toast.success('Event Saved', 'Added to your shared calendar!');
      if (onSuccess) onSuccess();
      onClose();
    } catch (e: any) {
      toast.error('Error', 'Failed to create event. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const setPreset = (presetTitle: string, isRecurring: boolean) => {
    setTitle(presetTitle);
    setRecurringYearly(isRecurring);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <ArrowLeft size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Special Date</Text>
        <Button
          title="Save"
          onPress={handleSave}
          loading={submitting}
          size="sm"
          variant="primary"
          style={styles.saveBtn}
        />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Quick Presets */}
        <View style={styles.presetSection}>
          <Text style={styles.presetLabel}>Quick Presets:</Text>
          <View style={styles.presetRow}>
            <TouchableOpacity
              style={styles.presetPill}
              onPress={() => setPreset('Our Anniversary', true)}
            >
              <Heart size={14} color={colors.primary} />
              <Text style={styles.presetText}>Anniversary</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.presetPill}
              onPress={() => setPreset("Partner's Birthday", true)}
            >
              <Sparkles size={14} color={colors.accent} />
              <Text style={styles.presetText}>Birthday</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.presetPill}
              onPress={() => setPreset('Next Date Night', false)}
            >
              <CalendarIcon size={14} color={colors.info} />
              <Text style={styles.presetText}>Date Night</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Card style={styles.formCard}>
          <Input
            label="Event Name"
            placeholder="e.g. First Date, Trip to Paris, Birthday"
            value={title}
            onChangeText={setTitle}
          />

          <Input
            label="Date (YYYY-MM-DD or MM-DD)"
            placeholder="2026-10-15 or 10-15"
            value={dateStr}
            onChangeText={setDateStr}
            helper="Use MM-DD or YYYY-MM-DD"
          />

          {/* Recurring switch */}
          <View style={styles.switchRow}>
            <View style={styles.switchTextCol}>
              <Text style={styles.switchTitle}>Repeat Yearly</Text>
              <Text style={styles.switchSubtitle}>
                Auto-roll countdown every year (ideal for anniversaries & birthdays)
              </Text>
            </View>
            <Switch
              value={recurringYearly}
              onValueChange={setRecurringYearly}
              trackColor={{ false: colors.border, true: colors.primaryLight }}
              thumbColor={recurringYearly ? colors.primary : '#F4F4F4'}
            />
          </View>

          <Input
            label="Notes / Ideas (Optional)"
            placeholder="Gift ideas, dinner reservations, or special plans..."
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            style={styles.notesInput}
          />
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  closeBtn: {
    padding: spacing.sm,
  },
  headerTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  saveBtn: {
    minWidth: 70,
  },
  content: {
    padding: spacing.lg,
  },
  presetSection: {
    marginBottom: spacing.md,
  },
  presetLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semiBold,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
  },
  presetRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  presetPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radii.full,
    paddingVertical: 6,
    paddingHorizontal: spacing.sm + 2,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  presetText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    color: colors.textPrimary,
  },
  formCard: {
    padding: spacing.lg,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    marginVertical: spacing.xs,
  },
  switchTextCol: {
    flex: 1,
    marginRight: spacing.md,
  },
  switchTitle: {
    fontSize: typography.sizes.sm + 1,
    fontWeight: typography.weights.semiBold,
    color: colors.textPrimary,
  },
  switchSubtitle: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  notesInput: {
    minHeight: 75,
    textAlignVertical: 'top',
  },
});
