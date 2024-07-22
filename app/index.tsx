import {
  Text,
  View,
  ActivityIndicator,
  Button,
  TouchableOpacity,
  ScrollView,
  Image,
} from "react-native";
import { Link } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
// import MapView from "react-native-map-clustering";
import React, { useEffect, useState, useCallback, useRef } from "react";
import { imageMapping } from "./imageMapping";
import stopData from "./stops.json";
import BottomSheet, {
  BottomSheetScrollView,
  BottomSheetView,
} from "@gorhom/bottom-sheet";

import * as Location from "expo-location";

interface MonitoredVehicleJourney {
  lineRef: string;
  directionRef: string;
  framedVehicleJourneyRef: {
    dateFrameRef: string;
    datedVehicleJourneyRef: string;
  };
  vehicleLocation: {
    longitude: string;
    latitude: string;
  };
  operatorRef: string;
  bearing: string;
  delay: string;
  vehicleRef: string;
  journeyPatternRef: string;
  originShortName: string;
  destinationShortName: string;
  speed: string;
  originAimedDepartureTime: string;
  onwardCalls: OnwardCall[];
}

interface OnwardCall {
  expectedArrivalTime: string;
  expectedDepartureTime: string;
  stopPointRef: string;
  order: string;
}
interface Municipality {
  name: string;
  shortName: string;
  url: string;
}

interface Marker {
  location: string;
  municipality: Municipality;
  name: string;
  shortName: string;
  tariffZone: string;
  url: string;
}

function isInTampere(lat: number, lon: number) {
  const north = 61.732;
  const south = 61.422;
  const west = 23.535;
  const east = 24.182;

  if (lat >= south && lat <= north && lon >= west && lon <= east) {
    return true;
  } else {
    return false;
  }
}

const darkModeStyle = [
  {
    elementType: "geometry",
    stylers: [
      {
        color: "#212121",
      },
    ],
  },
  {
    elementType: "labels.icon",
    stylers: [
      {
        visibility: "off",
      },
    ],
  },
  {
    elementType: "labels.text.fill",
    stylers: [
      {
        color: "#757575",
      },
    ],
  },
  {
    elementType: "labels.text.stroke",
    stylers: [
      {
        color: "#212121",
      },
    ],
  },
  {
    featureType: "administrative",
    elementType: "geometry",
    stylers: [
      {
        color: "#757575",
      },
    ],
  },
  {
    featureType: "administrative.country",
    elementType: "labels.text.fill",
    stylers: [
      {
        color: "#9e9e9e",
      },
    ],
  },
  {
    featureType: "administrative.land_parcel",
    stylers: [
      {
        visibility: "off",
      },
    ],
  },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [
      {
        color: "#bdbdbd",
      },
    ],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [
      {
        color: "#757575",
      },
    ],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [
      {
        color: "#181818",
      },
    ],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [
      {
        color: "#616161",
      },
    ],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.stroke",
    stylers: [
      {
        color: "#1b1b1b",
      },
    ],
  },
  {
    featureType: "road",
    elementType: "geometry.fill",
    stylers: [
      {
        color: "#2c2c2c",
      },
    ],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [
      {
        color: "#8a8a8a",
      },
    ],
  },
  {
    featureType: "road.arterial",
    elementType: "geometry",
    stylers: [
      {
        color: "#373737",
      },
    ],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [
      {
        color: "#3c3c3c",
      },
    ],
  },
  {
    featureType: "road.highway.controlled_access",
    elementType: "geometry",
    stylers: [
      {
        color: "#4e4e4e",
      },
    ],
  },
  {
    featureType: "road.local",
    elementType: "labels.text.fill",
    stylers: [
      {
        color: "#616161",
      },
    ],
  },
  {
    featureType: "transit",
    elementType: "labels.text.fill",
    stylers: [
      {
        color: "#757575",
      },
    ],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [
      {
        color: "#000000",
      },
    ],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [
      {
        color: "#3d3d3d",
      },
    ],
  },
];

function timeDifference(dateString: string) {
  const now = new Date();
  const targetDate = new Date(dateString);

  // Ensure both are valid Date objects
  if (isNaN(targetDate.getTime())) {
    return "Invalid date";
  }

  const diffMs = targetDate.getTime() - now.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes <= 0) {
    return "";
  } else if (diffMinutes <= 2) {
    return "2min";
  } else if (diffMinutes <= 5) {
    return "5min";
  } else if (diffMinutes <= 10) {
    return "10min";
  } else if (diffMinutes <= 20) {
    return "20min";
  } else {
    const localHours = targetDate.getHours();
    const localMinutes = targetDate.getMinutes();
    return `${localHours}:${localMinutes < 10 ? "0" : ""}${localMinutes}`;
  }
}

function extractNumberFromUrl(url: string) {
  const parts = url.split("/");
  return parts[parts.length - 1];
}

function findDataByShortName(url: string) {
  const dataArray = stopData;
  const extractedNumber = extractNumberFromUrl(url);

  for (let i = 0; i < dataArray.length; i++) {
    if (dataArray[i].shortName === extractedNumber) {
      return dataArray[i];
    }
  }
  return null;
}

