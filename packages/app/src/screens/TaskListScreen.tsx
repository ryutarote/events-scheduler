import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import type { TaskListScreenProps } from '../types';
import { useTaskStore } from '../stores';
import { TaskCard } from '../components/TaskCard';
import { CalendarGrid } from '../components/CalendarGrid';
import { useTheme } from '../theme';
import { requestNotificationPermission, hasNotificationPermission, testNotification, testScheduledNotification } from '../platform';

const formatSelectedDateHeader = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });
};

const getTodayString = (): string => {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
};

export const TaskListScreen: React.FC<TaskListScreenProps> = ({ nav }) => {
  const tasks = useTaskStore((state) => state.tasks);
  const [selectedDate, setSelectedDate] = useState<string | null>(getTodayString());
  const [notificationPermission, setNotificationPermission] = useState<boolean | null>(null);
  const { colors } = useTheme();

  // Check notification permission on mount
  useEffect(() => {
    const checkPermission = () => {
      if (typeof window !== 'undefined') {
        setNotificationPermission(hasNotificationPermission());
      }
    };
    checkPermission();
  }, []);

  const handleRequestNotificationPermission = async () => {
    const granted = await requestNotificationPermission();
    setNotificationPermission(granted);
  };

  const handleTestNotification = async () => {
    try {
      await testNotification();
      console.log('Test notification sent');
    } catch (err) {
      console.error('Failed to send test notification:', err);
    }
  };

  const handleTestScheduledNotification = async () => {
    try {
      const result = await testScheduledNotification();
      if (result) {
        console.log('Scheduled notification test: notification will arrive in 1 minute');
        alert('1分後に通知が届きます。ブラウザのコンソールでログを確認してください。');
      } else {
        alert('通知のスケジュールに失敗しました。コンソールを確認してください。');
      }
    } catch (err) {
      console.error('Failed to schedule test notification:', err);
    }
  };

  const selectedDateTasks = useMemo(() => {
    if (!selectedDate) return [];
    return tasks
      .filter((task) => task.scheduledDate === selectedDate)
      .sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));
  }, [tasks, selectedDate]);

  const handleTaskPress = (taskId: string) => {
    nav.push(`/tasks/${taskId}`);
  };

  const handleNewTask = () => {
    nav.push('/tasks/new');
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
  };

  const dynamicStyles = {
    container: {
      backgroundColor: colors.background,
    },
    header: {
      backgroundColor: colors.background,
    },
    headerTitle: {
      color: colors.text,
    },
    selectedDateText: {
      color: colors.text,
    },
    noEventsContainer: {
      backgroundColor: colors.card,
    },
    noEventsText: {
      color: colors.textSecondary,
    },
    eventsContainer: {
      backgroundColor: colors.card,
    },
  };

  return (
    <View style={[styles.container, dynamicStyles.container]}>
      {/* Header */}
      <View style={[styles.header, dynamicStyles.header]}>
        <Text style={[styles.headerTitle, dynamicStyles.headerTitle]}>カレンダー</Text>
        <Pressable onPress={handleNewTask} style={styles.addButton}>
          <Text style={styles.addButtonText}>+</Text>
        </Pressable>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Notification Permission Banner */}
        {notificationPermission === false ? (
          <Pressable
            style={[styles.notificationBanner, { backgroundColor: colors.card }]}
            onPress={handleRequestNotificationPermission}
          >
            <Text style={styles.notificationBannerIcon}>🔔</Text>
            <View style={styles.notificationBannerContent}>
              <Text style={[styles.notificationBannerTitle, { color: colors.text }]}>
                通知を有効にする
              </Text>
              <Text style={[styles.notificationBannerSubtitle, { color: colors.textSecondary }]}>
                タップして通知を許可してください
              </Text>
            </View>
            <Text style={[styles.notificationBannerChevron, { color: colors.textTertiary }]}>›</Text>
          </Pressable>
        ) : null}

        {/* Test Notification Buttons (for debugging) */}
        {notificationPermission === true ? (
          <View style={styles.testNotificationContainer}>
            <Pressable
              style={[styles.testNotificationButton, { backgroundColor: colors.card }]}
              onPress={handleTestNotification}
            >
              <Text style={styles.testNotificationIcon}>🧪</Text>
              <Text style={[styles.testNotificationText, { color: colors.text }]}>
                即時通知
              </Text>
            </Pressable>
            <Pressable
              style={[styles.testNotificationButton, { backgroundColor: colors.card }]}
              onPress={handleTestScheduledNotification}
            >
              <Text style={styles.testNotificationIcon}>⏱️</Text>
              <Text style={[styles.testNotificationText, { color: colors.text }]}>
                1分後通知
              </Text>
            </Pressable>
          </View>
        ) : null}

        {/* Calendar Grid */}
        <CalendarGrid
          tasks={tasks}
          selectedDate={selectedDate}
          onDateSelect={handleDateSelect}
        />

        {/* Selected Date Section */}
        {selectedDate ? (
          <View style={styles.selectedDateSection}>
            <View style={styles.selectedDateHeader}>
              <Text style={[styles.selectedDateText, dynamicStyles.selectedDateText]}>
                {formatSelectedDateHeader(selectedDate)}
              </Text>
              {selectedDate === getTodayString() ? (
                <View style={styles.todayBadge}>
                  <Text style={styles.todayBadgeText}>今日</Text>
                </View>
              ) : null}
            </View>

            {selectedDateTasks.length === 0 ? (
              <View style={[styles.noEventsContainer, dynamicStyles.noEventsContainer]}>
                <Text style={[styles.noEventsText, dynamicStyles.noEventsText]}>イベントなし</Text>
                <Pressable onPress={handleNewTask} style={styles.addEventButton}>
                  <Text style={styles.addEventButtonText}>イベントを追加</Text>
                </Pressable>
              </View>
            ) : (
              <View style={[styles.eventsContainer, dynamicStyles.eventsContainer]}>
                {selectedDateTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onPress={() => handleTaskPress(task.id)}
                  />
                ))}
              </View>
            )}
          </View>
        ) : null}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '700',
  },
  addButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    fontSize: 24,
    fontWeight: '400',
    color: '#FFFFFF',
    marginTop: -2,
  },
  scrollView: {
    flex: 1,
  },
  selectedDateSection: {
    marginTop: 8,
  },
  selectedDateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  selectedDateText: {
    fontSize: 20,
    fontWeight: '600',
  },
  todayBadge: {
    marginLeft: 8,
    backgroundColor: '#FF3B30',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  todayBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  noEventsContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  noEventsText: {
    fontSize: 17,
    marginBottom: 16,
  },
  addEventButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addEventButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  eventsContainer: {
  },
  bottomPadding: {
    height: 40,
  },
  notificationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    padding: 12,
    borderRadius: 10,
  },
  notificationBannerIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  notificationBannerContent: {
    flex: 1,
  },
  notificationBannerTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  notificationBannerSubtitle: {
    fontSize: 13,
  },
  notificationBannerChevron: {
    fontSize: 22,
    fontWeight: '300',
  },
  testNotificationContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    gap: 8,
  },
  testNotificationButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 10,
  },
  testNotificationIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  testNotificationText: {
    fontSize: 15,
    fontWeight: '500',
  },
});
