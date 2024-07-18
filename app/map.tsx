import { Text, View } from "react-native";
import { Link } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { useState } from "react";
import busRouteData from "./routeids.json";
import { imageMapping } from "./imageMapping";

interface position {
  bearing: number;
  speed: number;
  sign_label: string;
  lat: number;
  lon: number;
  license_plate: string;
  route_id: string;
  start_time: string;
  start_date: string;
  current_status: number;
  vehicle_id: string;
  trip_id: string;
  stop_id: string;
}

export default function Map() {
  const [positions, setPositions] = useState([]);

  setInterval(() => {
    getPos();
  }, 3000);

  async function getPos() {
    const res = await fetch("https://bysse.aapelix.dev/positions");
    const pos = await res.json();
    setPositions(pos);
  }

  function getNumberById(id: string) {
    const item = busRouteData.find((obj) => obj.id == id);
    return item ? item.number : null;
  }

  return (
    <View className="flex h-full items-center justify-center">
      <MapView
        provider={PROVIDER_GOOGLE}
        className="w-full h-full"
        initialRegion={{
          latitude: 61.4978,
          longitude: 23.761,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        }}
      >
        {positions.map((marker: position, index) => {
          const number = getNumberById(marker.route_id);

          const imageSource = imageMapping[number];

          return (
            <Marker
              key={index}
              coordinate={{ latitude: marker.lat, longitude: marker.lon }}
              image={imageSource}
            />
          );
        })}
      </MapView>
    </View>
  );
}
