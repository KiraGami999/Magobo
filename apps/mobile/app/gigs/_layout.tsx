import { Stack } from 'expo-router';

export default function GigsLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Gigs' }} />
      <Stack.Screen name="[id]" options={{ title: 'Gig details' }} />
      <Stack.Screen name="new" options={{ title: 'Post a gig' }} />
    </Stack>
  );
}
