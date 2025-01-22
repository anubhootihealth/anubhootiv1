import React, { useEffect, useState, FC, useRef } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  Animated,
  Easing,
  Text,
  Dimensions,
  Keyboard,
  Platform,
  ActivityIndicator,
  Image,
  TextStyle,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  NativeSyntheticEvent,
  TextInputContentSizeChangeEventData,
} from "react-native";
import { RFPercentage, RFValue } from "react-native-responsive-fontsize";
import dayjs from "dayjs";
import { Ionicons, Entypo, FontAwesome6 } from "@expo/vector-icons";
import { useAuth } from "@clerk/clerk-expo";
import MessageInput from "~/components/MessageInput";
import { SafeAreaView } from "react-native-safe-area-context";
import { sendMessage } from "~/convex/messages";
import { useMutation } from "convex/react";
import { api } from "~/convex/_generated/api";
/**
 * ---------------------------------------------
 * Interfaces & Enums
 * ---------------------------------------------
 */
export enum Role {
  User = "User",
  Bot = "Bot",
}

export interface Message {
  id?: string;
  role: Role;
  content?: string;
  createdAt?: string;
  sender?: {
    _id: string;
  };
  imageUri?: string;
  isTyping?: boolean;
  isMessageRead?: boolean;
}
/**
 * ---------------------------------------------
 * Colors (replace these with your own palette)
 * ---------------------------------------------
 */
const Colors = {
  primary: "#3498db",
  secondary: "#1abc9c",
  light: "#d3d3d3",
  text: "#FFFFFF",
};

/**
 * ---------------------------------------------
 * Dummy Data
 * ---------------------------------------------
 */
const dummyMessages: Message[] = [
  {
    id: "1",
    role: Role.Bot,
    content: "Hi there! How can I assist you today?",
    createdAt: dayjs().subtract(10, "minute").toISOString(),
    sender: { _id: "bot_1" },
  },
  {
    id: "2",
    role: Role.User,
    content: "Can you show me the latest product updates?",
    createdAt: dayjs().subtract(9, "minute").toISOString(),
    sender: { _id: "user_1" },
  },
  {
    id: "3",
    role: Role.Bot,
    content: "Sure! Here's an image of our new product lineup:",
    createdAt: dayjs().subtract(8, "minute").toISOString(),
    sender: { _id: "bot_1" },
  },
  {
    id: "4",
    role: Role.Bot,
    imageUri: "https://picsum.photos/200/300", // Replace with your own image URL
    createdAt: dayjs().subtract(8, "minute").toISOString(),
    sender: { _id: "bot_1" },
  },
  {
    id: "6",
    role: Role.Bot,
    isTyping: true, // Indicates typing animation
    sender: { _id: "bot_1" },
  },
  {
    id: "5",
    role: Role.User,
    content: "Wow, that looks amazing! When is it available?",
    createdAt: dayjs().subtract(7, "minute").toISOString(),
    sender: { _id: "user_1" },
  },
  {
    id: "1",
    role: Role.Bot,
    content: "Hi there! How can I assist you today?",
    createdAt: dayjs().subtract(15, "minute").toISOString(),
    sender: { _id: "bot_1" },
  },
  {
    id: "2",
    role: Role.User,
    content: "Can you show me the latest product updates?",
    createdAt: dayjs().subtract(14, "minute").toISOString(),
    sender: { _id: "user_1" },
  },
  {
    id: "3",
    role: Role.Bot,
    content: "Sure! Here's an image of our new product lineup:",
    createdAt: dayjs().subtract(13, "minute").toISOString(),
    sender: { _id: "bot_1" },
  },
  {
    id: "5",
    role: Role.User,
    content: "Wow, that looks amazing! When is it available?",
    createdAt: dayjs().subtract(12, "minute").toISOString(),
    sender: { _id: "user_1" },
  },
  {
    id: "6",
    role: Role.Bot,
    content: "The new products will be available starting next week.",
    createdAt: dayjs().subtract(11, "minute").toISOString(),
    sender: { _id: "bot_1" },
  },
  {
    id: "7",
    role: Role.User,
    content: "That's great to hear! Can you recommend one for daily use?",
    createdAt: dayjs().subtract(10, "minute").toISOString(),
    sender: { _id: "user_1" },
  },
  {
    id: "8",
    role: Role.Bot,
    content: "Absolutely! The SmartWear Pro is ideal for daily use. It tracks fitness and supports notifications.",
    createdAt: dayjs().subtract(9, "minute").toISOString(),
    sender: { _id: "bot_1" },
  },
  {
    id: "9",
    role: Role.User,
    content: "Does it come in different colors?",
    createdAt: dayjs().subtract(8, "minute").toISOString(),
    sender: { _id: "user_1" },
  },
  {
    id: "10",
    role: Role.Bot,
    content: "Yes, it comes in black, silver, and rose gold.",
    createdAt: dayjs().subtract(7, "minute").toISOString(),
    sender: { _id: "bot_1" },
  },
  {
    id: "11",
    role: Role.User,
    content: "Can you share the price details?",
    createdAt: dayjs().subtract(6, "minute").toISOString(),
    sender: { _id: "user_1" },
  },
  {
    id: "12",
    role: Role.Bot,
    content: "The price starts at $199 for the base model.",
    createdAt: dayjs().subtract(5, "minute").toISOString(),
    sender: { _id: "bot_1" },
  },
  {
    id: "13",
    role: Role.User,
    content: "What about the Pro version?",
    createdAt: dayjs().subtract(4, "minute").toISOString(),
    sender: { _id: "user_1" },
  },
  {
    id: "14",
    role: Role.Bot,
    content: "The Pro version is $299 and includes additional features like ECG monitoring.",
    createdAt: dayjs().subtract(3, "minute").toISOString(),
    sender: { _id: "bot_1" },
  },
  {
    id: "15",
    role: Role.User,
    content: "Thank you! I'll check it out next week.",
    createdAt: dayjs().subtract(2, "minute").toISOString(),
    sender: { _id: "user_1" },
  },
];


