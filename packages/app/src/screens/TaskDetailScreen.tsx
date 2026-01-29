import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Alert } from 'react-native';
import type { TaskDetailScreenProps } from '../types';
import { useTaskStore } from '../stores';
import { openExternalUrl } from '../platform';
import { useTheme } from '../theme';

export const TaskDetailScreen: React.FC<TaskDetailScreenProps> = ({ nav, taskId }) => {
  const task = useTaskStore((state) => state.getTask(taskId));
  const deleteTask = useTaskStore((state) => state.deleteTask);
  const { colors } = useTheme();

  const dynamicStyles = {
    container: { backgroundColor: colors.background },
    navigationBar: { backgroundColor: colors.background, borderBottomColor: colors.separator },
    card: { backgroundColor: colors.card },
    text: { color: colors.text },
    textSecondary: { color: colors.textSecondary },
    separator: { backgroundColor: colors.separator },
  };

  if (!task) {
    return (
      <View style={[styles.container, dynamicStyles.container]}>
        <View style={styles.notFound}>
          <View style={[styles.notFoundIconContainer, { backgroundColor: colors.backgroundTertiary }]}>
            <Text style={styles.notFoundIcon}>📅</Text>
          </View>
          <Text style={[styles.notFoundTitle, dynamicStyles.text]}>イベントが見つかりません</Text>
          <Text style={[styles.notFoundSubtitle, dynamicStyles.textSecondary]}>このイベントは削除された可能性があります</Text>
          <Pressable onPress={() => nav.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>カレンダーに戻る</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    });
  };

  const formatTime = (timeStr: string): string => {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? '午後' : '午前';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${ampm}${displayHour}:${minutes}`;
  };

  const formatReminderTime = (minutes: number): string => {
    if (minutes === 0) return 'イベントの時刻';
    if (minutes < 60) return `${minutes}分前`;
    if (minutes === 60) return '1時間前';
    if (minutes < 1440) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours}時間${mins}分前` : `${hours}時間前`;
    }
    const days = Math.floor(minutes / 1440);
    return `${days}日前`;
  };

  const handleOpenUrl = async () => {
    if (task.purchaseUrl) {
      await openExternalUrl(task.purchaseUrl);
    }
  };

  const handleEdit = () => {
    nav.push(`/tasks/${taskId}/edit`);
  };

  const handleDelete = () => {
    const confirmDelete = () => {
      deleteTask(taskId);
      nav.back();
    };

    Alert.alert(
      'イベントを削除',
      `「${task.title}」を削除してもよろしいですか？この操作は取り消せません。`,
      [
        { text: 'キャンセル', style: 'cancel' },
        { text: '削除', style: 'destructive', onPress: confirmDelete },
      ]
    );
  };

  return (
    <View style={[styles.container, dynamicStyles.container]}>
      {/* iOS-style Navigation Bar */}
      <View style={[styles.navigationBar, dynamicStyles.navigationBar]}>
        <Pressable onPress={() => nav.back()} style={styles.navButton}>
          <Text style={styles.navButtonIcon}>‹</Text>
          <Text style={styles.navButtonText}>カレンダー</Text>
        </Pressable>
        <Pressable onPress={handleEdit} style={styles.navButton}>
          <Text style={styles.editButtonText}>編集</Text>
        </Pressable>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Event Header Card */}
        <View style={[styles.eventHeaderCard, dynamicStyles.card]}>
          <View style={styles.eventColorBar} />
          <View style={styles.eventHeaderContent}>
            <Text style={[styles.eventTitle, dynamicStyles.text]}>{task.title}</Text>
            <View style={styles.eventDateTimeContainer}>
              <Text style={[styles.eventDate, dynamicStyles.text]}>{formatDate(task.scheduledDate)}</Text>
              <Text style={[styles.eventTime, dynamicStyles.textSecondary]}>{formatTime(task.scheduledTime)}</Text>
            </View>
          </View>
        </View>

        {/* Event Details Section */}
        <View style={[styles.detailsCard, dynamicStyles.card]}>
          {/* Calendar Row */}
          <View style={styles.detailRow}>
            <View style={styles.detailIconContainer}>
              <View style={[styles.detailIconBox, { backgroundColor: '#FF3B30' }]}>
                <Text style={styles.detailIconText}>📅</Text>
              </View>
            </View>
            <View style={styles.detailContent}>
              <Text style={[styles.detailLabel, dynamicStyles.textSecondary]}>カレンダー</Text>
              <Text style={[styles.detailValue, dynamicStyles.text]}>イベント</Text>
            </View>
          </View>

          <View style={[styles.detailSeparator, dynamicStyles.separator]} />

          {/* Reminder Row */}
          <View style={styles.detailRow}>
            <View style={styles.detailIconContainer}>
              <View style={[styles.detailIconBox, { backgroundColor: '#FF9500' }]}>
                <Text style={styles.detailIconText}>🔔</Text>
              </View>
            </View>
            <View style={styles.detailContent}>
              <Text style={[styles.detailLabel, dynamicStyles.textSecondary]}>通知</Text>
              <Text style={[styles.detailValue, dynamicStyles.text]}>
                {task.reminderEnabled
                  ? formatReminderTime(task.reminderMinutes)
                  : 'なし'}
              </Text>
            </View>
          </View>

          {/* URL Row - if exists */}
          {task.purchaseUrl ? (
            <>
              <View style={[styles.detailSeparator, dynamicStyles.separator]} />
              <Pressable style={styles.detailRow} onPress={handleOpenUrl}>
                <View style={styles.detailIconContainer}>
                  <View style={[styles.detailIconBox, { backgroundColor: '#007AFF' }]}>
                    <Text style={styles.detailIconText}>🔗</Text>
                  </View>
                </View>
                <View style={styles.detailContent}>
                  <Text style={[styles.detailLabel, dynamicStyles.textSecondary]}>購入URL</Text>
                  <Text style={styles.detailValueLink} numberOfLines={1}>
                    {task.purchaseUrl}
                  </Text>
                </View>
                <Text style={[styles.chevron, { color: colors.textTertiary }]}>›</Text>
              </Pressable>
            </>
          ) : null}
        </View>

        {/* Notes Section - if exists */}
        {task.notes ? (
          <View style={[styles.notesCard, dynamicStyles.card]}>
            <View style={styles.notesHeader}>
              <View style={[styles.detailIconBox, { backgroundColor: '#FFCC00' }]}>
                <Text style={styles.detailIconText}>📝</Text>
              </View>
              <Text style={[styles.notesTitle, dynamicStyles.text]}>メモ</Text>
            </View>
            <Text style={[styles.notesContent, dynamicStyles.textSecondary]}>{task.notes}</Text>
          </View>
        ) : null}

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          <Pressable style={styles.openUrlButton} onPress={handleOpenUrl} disabled={!task.purchaseUrl}>
            <Text style={[styles.openUrlButtonText, !task.purchaseUrl && styles.disabledButtonText]}>
              購入ページを開く
            </Text>
          </Pressable>
        </View>

        {/* Delete Button */}
        <View style={styles.deleteSection}>
          <Pressable style={[styles.deleteButton, dynamicStyles.card]} onPress={handleDelete}>
            <Text style={styles.deleteButtonText}>イベントを削除</Text>
          </Pressable>
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
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderBottomWidth: 0.5,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  navButtonIcon: {
    fontSize: 28,
    color: '#FF3B30',
    marginRight: -4,
    fontWeight: '300',
  },
  navButtonText: {
    fontSize: 17,
    color: '#FF3B30',
  },
  editButtonText: {
    fontSize: 17,
    color: '#FF3B30',
    fontWeight: '400',
  },
  scrollView: {
    flex: 1,
  },
  // Event Header Card
  eventHeaderCard: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  eventColorBar: {
    width: 6,
    backgroundColor: '#FF3B30',
  },
  eventHeaderContent: {
    flex: 1,
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  eventTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  eventDateTimeContainer: {
    flexDirection: 'column',
  },
  eventDate: {
    fontSize: 17,
    marginBottom: 4,
  },
  eventTime: {
    fontSize: 17,
  },
  // Details Card
  detailsCard: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  detailIconContainer: {
    marginRight: 12,
  },
  detailIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailIconText: {
    fontSize: 16,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 13,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 17,
  },
  detailValueLink: {
    fontSize: 15,
    color: '#FF3B30',
  },
  detailSeparator: {
    height: 0.5,
    marginLeft: 60,
  },
  chevron: {
    fontSize: 22,
    fontWeight: '300',
  },
  // Notes Card
  notesCard: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
  },
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  notesTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginLeft: 12,
  },
  notesContent: {
    fontSize: 15,
    lineHeight: 22,
    marginLeft: 44,
  },
  // Action Section
  actionSection: {
    marginHorizontal: 16,
    marginTop: 24,
  },
  openUrlButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  openUrlButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  disabledButtonText: {
    opacity: 0.5,
  },
  // Delete Section
  deleteSection: {
    marginHorizontal: 16,
    marginTop: 24,
  },
  deleteButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 17,
    color: '#FF3B30',
  },
  // Not Found State
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  notFoundIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  notFoundIcon: {
    fontSize: 48,
  },
  notFoundTitle: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  notFoundSubtitle: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  backButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  backButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  bottomPadding: {
    height: 40,
  },
});
