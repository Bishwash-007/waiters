import { Stack } from "expo-router/stack";

export default function ScreensLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        gestureEnabled: true,
      }}
    >
      <Stack.Screen name="tableorders/[tableId]" options={{ title: "Table orders" }} />
      <Stack.Screen name="ordertaking/[tableId]" options={{ title: "New order" }} />
      <Stack.Screen name="ordertaking/summary/[id]" options={{ title: "Order summary" }} />
      <Stack.Screen name="orderdetails/[id]" options={{ title: "Order details" }} />
      <Stack.Screen name="tablecheckout/[tableId]" options={{ title: "Combined bill" }} />
    </Stack>
  );
}