/**
 * ---------------------------------------------
 * Reusable Hook: useKeyboardOffsetHeight
 *   - Tracks the keyboard height to offset UI
 * ---------------------------------------------
 */
const useKeyboardOffsetHeight = () => {
  const [keyboardOffsetHeight, setKeyboardOffsetHeight] = useState(0);

  useEffect(() => {
    const showListener = Keyboard.addListener("keyboardDidShow", (e) =>
      setKeyboardOffsetHeight(e.endCoordinates.height)
    );
    const hideListener = Keyboard.addListener("keyboardDidHide", () =>
      setKeyboardOffsetHeight(0)
    );

    return () => {
      showListener.remove();
      hideListener.remove();
    };
  }, []);

  return keyboardOffsetHeight;
};

/**
 * ---------------------------------------------
 * Typing Animation: LoadingDots
 *   - Displays an animated "..." to indicate
 *     that the bot is typing
 * ---------------------------------------------
 */
const LoadingDots: FC = () => {
  const [animatedValues] = useState([
    new Animated.Value(1),
    new Animated.Value(1),
    new Animated.Value(1),
  ]);

  useEffect(() => {
    const startAnimation = () => {
      // Animate three dots in a staggered sequence
      Animated.loop(
        Animated.stagger(
          100,
          animatedValues.map((val) =>
            Animated.sequence([
              Animated.timing(val, {
                toValue: 0.5,
                duration: 500,
                easing: Easing.linear,
                useNativeDriver: true,
              }),
              Animated.timing(val, {
                toValue: 1,
                duration: 500,
                easing: Easing.linear,
                useNativeDriver: true,
              }),
            ])
          )
        )
      ).start();
    };

    startAnimation();

    // Cleanup: reset scale values to 1 if unmounted
    return () => {
      animatedValues.forEach((val) => val.setValue(1));
    };
  }, [animatedValues]);

  return (
    <View style={styles.loadingContainer}>
      {animatedValues.map((animatedValue, index) => (
        <Animated.View
          key={index}
          style={[
            styles.dot,
            {
              transform: [{ scale: animatedValue }],
            },
          ]}
        />
      ))}
    </View>
  );
};

