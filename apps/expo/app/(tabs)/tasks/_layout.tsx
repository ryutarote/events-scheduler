import { Stack } from 'expo-router';

export default function TasksLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'イベント一覧' }} />
      <Stack.Screen name="new" options={{ title: '新規イベント' }} />
      <Stack.Screen name="[id]/index" options={{ title: 'イベント詳細' }} />
      <Stack.Screen name="[id]/edit" options={{ title: 'イベントを編集' }} />
    </Stack>
  );
}
