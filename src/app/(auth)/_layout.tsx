import { Stack } from "expo-router/stack";

export const unstable_settings = {
  anchor: "sign-in",
};

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        gestureEnabled: true,
      }}
    >
      <Stack.Screen name="sign-in" options={{ gestureEnabled: false }} />
      <Stack.Screen name="sign-up" />
      <Stack.Screen name="forgot-password" />
    </Stack>
  );
}
