import React, { useState } from 'react';
import { View, Text, ScrollView, Switch, Pressable, TextInput, StyleSheet } from 'react-native';
import type { TaskEditScreenProps, TaskFormData } from '../types';
import { useTaskStore } from '../stores';
import { useTheme } from '../theme';

const getDefaultFormData = (): TaskFormData => {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return {
    title: '',
    purchaseUrl: '',
    scheduledDate: tomorrow.toISOString().split('T')[0],
    scheduledTime: '10:00',
    reminderEnabled: true,
    reminderMinutes: 30,
    notes: '',
  };
};

const REMINDER_OPTIONS = [
  { value: 0, label: 'イベントの時刻' },
  { value: 5, label: '5分前' },
  { value: 10, label: '10分前' },
  { value: 15, label: '15分前' },
  { value: 30, label: '30分前' },
  { value: 60, label: '1時間前' },
  { value: 120, label: '2時間前' },
  { value: 1440, label: '1日前' },
];

export const TaskEditScreen: React.FC<TaskEditScreenProps> = ({ nav, taskId }) => {
  const existingTask = useTaskStore((state) => taskId ? state.getTask(taskId) : undefined);
  const addTask = useTaskStore((state) => state.addTask);
  const updateTask = useTaskStore((state) => state.updateTask);
  const { colors } = useTheme();

  const isEditing = !!taskId && !!existingTask;

  const [formData, setFormData] = useState<TaskFormData>(() => {
    if (existingTask) {
      return {
        title: existingTask.title,
        purchaseUrl: existingTask.purchaseUrl,
        scheduledDate: existingTask.scheduledDate,
        scheduledTime: existingTask.scheduledTime,
        reminderEnabled: existingTask.reminderEnabled,
        reminderMinutes: existingTask.reminderMinutes,
        notes: existingTask.notes,
      };
    }
    return getDefaultFormData();
  });

  const [showReminderPicker, setShowReminderPicker] = useState(false);

  const updateField = <K extends keyof TaskFormData>(field: K, value: TaskFormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (!formData.title.trim()) {
      return;
    }

    if (isEditing && taskId) {
      updateTask(taskId, formData);
    } else {
      addTask(formData);
    }

    nav.back();
  };

  const handleCancel = () => {
    nav.back();
  };

  const formatDisplayDate = (dateStr: string): string => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'short',
      });
    } catch {
      return dateStr;
    }
  };

  const formatDisplayTime = (timeStr: string): string => {
    try {
      const [hours, minutes] = timeStr.split(':');
      const hour = parseInt(hours, 10);
      const ampm = hour >= 12 ? '午後' : '午前';
      const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
      return `${ampm}${displayHour}:${minutes}`;
    } catch {
      return timeStr;
    }
  };

  const getReminderLabel = (minutes: number): string => {
    const option = REMINDER_OPTIONS.find(opt => opt.value === minutes);
    return option ? option.label : `${minutes}分前`;
  };

  const dynamicStyles = {
    container: { backgroundColor: colors.background },
    navigationBar: { backgroundColor: colors.background, borderBottomColor: colors.separator },
    card: { backgroundColor: colors.card },
    text: { color: colors.text },
    textSecondary: { color: colors.textSecondary },
    textTertiary: { color: colors.textTertiary },
    separator: { backgroundColor: colors.separator },
    inputBackground: { backgroundColor: colors.backgroundTertiary },
  };

  return (
    <View style={[styles.container, dynamicStyles.container]}>
      {/* iOS-style Navigation Bar */}
      <View style={[styles.navigationBar, dynamicStyles.navigationBar]}>
        <Pressable onPress={handleCancel} style={styles.navButton}>
          <Text style={styles.cancelText}>キャンセル</Text>
        </Pressable>
        <Text style={[styles.navTitle, dynamicStyles.text]}>{isEditing ? 'イベントを編集' : '新規イベント'}</Text>
        <Pressable
          onPress={handleSave}
          style={styles.navButton}
          disabled={!formData.title.trim()}
        >
          <Text style={[
            styles.saveText,
            !formData.title.trim() && styles.disabledText
          ]}>
            {isEditing ? '完了' : '追加'}
          </Text>
        </Pressable>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Title Input Card */}
        <View style={[styles.titleCard, dynamicStyles.card]}>
          <View style={styles.titleInputRow}>
            <View style={styles.colorDot} />
            <TextInput
              style={[styles.titleInput, dynamicStyles.text]}
              value={formData.title}
              onChangeText={(text) => updateField('title', text)}
              placeholder="タイトル"
              placeholderTextColor={colors.textTertiary}
              autoFocus={!isEditing}
            />
          </View>
        </View>

        {/* Date & Time Section */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionHeader, dynamicStyles.textSecondary]}>日時</Text>
          <View style={[styles.card, dynamicStyles.card]}>
            {/* Date Row */}
            <View style={styles.cardRow}>
              <View style={[styles.iconBox, { backgroundColor: '#FF3B30' }]}>
                <Text style={styles.iconText}>📅</Text>
              </View>
              <Text style={[styles.cardLabel, dynamicStyles.text]}>日付</Text>
              <View style={[styles.cardValueContainer, dynamicStyles.inputBackground]}>
                <Text style={[styles.cardValueText, dynamicStyles.text]}>{formatDisplayDate(formData.scheduledDate)}</Text>
              </View>
            </View>

            <View style={[styles.cardSeparator, dynamicStyles.separator]} />

            {/* Time Row */}
            <View style={styles.cardRow}>
              <View style={[styles.iconBox, { backgroundColor: '#007AFF' }]}>
                <Text style={styles.iconText}>🕐</Text>
              </View>
              <Text style={[styles.cardLabel, dynamicStyles.text]}>時刻</Text>
              <View style={[styles.cardValueContainer, dynamicStyles.inputBackground]}>
                <Text style={[styles.cardValueText, dynamicStyles.text]}>{formatDisplayTime(formData.scheduledTime)}</Text>
              </View>
            </View>
          </View>

          {/* Manual Date/Time Input */}
          <Text style={[styles.inputHint, dynamicStyles.textSecondary]}>日付: YYYY-MM-DD、時刻: HH:MM 形式で入力</Text>
          <View style={styles.inlineInputRow}>
            <TextInput
              style={[styles.inlineInput, dynamicStyles.card, dynamicStyles.text]}
              value={formData.scheduledDate}
              onChangeText={(text) => updateField('scheduledDate', text)}
              placeholder="2024-12-31"
              placeholderTextColor={colors.textTertiary}
            />
            <TextInput
              style={[styles.inlineInput, dynamicStyles.card, dynamicStyles.text]}
              value={formData.scheduledTime}
              onChangeText={(text) => updateField('scheduledTime', text)}
              placeholder="10:00"
              placeholderTextColor={colors.textTertiary}
            />
          </View>
        </View>

        {/* Reminder Section */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionHeader, dynamicStyles.textSecondary]}>通知</Text>
          <View style={[styles.card, dynamicStyles.card]}>
            {/* Reminder Toggle Row */}
            <View style={styles.cardRow}>
              <View style={[styles.iconBox, { backgroundColor: '#FF9500' }]}>
                <Text style={styles.iconText}>🔔</Text>
              </View>
              <Text style={[styles.cardLabel, dynamicStyles.text]}>リマインダー</Text>
              <Switch
                value={formData.reminderEnabled}
                onValueChange={(value) => updateField('reminderEnabled', value)}
                trackColor={{ false: colors.separator, true: '#FF3B30' }}
                thumbColor="#FFFFFF"
              />
            </View>

            {/* Reminder Time Selection */}
            {formData.reminderEnabled ? (
              <>
                <View style={[styles.cardSeparator, dynamicStyles.separator]} />
                <Pressable
                  style={styles.cardRow}
                  onPress={() => setShowReminderPicker(!showReminderPicker)}
                >
                  <View style={[styles.iconBox, { backgroundColor: '#5856D6' }]}>
                    <Text style={styles.iconText}>⏰</Text>
                  </View>
                  <Text style={[styles.cardLabel, dynamicStyles.text]}>通知タイミング</Text>
                  <View style={[styles.cardValueContainer, dynamicStyles.inputBackground]}>
                    <Text style={[styles.cardValueText, dynamicStyles.text]}>{getReminderLabel(formData.reminderMinutes)}</Text>
                  </View>
                  <Text style={[styles.chevron, dynamicStyles.textTertiary]}>{showReminderPicker ? '▼' : '›'}</Text>
                </Pressable>

                {/* Reminder Options */}
                {showReminderPicker ? (
                  <View style={[styles.reminderOptions, { borderTopColor: colors.separator }]}>
                    {REMINDER_OPTIONS.map((option) => (
                      <Pressable
                        key={option.value}
                        style={[
                          styles.reminderOption,
                          formData.reminderMinutes === option.value && styles.reminderOptionSelected
                        ]}
                        onPress={() => {
                          updateField('reminderMinutes', option.value);
                          setShowReminderPicker(false);
                        }}
                      >
                        <Text style={[
                          styles.reminderOptionText,
                          dynamicStyles.text,
                          formData.reminderMinutes === option.value && styles.reminderOptionTextSelected
                        ]}>
                          {option.label}
                        </Text>
                        {formData.reminderMinutes === option.value ? (
                          <Text style={styles.checkmark}>✓</Text>
                        ) : null}
                      </Pressable>
                    ))}
                  </View>
                ) : null}
              </>
            ) : null}
          </View>
        </View>

        {/* URL Section */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionHeader, dynamicStyles.textSecondary]}>購入URL</Text>
          <View style={[styles.card, dynamicStyles.card]}>
            <View style={styles.urlInputContainer}>
              <View style={[styles.iconBox, { backgroundColor: '#007AFF' }]}>
                <Text style={styles.iconText}>🔗</Text>
              </View>
              <TextInput
                style={[styles.urlInput, dynamicStyles.text]}
                value={formData.purchaseUrl}
                onChangeText={(text) => updateField('purchaseUrl', text)}
                placeholder="https://example.com/tickets"
                placeholderTextColor={colors.textTertiary}
                keyboardType="url"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>
        </View>

        {/* Notes Section */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionHeader, dynamicStyles.textSecondary]}>メモ</Text>
          <View style={[styles.card, dynamicStyles.card]}>
            <View style={styles.notesInputContainer}>
              <View style={[styles.iconBox, { backgroundColor: '#FFCC00' }]}>
                <Text style={styles.iconText}>📝</Text>
              </View>
              <TextInput
                style={[styles.notesInput, dynamicStyles.text]}
                value={formData.notes}
                onChangeText={(text) => updateField('notes', text)}
                placeholder="メモを入力..."
                placeholderTextColor={colors.textTertiary}
                multiline
                textAlignVertical="top"
              />
            </View>
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  navigationBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  navButton: {
    minWidth: 80,
  },
  navTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  cancelText: {
    fontSize: 17,
    color: '#FF3B30',
  },
  saveText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FF3B30',
    textAlign: 'right',
  },
  disabledText: {
    color: '#48484A',
  },
  scrollView: {
    flex: 1,
  },
  // Title Card
  titleCard: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  titleInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF3B30',
    marginRight: 12,
  },
  titleInput: {
    flex: 1,
    fontSize: 17,
    paddingVertical: 12,
  },
  // Section Container
  sectionContainer: {
    marginTop: 24,
    marginHorizontal: 16,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '400',
    textTransform: 'uppercase',
    marginBottom: 8,
    marginLeft: 16,
    letterSpacing: -0.08,
  },
  // Card Styles
  card: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  cardSeparator: {
    height: 0.5,
    marginLeft: 60,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 16,
  },
  cardLabel: {
    flex: 1,
    fontSize: 17,
  },
  cardValueContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  cardValueText: {
    fontSize: 15,
  },
  chevron: {
    fontSize: 16,
    marginLeft: 8,
  },
  // Inline Input
  inputHint: {
    fontSize: 13,
    marginTop: 8,
    marginLeft: 4,
  },
  inlineInputRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  inlineInput: {
    flex: 1,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
  },
  // Reminder Options
  reminderOptions: {
    borderTopWidth: 0.5,
    marginLeft: 60,
    paddingTop: 8,
    paddingBottom: 8,
  },
  reminderOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  reminderOptionSelected: {
    backgroundColor: 'rgba(255, 59, 48, 0.15)',
  },
  reminderOptionText: {
    fontSize: 16,
  },
  reminderOptionTextSelected: {
    color: '#FF3B30',
    fontWeight: '500',
  },
  checkmark: {
    fontSize: 18,
    color: '#FF3B30',
    fontWeight: '600',
  },
  // URL Input
  urlInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  urlInput: {
    flex: 1,
    fontSize: 16,
  },
  // Notes Input
  notesInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  notesInput: {
    flex: 1,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  bottomPadding: {
    height: 40,
  },
});