export default function Index() {
  const [positions, setPositions] = useState([]);
  const [userLocation, setUserLocation] = useState<Location.LocationObject>();
  const [regionCoords, setRegionCoords] = useState({
    latitude: 61.4978,
    longitude: 23.761,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  });
  const [errorMsg, setErrorMsg] = useState<String>();
  const [popUpJourney, setpopUpJourney] = useState<MonitoredVehicleJourney>();
  const [popVis, setPopVis] = useState(false);
  const [stops, setStops] = useState([]);
  const [showStops, setShowStops] = useState(false);

  const bottomSheetRef = useRef<BottomSheet>(null);

  // callbacks
  const handleSheetChanges = useCallback((index: number) => {
    console.log("handleSheetChanges", index);
  }, []);

  const handleOpenBottomSheet = () => {
    setPopVis(true);
    bottomSheetRef.current?.snapToIndex(1); // or 0 depending on your initial state
  };

  const handleCloseBottomSheet = () => {
    bottomSheetRef.current?.close();
    setPopVis(false);
  };

  setInterval(() => {
    getPos();
  }, 5000);

  async function getPos() {
    const res = await fetch(
      "https://data.itsfactory.fi/journeys/api/1/vehicle-activity",
    );
    const pos = await res.json();
    setPositions(pos.body);
  }
  useEffect(() => {
    getPos();
  }, []);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg("Permission to access location was denied");
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setUserLocation(location);

      setRegionCoords((prevCoords) => ({
        ...prevCoords,
        longitude: isInTampere(
          location.coords.latitude,
          location.coords.longitude,
        )
          ? location.coords.longitude
          : 23.761,
        latitude: isInTampere(
          location.coords.latitude,
          location.coords.longitude,
        )
          ? location.coords.latitude
          : 61.4978,
      }));

      console.log(location);
    })();
  }, []);

  function onRegionChangeComplete(region) {
    setRegionCoords(region);
    setShowStops(region.latitudeDelta <= 0.02);
    console.log(showStops);
  }

  const renderItem = useCallback(
    ({ item }) => (
      <View>
        <Text>{item.name}</Text>
      </View>
    ),
    [],
  );

  return (
    <View className="flex h-full items-center bg-black">
      {userLocation && (
        <MapView
          provider={PROVIDER_GOOGLE}
          className="w-full h-full"
          // clusterColor="#D9D9D9"
          // clusterTextColor="#000000"
          customMapStyle={darkModeStyle}
          initialRegion={{
            latitude: regionCoords.latitude,
            longitude: regionCoords.longitude,
            latitudeDelta: regionCoords.latitudeDelta,
            longitudeDelta: regionCoords.longitudeDelta,
          }}
          onRegionChangeComplete={onRegionChangeComplete}
        >
          {positions &&
            positions.map((bus, index) => {
              const journey: MonitoredVehicleJourney =
                bus.monitoredVehicleJourney;
              let routeNumber = null;

              const imageSource = imageMapping[parseInt(journey.lineRef)];

              return (
                <Marker
                  key={index}
                  coordinate={{
                    latitude: parseFloat(journey.vehicleLocation.latitude),
                    longitude: parseFloat(journey.vehicleLocation.longitude),
                  }}
                  image={
                    imageSource
                      ? imageSource
                      : require("../assets/images/bus/null.png")
                  }
                  onPress={() => {
                    setpopUpJourney(journey);
                    handleOpenBottomSheet();
                  }}
                />
              );
            })}

          {showStops &&
            stopData.map((stop, index) => {
              return (
                <Marker
                  key={index}
                  coordinate={{
                    latitude: parseFloat(stop.location.split(",")[0]),
                    longitude: parseFloat(stop.location.split(",")[1]),
                  }}
                  image={require("../assets/images/bus/stop.png")}
                />
              );
            })}

          <Marker
            coordinate={{
              latitude: userLocation.coords.latitude,
              longitude: userLocation.coords.longitude,
            }}
            image={require("../assets/images/user.png")}
          />
        </MapView>
      )}
      {!userLocation && (
        <View className="w-screen h-screen flex justify-center items-center">
          <ActivityIndicator />
        </View>
      )}
      {popVis && (
        <BottomSheet
          ref={bottomSheetRef}
          snapPoints={["30%", "50%"]}
          onClose={handleCloseBottomSheet}
          enablePanDownToClose
        >
          <BottomSheetView className="flex items-center relative">
            <View className="left-5">
              <Text className="text-2xl font-black">
                Linja {popUpJourney?.lineRef}
                <Image source={require("../assets/images/bus/null.png")} />
              </Text>
              <Text className="text-zinc-500">{popUpJourney?.speed}km/h</Text>
            </View>
          </BottomSheetView>
          <BottomSheetScrollView>
            {popUpJourney?.onwardCalls.map((call: OnwardCall) => {
              const nextStopData = findDataByShortName(call.stopPointRef);

              const arrival = timeDifference(call.expectedArrivalTime);

              if (arrival !== "Invalid date") {
                return (
                  <View
                    key={call.order}
                    className="flex flex-row justify-between px-5"
                  >
                    <Text>{nextStopData?.name}</Text>
                    <Text>{arrival}</Text>
                  </View>
                );
              }
            })}
          </BottomSheetScrollView>
        </BottomSheet>
      )}
    </View>
  );
}
