import Colors from "~/constants/Colors";
import {
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  View,
} from "react-native";


const PredefinedMessages = [
  { title: "Health analysis Report", text: "for my diabetes" },
  { title: "Suggest fun exercises", text: "for a overweight person" },
  { title: "Recommend a dish", text: "to satisfy my protein requirements" },
];

type Props = {
  onSelectCard: (message: string) => void;
};

const MessageIdeas = ({ onSelectCard }: Props) => {
  return (
    <View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingVertical: 10,
          gap: 16,
        }}
      >
          {PredefinedMessages.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.card}
              onPress={() => onSelectCard(`${item.title} ${item.text}`)}
            >
              <Text style={{ fontSize: 16, fontWeight: "500" }}>
                {item.title}
              </Text>
              <Text style={{ color: Colors.grey, fontSize: 14 }}>
                {item.text}
              </Text>
            </TouchableOpacity>
          ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#d9d9d9",
    padding: 15,
    borderRadius: 10,
  },
});
export default MessageIdeas;
