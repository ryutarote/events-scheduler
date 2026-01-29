import React, { useState, useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import type { Task } from '../types';
import { useTheme } from '../theme';

interface CalendarGridProps {
  tasks: Task[];
  selectedDate: string | null;
  onDateSelect: (date: string) => void;
  onMonthChange?: (year: number, month: number) => void;
}

interface CalendarDay {
  date: string;
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  hasEvents: boolean;
  eventCount: number;
}

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

const formatDateString = (year: number, month: number, day: number): string => {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

const getMonthDays = (
  year: number,
  month: number,
  tasks: Task[],
  selectedDate: string | null
): CalendarDay[] => {
  const days: CalendarDay[] = [];
  const today = new Date();
  const todayString = formatDateString(today.getFullYear(), today.getMonth(), today.getDate());

  // First day of the month
  const firstDay = new Date(year, month, 1);
  const startDayOfWeek = firstDay.getDay();

  // Last day of the month
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();

  // Previous month days
  const prevMonth = new Date(year, month, 0);
  const prevMonthDays = prevMonth.getDate();

  // Task dates set for quick lookup
  const taskDates = new Map<string, number>();
  tasks.forEach((task) => {
    const count = taskDates.get(task.scheduledDate) || 0;
    taskDates.set(task.scheduledDate, count + 1);
  });

  // Add previous month days
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const day = prevMonthDays - i;
    const prevMonthIndex = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    const dateStr = formatDateString(prevYear, prevMonthIndex, day);
    const eventCount = taskDates.get(dateStr) || 0;

    days.push({
      date: dateStr,
      day,
      isCurrentMonth: false,
      isToday: dateStr === todayString,
      isSelected: dateStr === selectedDate,
      hasEvents: eventCount > 0,
      eventCount,
    });
  }

  // Add current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = formatDateString(year, month, day);
    const eventCount = taskDates.get(dateStr) || 0;

    days.push({
      date: dateStr,
      day,
      isCurrentMonth: true,
      isToday: dateStr === todayString,
      isSelected: dateStr === selectedDate,
      hasEvents: eventCount > 0,
      eventCount,
    });
  }

  // Add next month days to complete the grid (6 rows)
  const remainingDays = 42 - days.length;
  for (let day = 1; day <= remainingDays; day++) {
    const nextMonthIndex = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;
    const dateStr = formatDateString(nextYear, nextMonthIndex, day);
    const eventCount = taskDates.get(dateStr) || 0;

    days.push({
      date: dateStr,
      day,
      isCurrentMonth: false,
      isToday: dateStr === todayString,
      isSelected: dateStr === selectedDate,
      hasEvents: eventCount > 0,
      eventCount,
    });
  }

  return days;
};

