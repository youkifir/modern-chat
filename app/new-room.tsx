import { COLORS } from "@/constants/theme";
import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";
import { Stack, useRouter } from "expo-router";
import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export default function NewRoomScreen() {
    const router = useRouter();
    const createRoom = useMutation(api.rooms.createRoom);

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const canSubmit = !isLoading && title.trim().length > 0;

    const handleCreate = async () => {
        if (!title.trim()) {
            Alert.alert("Помилка", "Будь ласка, введіть назву кімнати.");
            return;
        }
        if (isLoading) return;

        setIsLoading(true);
        try {
            const roomId = await createRoom({
                title: title.trim(),
                description: description.trim() || undefined,
            });
            // Один перехід замість back() + push()
            router.replace(`/chat/${roomId}`);
        } catch (error: any) {
            console.error("Error creating room", error);
            Alert.alert(
                "Помилка",
                `Не вдалося створити кімнату.\n\n${error?.message ?? ""}`
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            className="flex-1 bg-surface"
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            <Stack.Screen options={{ title: "Нова кімната" }} />

            <View className="flex-1 p-6 gap-4 mt-2">
                <View>
                    <Text className="text-textMuted text-xs font-semibold uppercase mb-2">
                        Назва кімнати *
                    </Text>
                    <TextInput
                        className="bg-secondary border border-surfaceLight rounded-2xl px-4 py-3.5 text-white text-base"
                        placeholder="Наприклад: Обговорення React Native"
                        placeholderTextColor={COLORS.textMuted}
                        value={title}
                        onChangeText={setTitle}
                        maxLength={100}
                        autoFocus
                    />
                </View>

                <View>
                    <Text className="text-textMuted text-xs font-semibold uppercase mb-2">
                        Опис (необов'язково)
                    </Text>
                    <TextInput
                        className="bg-secondary border border-surfaceLight rounded-2xl px-4 py-3.5 text-white text-base min-h-[100px]"
                        placeholder="Короткий опис теми спілкування..."
                        placeholderTextColor={COLORS.textMuted}
                        value={description}
                        onChangeText={setDescription}
                        multiline
                        numberOfLines={4}
                        maxLength={300}
                        textAlignVertical="top"
                    />
                </View>

                <TouchableOpacity
                    onPress={handleCreate}
                    disabled={!canSubmit}
                    className={`mt-2 py-3.5 rounded-2xl bg-primary items-center ${canSubmit ? "" : "opacity-50"
                        }`}
                >
                    {isLoading ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                        <Text className="text-white text-base font-bold">Створити</Text>
                    )}
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}