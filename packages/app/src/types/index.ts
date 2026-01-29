// Navigation type - platform agnostic
export interface Nav {
  push: (path: string) => void;
  replace: (path: string) => void;
  back: () => void;
}

// Task type for ticket scheduling
export interface Task {
  id: string;
  title: string;
  purchaseUrl: string;
  scheduledDate: string; // ISO date string
  scheduledTime: string; // HH:mm format
  reminderEnabled: boolean;
  reminderMinutes: number; // minutes before scheduled time
  notes: string;
  createdAt: string;
  updatedAt: string;
}

// Device type for pairing
export interface Device {
  id: string;
  name: string;
  pairedAt: string;
  lastSyncAt: string;
}

// Screen Props types
export interface TaskListScreenProps {
  nav: Nav;
}

export interface TaskDetailScreenProps {
  nav: Nav;
  taskId: string;
}

export interface TaskEditScreenProps {
  nav: Nav;
  taskId?: string; // undefined for new task
}

export interface DeviceListScreenProps {
  nav: Nav;
}

export interface DevicePairScreenProps {
  nav: Nav;
}

// Form data for task creation/editing
export interface TaskFormData {
  title: string;
  purchaseUrl: string;
  scheduledDate: string;
  scheduledTime: string;
  reminderEnabled: boolean;
  reminderMinutes: number;
  notes: string;
}
