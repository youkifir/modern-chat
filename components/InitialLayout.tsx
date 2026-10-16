import { COLORS } from "@/constants/theme";
import { useConvexAuth } from "convex/react";
import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";

export default function InitialLayout() {
    const { isLoading, isAuthenticated } = useConvexAuth();
    const segments = useSegments();
    const router = useRouter();

    useEffect(() => {
        if (isLoading) return;

        const onLoginScreen = segments[0] === "login";

        if (!isAuthenticated && !onLoginScreen) {
            router.replace("/login");
        } else if (isAuthenticated && onLoginScreen) {
            router.replace("/");
        }
    }, [isLoading, isAuthenticated, segments]);

    // Stack рендерится всегда, чтобы набор маршрутов не менялся между рендерами
    return (
        <>
            <Stack
                screenOptions={{
                    headerStyle: { backgroundColor: COLORS.surface },
                    headerTintColor: "#FFFFFF",
                    contentStyle: { backgroundColor: COLORS.surface },
                }}
            >
                <Stack.Screen name="index" options={{ title: "Кімнати" }} />
                <Stack.Screen name="login" options={{ headerShown: false }} />
                <Stack.Screen
                    name="new-room"
                    options={{ title: "Нова кімната", presentation: "modal" }}
                />
                <Stack.Screen name="profile" options={{ title: "Профіль" }} />
                <Stack.Screen name="chat/[id]" options={{ title: "Чат" }} />
                <Stack.Screen name="settings/[id]" options={{ title: "Налаштування" }} />
                <Stack.Screen name="user/[id]" options={{ title: "Користувач" }} />
            </Stack>

            {isLoading && (
                <View
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: COLORS.surface,
                    }}
                >
                    <ActivityIndicator size="large" color="#FFFFFF" />
                </View>
            )}
        </>
    );
}