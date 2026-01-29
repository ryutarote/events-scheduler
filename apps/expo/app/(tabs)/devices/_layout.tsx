import { Stack } from 'expo-router';

export default function DevicesLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: '端末管理' }} />
      <Stack.Screen name="pair" options={{ title: '端末をペアリング' }} />
    </Stack>
  );
}
