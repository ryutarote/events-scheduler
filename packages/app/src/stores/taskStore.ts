import { create } from 'zustand';
import type { Task, TaskFormData } from '../types';
import { scheduleNotification, cancelNotification } from '../platform';

interface TaskStore {
  tasks: Task[];
  isLoading: boolean;

  // CRUD operations
  addTask: (formData: TaskFormData) => Task;
  updateTask: (id: string, formData: Partial<TaskFormData>) => void;
  deleteTask: (id: string) => void;
  getTask: (id: string) => Task | undefined;

  // Bulk operations
  setTasks: (tasks: Task[]) => void;
  clearTasks: () => void;
}

const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  isLoading: false,

  addTask: (formData: TaskFormData): Task => {
    const now = new Date().toISOString();
    const newTask: Task = {
      id: generateId(),
      ...formData,
      createdAt: now,
      updatedAt: now,
    };

    set((state) => ({
      tasks: [...state.tasks, newTask],
    }));

    // Schedule notification if reminder is enabled (runs in browser only)
    console.log('[TaskStore] addTask - reminderEnabled:', formData.reminderEnabled, 'window:', typeof window);
    if (formData.reminderEnabled && typeof window !== 'undefined') {
      console.log('[TaskStore] Scheduling notification for task:', newTask.id);
      scheduleNotification(
        newTask.id,
        formData.title,
        `まもなく開始: ${formData.scheduledTime}`,
        formData.scheduledDate,
        formData.scheduledTime,
        formData.reminderMinutes
      )
        .then((result) => console.log('[TaskStore] Notification scheduled result:', result))
        .catch((err) => console.error('[TaskStore] Failed to schedule notification:', err));
    }

    return newTask;
  },

  updateTask: (id: string, formData: Partial<TaskFormData>): void => {
    const currentTask = get().getTask(id);

    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === id
          ? { ...task, ...formData, updatedAt: new Date().toISOString() }
          : task
      ),
    }));

    // Update notification schedule
    if (currentTask) {
      const updatedTask = { ...currentTask, ...formData };

      // Cancel existing notification
      cancelNotification(id);

      // Schedule new notification if reminder is enabled (runs in browser only)
      if (updatedTask.reminderEnabled && typeof window !== 'undefined') {
        scheduleNotification(
          id,
          updatedTask.title,
          `まもなく開始: ${updatedTask.scheduledTime}`,
          updatedTask.scheduledDate,
          updatedTask.scheduledTime,
          updatedTask.reminderMinutes
        ).catch((err) => console.error('Failed to schedule notification:', err));
      }
    }
  },

  deleteTask: (id: string): void => {
    // Cancel notification before deleting
    cancelNotification(id);

    set((state) => ({
      tasks: state.tasks.filter((task) => task.id !== id),
    }));
  },

  getTask: (id: string): Task | undefined => {
    return get().tasks.find((task) => task.id === id);
  },

  setTasks: (tasks: Task[]): void => {
    set({ tasks });
  },

  clearTasks: (): void => {
    set({ tasks: [] });
  },
}));
