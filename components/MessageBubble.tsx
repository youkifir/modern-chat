import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { useState } from "react";
import { TouchableOpacity, View } from "react-native";
import { ReactionBadges } from "./ReactionBadges";
import { ReactionPickerModal } from "./ReactionPickerModal";

// Всередині компонента MessageBubble:
export const MessageBubble = ({ message, isMyMessage, ...props }: { message: Doc<"messages">; isMyMessage: boolean;[key: string]: unknown }) => {
    const [showReactionPicker, setShowReactionPicker] = useState(false);
    const toggleReaction = useMutation(api.reactions.toggleReaction);

    const handleSelectEmoji = async (emoji: string) => {
        try {
            await toggleReaction({ messageId: message._id, emoji });
        } catch (error) {
            console.error("Помилка реакції:", error);
        }
    };

    return (
        <View className="mb-2">
            {/* Обгортка бульбашки з викликом по довгому натисканню */}
            <TouchableOpacity
                onLongPress={() => setShowReactionPicker(true)}
                activeOpacity={0.9}
            >
                {/* ... вміст бульбашки повідомлення */}
            </TouchableOpacity>

            {/* Бейджі реакцій під бульбашкою */}
            <ReactionBadges messageId={message._id} />

            {/* Модальне вікно вибору емодзі */}
            <ReactionPickerModal
                visible={showReactionPicker}
                onClose={() => setShowReactionPicker(false)}
                onSelectEmoji={handleSelectEmoji}
            />
        </View>
    );
};