export const CalendarGrid: React.FC<CalendarGridProps> = ({
  tasks,
  selectedDate,
  onDateSelect,
  onMonthChange,
}) => {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const { colors } = useTheme();

  const days = useMemo(
    () => getMonthDays(currentYear, currentMonth, tasks, selectedDate),
    [currentYear, currentMonth, tasks, selectedDate]
  );

  const monthLabel = useMemo(() => {
    const date = new Date(currentYear, currentMonth, 1);
    return date.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' });
  }, [currentYear, currentMonth]);

  const goToPreviousMonth = () => {
    let newMonth = currentMonth - 1;
    let newYear = currentYear;
    if (newMonth < 0) {
      newMonth = 11;
      newYear -= 1;
    }
    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
    onMonthChange?.(newYear, newMonth);
  };

  const goToNextMonth = () => {
    let newMonth = currentMonth + 1;
    let newYear = currentYear;
    if (newMonth > 11) {
      newMonth = 0;
      newYear += 1;
    }
    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
    onMonthChange?.(newYear, newMonth);
  };

  const goToToday = () => {
    const now = new Date();
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth());
    onDateSelect(formatDateString(now.getFullYear(), now.getMonth(), now.getDate()));
  };

  const dynamicStyles = {
    container: { backgroundColor: colors.card },
    monthLabel: { color: colors.text },
    weekdayText: { color: colors.textSecondary },
    dayText: { color: colors.text },
    otherMonthText: { color: colors.textTertiary },
  };

  return (
    <View style={[styles.container, dynamicStyles.container]}>
      {/* Month Navigation Header */}
      <View style={styles.header}>
        <Pressable onPress={goToPreviousMonth} style={styles.navButton}>
          <Text style={styles.navButtonText}>‹</Text>
        </Pressable>
        <Pressable onPress={goToToday} style={styles.monthLabelContainer}>
          <Text style={[styles.monthLabel, dynamicStyles.monthLabel]}>{monthLabel}</Text>
        </Pressable>
        <Pressable onPress={goToNextMonth} style={styles.navButton}>
          <Text style={styles.navButtonText}>›</Text>
        </Pressable>
      </View>

      {/* Weekday Headers */}
      <View style={styles.weekdayRow}>
        {WEEKDAYS.map((day, index) => (
          <View key={day} style={styles.weekdayCell}>
            <Text
              style={[
                styles.weekdayText,
                dynamicStyles.weekdayText,
                index === 0 && styles.sundayText,
                index === 6 && styles.saturdayText,
              ]}
            >
              {day}
            </Text>
          </View>
        ))}
      </View>

      {/* Calendar Grid */}
      <View style={styles.grid}>
        {days.map((calendarDay, index) => {
          const dayOfWeek = index % 7;
          const isSunday = dayOfWeek === 0;
          const isSaturday = dayOfWeek === 6;

          return (
            <Pressable
              key={calendarDay.date}
              style={styles.dayCell}
              onPress={() => onDateSelect(calendarDay.date)}
            >
              <View
                style={[
                  styles.dayContent,
                  calendarDay.isToday && styles.todayContent,
                  calendarDay.isSelected && styles.selectedContent,
                ]}
              >
                <Text
                  style={[
                    styles.dayText,
                    dynamicStyles.dayText,
                    !calendarDay.isCurrentMonth && dynamicStyles.otherMonthText,
                    isSunday && calendarDay.isCurrentMonth && styles.sundayText,
                    isSaturday && calendarDay.isCurrentMonth && styles.saturdayText,
                    calendarDay.isToday && styles.todayText,
                    calendarDay.isSelected && styles.selectedText,
                  ]}
                >
                  {calendarDay.day}
                </Text>
              </View>
              {/* Event Indicators */}
              {calendarDay.hasEvents ? (
                <View style={styles.eventIndicatorContainer}>
                  {calendarDay.eventCount <= 3 ? (
                    [...Array(calendarDay.eventCount)].map((_, i) => (
                      <View key={i} style={styles.eventDot} />
                    ))
                  ) : (
                    <>
                      <View style={styles.eventDot} />
                      <View style={styles.eventDot} />
                      <Text style={styles.moreEventsText}>+</Text>
                    </>
                  )}
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    paddingBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  navButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonText: {
    fontSize: 28,
    fontWeight: '300',
    color: '#FF3B30',
  },
  monthLabelContainer: {
    flex: 1,
    alignItems: 'center',
  },
  monthLabel: {
    fontSize: 17,
    fontWeight: '600',
  },
  weekdayRow: {
    flexDirection: 'row',
    paddingHorizontal: 4,
    marginBottom: 4,
  },
  weekdayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  weekdayText: {
    fontSize: 13,
    fontWeight: '600',
  },
  sundayText: {
    color: '#FF3B30',
  },
  saturdayText: {
    color: '#007AFF',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 4,
  },
  dayCell: {
    width: '14.28%',
    alignItems: 'center',
    paddingVertical: 4,
  },
  dayContent: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
  },
  todayContent: {
    backgroundColor: 'rgba(255, 59, 48, 0.2)',
  },
  selectedContent: {
    backgroundColor: '#FF3B30',
  },
  dayText: {
    fontSize: 16,
    fontWeight: '400',
  },
  todayText: {
    fontWeight: '700',
    color: '#FF3B30',
  },
  selectedText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  eventIndicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 8,
    marginTop: 2,
  },
  eventDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#FF3B30',
    marginHorizontal: 1,
  },
  moreEventsText: {
    fontSize: 10,
    color: '#FF3B30',
    fontWeight: '600',
    marginLeft: 1,
  },
});
