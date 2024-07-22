import {
  Text,
  View,
  ActivityIndicator,
  Button,
  TouchableOpacity,
} from "react-native";
import { Link } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
// import MapView from "react-native-map-clustering";
import React, { useEffect, useState } from "react";
import { imageMapping } from "./imageMapping";
import stopData from "./stops.json";

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

  async function getStops() {
    const res = await fetch(
      "https://data.itsfactory.fi/journeys/api/1/stop-points",
    );
    const stopData = await res.json();
    setStops(stopData.body);
  }

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
                    setPopVis(true);
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
      {popVis && popUpJourney && (
        <View className="bg-black rounded-t-2xl bottom-0 absolute z-50 w-screen h-1/2">
          <View className="relative w-full h-full">
            <TouchableOpacity
              className="absolute right-5 top-3 p-2 px-3 bg-white rounded-full z-50"
              onPress={() => setPopVis(false)}
            >
              <Text>Close</Text>
            </TouchableOpacity>
            <View className="mt-4 ml-5">
              <Text className="text-white text-2xl font-bold">
                {popUpJourney.lineRef}
              </Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}
