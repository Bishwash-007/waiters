import { Tabs } from "expo-router";
import { IconRenderer } from "@/components/icon";
import { iconMap } from "@/constants/icons";
import { useColorScheme } from "react-native";

export default function TabsLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: isDark ? "#FFFFFF" : "#111111",
        tabBarInactiveTintColor: isDark ? "#999999" : "#999999",
        tabBarStyle: {
          backgroundColor: isDark ? "#1A1A1A" : "#FFFFFF",
          borderTopColor: isDark ? "#333333" : "#F2F2F2",
        },
        tabBarLabelStyle: { fontFamily: "Inter_500Medium", fontSize: 12 },
      }}
    >
      <Tabs.Screen
        name="tables"
        options={{
          title: "Tables",
          tabBarIcon: ({ color, size }) => <IconRenderer color={color} icon={iconMap.table} size={size} />,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: "Orders",
          tabBarIcon: ({ color, size }) => <IconRenderer color={color} icon={iconMap.clipboard} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => <IconRenderer color={color} icon={iconMap.user} size={size} />,
        }}
      />
    </Tabs>
  );
}
