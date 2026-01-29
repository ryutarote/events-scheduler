import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import type { Task } from '../types';
import { useTheme } from '../theme';

interface TaskCardProps {
  task: Task;
  onPress: () => void;
}

const formatTime = (timeStr: string): string => {
  return timeStr;
};

const isUpcoming = (dateStr: string, timeStr: string): boolean => {
  const now = new Date();
  const taskDate = new Date(`${dateStr}T${timeStr}:00`);
  const diffMs = taskDate.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  return diffHours > 0 && diffHours <= 24;
};

const isPast = (dateStr: string, timeStr: string): boolean => {
  const now = new Date();
  const taskDate = new Date(`${dateStr}T${timeStr}:00`);
  return taskDate.getTime() < now.getTime();
};

const getEventColor = (dateStr: string, timeStr: string): string => {
  if (isPast(dateStr, timeStr)) return '#8E8E93';
  if (isUpcoming(dateStr, timeStr)) return '#FF9500';
  return '#FF3B30';
};

export const TaskCard: React.FC<TaskCardProps> = ({ task, onPress }) => {
  const past = isPast(task.scheduledDate, task.scheduledTime);
  const eventColor = getEventColor(task.scheduledDate, task.scheduledTime);
  const { isDark, colors } = useTheme();

  const dynamicStyles = {
    container: { backgroundColor: colors.card },
    pressed: { backgroundColor: isDark ? '#2C2C2E' : '#E5E5EA' },
    borderColor: { borderBottomColor: colors.separator },
    time: { color: past ? colors.textSecondary : colors.text },
    title: { color: past ? colors.textSecondary : colors.text },
    subtitle: { color: past ? colors.textTertiary : colors.textSecondary },
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        dynamicStyles.container,
        pressed && dynamicStyles.pressed,
      ]}
      onPress={onPress}
    >
      <View style={[styles.colorBar, { backgroundColor: eventColor }]} />
      <View style={[styles.content, dynamicStyles.borderColor]}>
        <View style={styles.timeContainer}>
          <Text style={[styles.time, dynamicStyles.time]}>
            {formatTime(task.scheduledTime)}
          </Text>
        </View>
        <View style={styles.details}>
          <Text style={[styles.title, dynamicStyles.title]} numberOfLines={1}>
            {task.title}
          </Text>
          {task.purchaseUrl ? (
            <Text style={[styles.subtitle, dynamicStyles.subtitle]} numberOfLines={1}>
              チケット購入予定
            </Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginBottom: 1,
  },
  colorBar: {
    width: 4,
    borderRadius: 2,
    marginLeft: 16,
    marginVertical: 10,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingRight: 16,
    marginLeft: 12,
    borderBottomWidth: 0.5,
  },
  timeContainer: {
    width: 50,
  },
  time: {
    fontSize: 15,
    fontWeight: '600',
  },
  details: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    fontSize: 17,
    fontWeight: '400',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 15,
  },
});