/**
 * ---------------------------------------------
 * MessageBubble
 *   - Renders individual messages (text, images, or typing dots)
 * ---------------------------------------------
 */
interface MessageBubbleProps {
  message: Message;
}
const MessageBubble: FC<MessageBubbleProps> = ({ message }) => {
  const { userId } = useAuth();
  const isMyMessage = message?.sender?._id === userId;
  const isMessageRead = message?.isMessageRead;

  return (
    <View
      style={[
        styles.messageContainer,
        {
          maxWidth: isMyMessage ? "80%" : "92%",
          alignSelf: isMyMessage ? "flex-end" : "flex-start",
          backgroundColor: isMyMessage ? "#683EF3" : "#232E3B",
          borderBottomRightRadius: isMyMessage ? 0 : 20,
          borderBottomLeftRadius: isMyMessage ? 20 : 0,
        },
      ]}
    >
      {/* Show different content depending on the message type */}
      {message.isTyping ? (
        <LoadingDots />
      ) : message.imageUri ? (
        <Image source={{ uri: message.imageUri }} style={styles.image} />
      ) : (
        <Text
          style={[
            styles.messageText,
            { textAlign: isMyMessage ? "right" : "left" },
          ]}
        >
          {message.content}
        </Text>
      )}

      {/* Time & Read Receipt */}
      <View style={styles.timeAndReadContainer}>
        <Text style={styles.timeText}>
          {message.createdAt
            ? dayjs(message.createdAt).format("HH:mm A")
            : dayjs().format("HH:mm A")}
        </Text>

        {isMyMessage && (
          <Image
            source={require("~/assets/images/icon.png")} // or your read-receipt icon
            style={[
              styles.readIndicator,
              { tintColor: isMessageRead ? "#53a6fd" : "#8aa69b" },
            ]}
          />
        )}
      </View>
    </View>
  );
};

/**
 * ---------------------------------------------
 * SendButton (Message Input + Send Icon)
 *   - Provides an input field and handles message sending
 * ---------------------------------------------
 */
