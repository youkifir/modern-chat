import { ImageViewerModal } from "@/components/ImageViewerModal";
import { COLORS } from "@/constants/theme";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "convex/react";
import { File } from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { fetch } from "expo/fetch";
import { useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Platform,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export default function ChatRoomScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();

    const chatRoomId = id as Id<"chatRooms">;
    const room = useQuery(api.rooms.getRoom, { roomId: chatRoomId });
    const messages = useQuery(api.messages.listMessages, { chatRoomId });
    const currentUser = useQuery(api.users.currentUser);

    const sendMessage = useMutation(api.messages.sendMessage);
    const editMessage = useMutation(api.messages.editMessage);
    const deleteMessage = useMutation(api.messages.deleteMessage);
    const generateUploadUrl = useMutation(api.messages.generateUploadUrl);
    const sendMediaMessage = useMutation(api.messages.sendMediaMessage);

    const [inputText, setInputText] = useState("");
    const [editingMessageId, setEditingMessageId] = useState<Id<"messages"> | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
    const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
    const flatListRef = useRef<FlatList>(null);

    // Вибір фото з галереї
    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            allowsEditing: true,
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]?.uri) {
            setSelectedImageUri(result.assets[0].uri);
        }
    };

    // Відправка текстового повідомлення або фото
    const handleSend = async () => {
        if (isSubmitting) return;

        try {
            setIsSubmitting(true);

            if (selectedImageUri) {
                // Відправка фотографії з опціональним описом
                const uploadUrl = await generateUploadUrl();
                const file = new File(selectedImageUri);

                const uploadResponse = await fetch(uploadUrl, {
                    method: "POST",
                    headers: { "Content-Type": "image/jpeg" },
                    body: file,
                });

                if (!uploadResponse.ok) throw new Error("Upload failed");

                const { storageId } = await uploadResponse.json();
                await sendMediaMessage({
                    chatRoomId,
                    storageId,
                    caption: inputText.trim() || undefined,
                });

                setSelectedImageUri(null);
                setInputText("");
            } else if (editingMessageId) {
                // Редагування існуючого
                await editMessage({
                    messageId: editingMessageId,
                    content: inputText.trim(),
                });
                setEditingMessageId(null);
                setInputText("");
            } else if (inputText.trim()) {
                // Звичайне текстове повідомлення
                await sendMessage({
                    chatRoomId,
                    content: inputText.trim(),
                });
                setInputText("");
            }
        } catch (error) {
            console.error(error);
            Alert.alert("Помилка", "Не вдалося відправити повідомлення");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!room || messages === undefined) {
        return (
            <View className="flex-1 bg-background justify-center items-center">
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            className="flex-1 bg-background"
            keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
        >
            {/* Хедер чату */}
            <View className="flex-row items-center justify-between px-4 py-3 bg-surface border-b border-surfaceLight">
                <View className="flex-row items-center flex-1 mr-3">
                    <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
                        <Ionicons name="arrow-back" size={24} color={COLORS.white} />
                    </TouchableOpacity>
                    <View className="flex-1">
                        <Text className="text-white text-lg font-bold" numberOfLines={1}>
                            {room.title}
                        </Text>
                        {room.description ? (
                            <Text className="text-textMuted text-xs" numberOfLines={1}>
                                {room.description}
                            </Text>
                        ) : null}
                    </View>
                </View>

                <TouchableOpacity
                    onPress={() => router.push(`/settings/${chatRoomId}`)}
                    className="p-1"
                >
                    <Ionicons name="ellipsis-vertical" size={22} color={COLORS.textMuted} />
                </TouchableOpacity>
            </View>

            {/* Список повідомлень */}
            <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={(item) => item._id}
                contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                renderItem={({ item }) => {
                    const isMe = item.senderId === currentUser?._id;

                    return (
                        <View className={`mb-3 max-w-[80%] ${isMe ? "self-end" : "self-start"}`}>
                            <View
                                className={`p-3 rounded-2xl ${isMe
                                        ? "bg-primary rounded-tr-xs"
                                        : "bg-surface border border-surfaceLight rounded-tl-xs"
                                    }`}
                            >
                                {!isMe && (
                                    <Text className="text-primary font-bold text-xs mb-1">
                                        {item.senderName}
                                    </Text>
                                )}

                                {/* Якщо це фотоповідомлення */}
                                {item.imageUrl && (
                                    <TouchableOpacity
                                        activeOpacity={0.9}
                                        onPress={() => setFullscreenImage(item.imageUrl!)}
                                        className="mb-1 rounded-xl overflow-hidden"
                                    >
                                        <Image
                                            source={{ uri: item.imageUrl }}
                                            className="w-56 h-56 rounded-xl bg-surfaceLight"
                                            resizeMode="cover"
                                        />
                                    </TouchableOpacity>
                                )}

                                {/* Текстовий зміст */}
                                {item.content ? (
                                    <Text className="text-white text-base leading-5">{item.content}</Text>
                                ) : null}

                                {/* Час та позначки */}
                                <View className="flex-row items-center justify-end mt-1 gap-1">
                                    {item.isEdited && (
                                        <Text className="text-white/60 text-[10px] italic">(ред.)</Text>
                                    )}
                                    <Text className="text-white/60 text-[10px]">
                                        {new Date(item._creationTime).toLocaleTimeString([], {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    );
                }}
            />

            {/* Прев'ю обраної картинки перед відправкою */}
            {selectedImageUri && (
                <View className="flex-row items-center px-4 py-2 bg-surfaceLight border-t border-surface">
                    <Image
                        source={{ uri: selectedImageUri }}
                        className="w-12 h-12 rounded-lg mr-3"
                    />
                    <Text className="text-white text-xs flex-1">Фото додано до відправки</Text>
                    <TouchableOpacity onPress={() => setSelectedImageUri(null)}>
                        <Ionicons name="close-circle" size={22} color={COLORS.danger} />
                    </TouchableOpacity>
                </View>
            )}

            {/* Панель введення */}
            <View className="flex-row items-center p-3 bg-surface border-t border-surfaceLight">
                <TouchableOpacity
                    onPress={pickImage}
                    disabled={isSubmitting}
                    className="mr-2 p-2 rounded-full bg-surfaceLight"
                >
                    <Ionicons name="image-outline" size={22} color={COLORS.primary} />
                </TouchableOpacity>

                <TextInput
                    className="flex-1 bg-background text-white px-4 py-2.5 rounded-full text-base border border-surfaceLight mr-2"
                    placeholder={
                        selectedImageUri ? "Додайте опис до фото..." : "Напишіть повідомлення..."
                    }
                    placeholderTextColor={COLORS.textMuted}
                    value={inputText}
                    onChangeText={setInputText}
                    multiline
                />

                <TouchableOpacity
                    onPress={handleSend}
                    disabled={(!inputText.trim() && !selectedImageUri) || isSubmitting}
                    className={`w-11 h-11 rounded-full items-center justify-center bg-primary ${(!inputText.trim() && !selectedImageUri) || isSubmitting
                            ? "opacity-50"
                            : "active:opacity-80"
                        }`}
                >
                    {isSubmitting ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                        <Ionicons name="send" size={20} color="#FFFFFF" />
                    )}
                </TouchableOpacity>
            </View>

            {/* Повноекранний переглядач фото */}
            <ImageViewerModal
                visible={!!fullscreenImage}
                imageUrl={fullscreenImage}
                onClose={() => setFullscreenImage(null)}
            />
        </KeyboardAvoidingView>
    );
}