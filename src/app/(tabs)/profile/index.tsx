import { Alert, Button, Header } from "@/components/ui";
import { IconRenderer } from "@/components/icon";
import { iconMap, type IconName } from "@/constants/icons";
import { useAuthStore } from "@/stores/auth-store";
import { router } from "expo-router";
import { useState, type ReactNode } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const ProfileScreen = () => {
  const user = useAuthStore((state) => state.user);
  const tenantId = useAuthStore((state) => state.tenantId);
  const isLoading = useAuthStore((state) => state.isLoading);
  const logout = useAuthStore((state) => state.logout);
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const handleLogout = async () => {
    setLogoutError(null);
    try {
      await logout();
      router.replace("/(auth)/sign-in");
    } catch (error) {
      console.error("Failed to log out.", error);
      setLogoutError("Could not sign out. Please try again.");
    }
  };

  const displayName = user?.fullName?.trim() || "Waiter";
  const initials = displayName
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-monochromatic-1" edges={["top"]}>
      <Header title="Profile" subtitle="Manage your account" />
      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-5 px-4 pb-8 pt-5"
        showsVerticalScrollIndicator={false}
      >
        <View className="items-center gap-3 rounded-card bg-monochromatic-9 px-5 py-6 dark:bg-monochromatic-2">
          <View className="h-20 w-20 items-center justify-center rounded-full bg-brand-5">
            <Text className="font-gothic text-heading-2 font-semibold text-white">{initials}</Text>
          </View>
          <View className="items-center gap-1">
            <Text className="font-gothic text-heading-4 font-semibold text-font-dark dark:text-white">
              {displayName}
            </Text>
            <Text className="font-gothic text-sm text-monochromatic-5 dark:text-monochromatic-7" selectable>
              {user?.email ?? "No email available"}
            </Text>
          </View>
          <View className="rounded-full bg-white px-3 py-1 dark:bg-monochromatic-1">
            <Text className="font-gothic text-xs font-semibold text-font-dark dark:text-white">
              {formatRole(user?.role)}
            </Text>
          </View>
          <View className={`rounded-full px-3 py-1 ${user?.isActive === false ? "bg-red-100" : "bg-green-100"}`}>
            <Text className="font-gothic text-xs font-semibold text-font-dark">
              {user?.isActive === false ? "Inactive account" : "Active account"}
            </Text>
          </View>
        </View>

        <Section title="Account information">
          <InfoRow label="Organization" value={user?.tenant?.name ?? user?.tenant?.slug ?? tenantId ?? "Not set"} />
          <InfoRow label="Branch" value={user?.branch?.name ?? "Not assigned"} />
          {user?.branch?.address ? <InfoRow label="Address" value={user.branch.address} /> : null}
          <InfoRow label="Subscription" value={formatStatus(user?.subscription?.status, "Not available")} />
          {user?.subscription?.endsAt ? (
            <InfoRow label="Subscription ends" value={formatDate(user.subscription.endsAt)} />
          ) : null}
        </Section>

        <Section title="Quick actions">
          <ActionRow
            icon="grid"
            label="QR options"
            description="Configure table and payment QR preferences"
            onPress={() => setNotice("QR options will be available when payment settings are connected.")}
          />
          <ActionRow
            icon="star"
            label="Service preferences"
            description="Manage your waiter workflow preferences"
            onPress={() => setNotice("Service preferences are managed by your branch manager.")}
          />
          <ActionRow
            icon="clipboard"
            label="Help and support"
            description="Find guidance for tables and orders"
            onPress={() => setNotice("For help, contact your branch manager.")}
          />
        </Section>

        {notice ? <Alert message={notice} variant="neutral" onDismiss={() => setNotice(null)} /> : null}
        {logoutError ? (
          <Alert message={logoutError} variant="error" actionLabel="Retry" onAction={() => void handleLogout()} />
        ) : null}
        <Button variant="outline" loading={isLoading} onPress={() => void handleLogout()}>
          Log out
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
};

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="gap-2">
      <Text className="px-1 font-gothic text-sm font-semibold text-monochromatic-5 dark:text-monochromatic-7">
        {title}
      </Text>
      <View className="overflow-hidden rounded-card border border-monochromatic-9 dark:border-monochromatic-2">
        {children}
      </View>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between gap-4 border-b border-monochromatic-9 bg-white px-4 py-4 last:border-b-0 dark:border-monochromatic-2 dark:bg-monochromatic-1">
      <Text className="font-gothic text-sm text-monochromatic-5 dark:text-monochromatic-7">{label}</Text>
      <Text
        className="max-w-[65%] text-right font-gothic text-sm font-semibold text-font-dark dark:text-white"
        numberOfLines={1}
        selectable
      >
        {value}
      </Text>
    </View>
  );
}

function ActionRow({
  icon,
  label,
  description,
  onPress,
}: {
  icon: IconName;
  label: string;
  description: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityLabel={`${label}. ${description}`}
      accessibilityRole="button"
      className="flex-row items-center gap-3 border-b border-monochromatic-9 bg-white px-4 py-4 last:border-b-0 active:opacity-70 dark:border-monochromatic-2 dark:bg-monochromatic-1"
      onPress={onPress}
    >
      <View className="h-10 w-10 items-center justify-center rounded-component bg-monochromatic-9 dark:bg-monochromatic-3">
        <IconRenderer icon={iconMap[icon]} size={20} />
      </View>
      <View className="min-w-0 flex-1 gap-1">
        <Text className="font-gothic text-sm font-semibold text-font-dark dark:text-white">{label}</Text>
        <Text className="font-gothic text-xs text-monochromatic-5 dark:text-monochromatic-7">{description}</Text>
      </View>
      <IconRenderer icon={iconMap.arrowRight} size={18} />
    </Pressable>
  );
}

function formatRole(role?: string | null) {
  if (!role) return "Waiter";
  return role.replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatStatus(status: string | null | undefined, fallback: string) {
  if (!status) return fallback;
  return status.replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
}

export default ProfileScreen;