interface SendButtonProps {
  item: { conversation_id: string }; // could be your conversation object
  isTyping: boolean;
  setIsTyping: (typing: boolean) => void;
  setHeightOfMessageBox: (height: number) => void;
  onSendMessage: (message: string) => void; // callback to actually send
}
const SendButton: FC<SendButtonProps> = ({
  item,
  isTyping,
  setIsTyping,
  setHeightOfMessageBox,
  onSendMessage,
}) => {
  const animationValue = useRef(new Animated.Value(0)).current;
  const [message, setMessage] = useState("");
  const keyboardOffsetHeight = useKeyboardOffsetHeight();

  /**
   * Handle content size changes for dynamic text input height
   */
  const handleContentSizeChange = (
    event: NativeSyntheticEvent<TextInputContentSizeChangeEventData>
  ) => {
    setHeightOfMessageBox(event.nativeEvent.contentSize.height);
  };

  /**
   * Animate the send button in/out based on `isTyping`
   */
  useEffect(() => {
    Animated.timing(animationValue, {
      toValue: isTyping ? 1 : 0,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [isTyping]);

  /**
   * Interpolated animation style for the send button
   */
  const sendButtonStyle = {
    opacity: animationValue,
    transform: [
      {
        scale: animationValue.interpolate({
          inputRange: [0, 1],
          outputRange: [0.5, 1],
        }),
      },
    ],
  };

  /**
   * Called on text change
   */
  const handleTextChange = (text: string) => {
    setIsTyping(!!text); // isTyping is true if there's text
    setMessage(text);
  };

  /**
   * Called when pressing "Send"
   */
  const handleSend = async () => {
    if (!message.trim()) return;
    try {
      // Optional: Make an API call
      // For demonstration, we’ll just call the passed callback
      onSendMessage(message.trim());

      // Clear local states
      setMessage("");
      setIsTyping(false);

      console.log("Message sent successfully!");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  return (
    <View
      style={[
        sendButtonStyles.container,
        {
          bottom:
            Platform.OS === "android" ? 0 : Math.max(keyboardOffsetHeight, 0),
        },
      ]}
    >
      <View style={sendButtonStyles.subContainer}>
        {/* Emoji Icon (or any other icon you like) */}
        <View style={sendButtonStyles.emojiButton}>
          <FontAwesome6 name="smile" size={RFValue(20)} color={Colors.light} />
        </View>

        {/* The actual TextInput */}
        <View
          style={[
            sendButtonStyles.inputContainer,
            { width: isTyping ? "80%" : "72%" },
          ]}
        >
          <TextInput
            editable
            multiline
            value={message}
            placeholderTextColor="#eee"
            style={sendButtonStyles.textInput}
            placeholder="Type your message..."
            onChangeText={handleTextChange}
            onFocus={() => {
              console.log(
                `Typing started for conversation ${item.conversation_id}`
              );
            }}
            onBlur={() => {
              console.log(
                `Typing stopped for conversation ${item.conversation_id}`
              );
            }}
            onContentSizeChange={handleContentSizeChange}
          />
        </View>

        {/* Conditional: Show send icon if typing, otherwise show attachments/mic */}
        {isTyping ? (
          <Animated.View
            style={[sendButtonStyles.sendButtonWrapper, sendButtonStyle]}
          >
            <TouchableOpacity
              onPress={handleSend}
              style={sendButtonStyles.sendButton}
            >
              <Ionicons name="send" size={RFValue(20)} color={Colors.text} />
            </TouchableOpacity>
          </Animated.View>
        ) : (
          <View style={sendButtonStyles.flexRowGap}>
            <Entypo name="attachment" size={RFValue(20)} color={Colors.light} />
            <Ionicons
              name="mic-outline"
              size={RFValue(24)}
              color={Colors.light}
            />
          </View>
        )}
      </View>
    </View>
  );
};

/**
 * Styles for the SendButton
 */
const sendButtonStyles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0, // Sticks to the bottom
    left: 0,
    width: "100%",
    backgroundColor: "#000",
    padding: 10,
  },
  subContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  emojiButton: {
    marginRight: 10,
  },
  inputContainer: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#FFF",
    borderRadius: 10,
    paddingHorizontal: 10,
    backgroundColor: "#000",
  },
  textInput: {
    color: Colors.light,
    fontSize: RFValue(14),
    height: 50,
  },
  sendButtonWrapper: {
    marginLeft: 10,
  },
  sendButton: {
    backgroundColor: Colors.primary,
    padding: 10,
    borderRadius: 50,
  },
  flexRowGap: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 10,
  },
});

/**
 * ---------------------------------------------
 * Chat Component
 *   - Renders the list of messages + input area
 * ---------------------------------------------
 */
interface ChatProps {
  messages: Message[];
  loading: boolean;
  onLoadMore: () => void;
}

