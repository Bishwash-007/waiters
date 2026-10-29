import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="tables" />
      <Tabs.Screen name="profile" />
      <Tabs.Screen name="orders" />
    </Tabs>
  );
}
