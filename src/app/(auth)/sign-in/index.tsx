import { Button, Header, TextInput } from "@/components/ui";
import { useAuthStore } from "@/stores/auth-store";
import { Link, router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const SignInScreen = () => {
  const tenantId = useAuthStore((state) => state.tenantId);
  const isLoading = useAuthStore((state) => state.isLoading);
  const error = useAuthStore((state) => state.error);
  const setTenant = useAuthStore((state) => state.setTenant);
  const login = useAuthStore((state) => state.login);
  const clearError = useAuthStore((state) => state.clearError);
  const [tenant, setTenantInput] = useState(tenantId ?? "");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const submit = async () => {
    const normalizedTenant = tenant.trim();
    if (!normalizedTenant) {
      setTenantInput("");
      return;
    }
    setTenant(normalizedTenant);
    try {
      await login({ email: email.trim(), password });
      router.replace("/(tabs)/tables");
    } catch {
      // The store exposes the API error in the form.
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-monochromatic-1" edges={["top", "bottom"]}>
      <Header title="Sign in" subtitle="Access your waiter account" />
      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-5 px-4 pb-8 pt-8"
        keyboardShouldPersistTaps="handled"
      >
        <View className="gap-2">
          <Text className="font-gothic text-heading-3 text-font-dark dark:text-white">Welcome back</Text>
          <Text className="font-gothic text-sm text-monochromatic-5 dark:text-monochromatic-7">
            Sign in to manage your tables and orders.
          </Text>
        </View>

        <TextInput
          accessibilityLabel="Tenant"
          autoCapitalize="none"
          onChangeText={(value) => {
            setTenantInput(value);
            clearError();
          }}
          placeholder="Tenant slug"
          value={tenant}
        />
        <TextInput
          accessibilityLabel="Email"
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          onChangeText={(value) => {
            setEmail(value);
            clearError();
          }}
          placeholder="Email address"
          value={email}
        />
        <TextInput
          accessibilityLabel="Password"
          autoCapitalize="none"
          autoComplete="password"
          onChangeText={(value) => {
            setPassword(value);
            clearError();
          }}
          placeholder="Password"
          secureTextEntry
          value={password}
        />

        {error ? (
          <Text accessibilityRole="alert" className="font-gothic text-sm text-font-dark dark:text-white">
            {error}
          </Text>
        ) : null}

        <Button loading={isLoading} onPress={() => void submit()}>
          Sign in
        </Button>

        <Pressable onPress={() => router.push("/(auth)/forgot-password")}>
          <Text className="text-center font-gothic text-sm font-semibold text-font-dark dark:text-white">
            Forgot password?
          </Text>
        </Pressable>
        <Link href="/(auth)/sign-up" asChild>
          <Pressable>
            <Text className="text-center font-gothic text-sm text-monochromatic-5 dark:text-monochromatic-7">
              Need an account? <Text className="font-semibold text-font-dark dark:text-white">Sign up</Text>
            </Text>
          </Pressable>
        </Link>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SignInScreen;