const Chat: FC<ChatProps> = ({ messages, loading, onLoadMore }) => {
  const [isTyping, setIsTyping] = useState(false);
  const [heightOfMessageBox, setHeightOfMessageBox] = useState(50);
  const keyboardOffsetHeight = useKeyboardOffsetHeight();
  const [chatMessages, setMessages] = useState<Message[]>(messages);
  const [imessages , setimessages]  = useState('');
  const sendMessages = useMutation(api.messages.sendMessage);

  // Handler function that gets called when user sends the message
  // const handleSendMessage = (msg: string) => {
  //   const newMessage: Message = {
  //     id: Date.now().toString(), // Unique ID for the message
  //     role: Role.User,          // Role is 'User' for messages sent by the user
  //     content: msg,             // The message content
  //     createdAt: dayjs().toISOString(), // Timestamp of the message
  //     sender: { _id: "user_1" },        // User ID
  //   };

  //   // Append the new message to the messages array
  //   setMessages((prevMessages) => [newMessage, ...prevMessages]);

  //   // Simulate a bot response after a delay
  //   setTimeout(() => {
  //     const botMessage: Message = {
  //       id: Date.now().toString(),
  //       role: Role.Bot,
  //       content: `Bot response to: "${msg}"`,
  //       createdAt: dayjs().toISOString(),
  //       sender: { _id: "bot_1" },
  //     };
  //     setMessages((prevMessages) => [botMessage, ...prevMessages]);
  //   }, 1000);
  // };

  const handleSendMessage = async () => {
    if (imessages.trim() === "") return; // Prevent sending empty messages

    try {
      // Call the Convex mutation to send the message
      await sendMessages({
        chatId: "123", // Pass the chat ID
        senderId: "user-id", // Pass the sender's ID (get this from the user's session or state)
        content: imessages,
        type: "text", // Default type for text messages, adjust if media is involved
      });

      // Reset message input
      setimessages("");

      // Optionally, you can reset typing status
      setIsTyping(false);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const renderMessageBubble = ({ item }: { item: Message }) => (
    <MessageBubble message={item} />
  );

  return (
    <View
      style={[
        styles.chatContainer,
        {
          height: Dimensions.get("window").height * 0.9 - keyboardOffsetHeight,
        },
      ]}
    >
      {loading && (
        <View style={styles.loadingSpinner}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      )}

      {messages.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            Let’s start the legendary conversation!
          </Text>
          {/**
           * If no messages yet, you can still show an input (SendButton).
           * Provide any conversation data you have in `item`.
           */}
          <SendButton
            item={{ conversation_id: "dummy_convo_id" }}
            isTyping={isTyping}
            setIsTyping={setIsTyping}
            setHeightOfMessageBox={setHeightOfMessageBox}
            onSendMessage={handleSendMessage}
          />
        </View>
      ) : (
        <>
          <FlatList
            data={messages}
            inverted
            keyExtractor={(item) => item.id || Math.random().toString()}
            renderItem={renderMessageBubble}
            onEndReached={onLoadMore}
            onEndReachedThreshold={0.5}
            contentContainerStyle={{ paddingBottom: 80 }} // give space for input
          />

          {/**
           * We wrap our SendButton in a KeyboardAvoidingView, so it pushes above
           * the keyboard in iOS. For Android, we can handle differently.
           */}
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={0}
            style={styles.inputOverlay}
          >
            {/* <SendButton
              item={{ conversation_id: "dummy_convo_id" }}
              isTyping={isTyping}
              setIsTyping={setIsTyping}
              setHeightOfMessageBox={setHeightOfMessageBox}
              onSendMessage={handleSendMessage}
            /> */}
            <MessageInput onShouldSend={handleSendMessage} />
          </KeyboardAvoidingView>
        </>
      )}
    </View>
  );
};
/**
 * ---------------------------------------------
 * Main App Component
 *   - Just returns the Chat with sample data
 * ---------------------------------------------
 */
export default function App() {
  const [messages, setMessages] = useState<Message[]>(dummyMessages);

  // For demonstration, do nothing when loading more
  const onLoadMore = () => {
    console.log("Load more messages here...");
  };

  return <Chat messages={messages} loading={false} onLoadMore={onLoadMore} />;
}

/**
 * ---------------------------------------------
 * Styles (Chat, Bubbles, etc.)
 * ---------------------------------------------
 */
const styles = StyleSheet.create({
  chatContainer: {
    width: "100%",
    // height: "100%",
  },
  loadingSpinner: {
    position: "absolute",
    top: "50%",
    left: "50%",
    zIndex: 999,
    transform: [{ translateX: -20 }, { translateY: -20 }],
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: RFValue(18),
    color: "#AAA",
  },
  messageContainer: {
    margin: 8,
    padding: 10,
    borderRadius: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  messageText: {
    fontSize: RFValue(13),
    color: "#FFF",
  },
  image: {
    height: RFPercentage(20),
    width: RFPercentage(35),
    borderRadius: 10,
    resizeMode: "cover",
  },
  timeAndReadContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
  },
  timeText: {
    fontSize: RFValue(10),
    color: "#AAA",
  },
  readIndicator: {
    width: 15,
    height: 15,
    marginLeft: 5,
  },
  loadingContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  dot: {
    width: RFValue(6),
    height: RFValue(6),
    backgroundColor: "#FFF",
    borderRadius: 50,
    marginHorizontal: 2,
  },
  inputOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: "100%",
  },
});
