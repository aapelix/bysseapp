import { View, Text, TouchableOpacity } from "react-native";

export default function PopUp(visible, onClose, header, desc) {
  return (
    <View className="w-screen h-1/2 bg-black rounded-t-2xl bottom-0">
      <View>
        <TouchableOpacity>
          <Text>Close</Text>
        </TouchableOpacity>
        <Text>{header}</Text>
      </View>
    </View>
  );
}
