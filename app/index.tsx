import { Text, View, ActivityIndicator, Button } from "react-native";
import { Link } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import busRouteData from "./routeids.json";
import stopsData from "./stops.json";
import { imageMapping } from "./imageMapping";

import * as Location from "expo-location";

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

function sliceCoordinates(coord: string) {
  const [lat, lon] = coord.split(",").map(Number);
  return { latitude: lat, longitude: lon };
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
  const [zoomLevel, setZoomLevel] = useState(0);

  const [popupVis, setPopupVis] = useState(true);

  const [visibleStops, setVisibleStops] = useState<Marker[]>([]);

  const [errorMsg, setErrorMsg] = useState<String>();

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

  function getNumberById(id: string) {
    const item = busRouteData.find((obj) => obj.id == id);
    return item ? item.number : null;
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

  useEffect(() => {
    if (regionCoords) {
      const { latitude, longitude, latitudeDelta, longitudeDelta } =
        regionCoords;

      const withinBounds = (marker: Marker) => {
        const [markerLat, markerLng] = marker.location.split(",").map(Number);
        return (
          markerLat >= latitude - latitudeDelta &&
          markerLat <= latitude + latitudeDelta &&
          markerLng >= longitude - longitudeDelta &&
          markerLng <= longitude + longitudeDelta
        );
      };

      setVisibleStops(stopsData.filter(withinBounds));
    }
  }, [regionCoords]);

  return (
    <View className="flex h-full items-center justify-center">
      {userLocation && (
        <MapView
          provider={PROVIDER_GOOGLE}
          className="w-full h-full"
          customMapStyle={darkModeStyle}
          initialRegion={{
            latitude: regionCoords.latitude,
            longitude: regionCoords.longitude,
            latitudeDelta: regionCoords.latitudeDelta,
            longitudeDelta: regionCoords.longitudeDelta,
          }}
          onRegionChangeComplete={setRegionCoords}
        >
          {positions &&
            positions.map((bus, index) => {
              // const number = getNumberById(marker.route_id);

              // const imageSource = imageMapping[number];

              const journey = bus.monitoredVehicleJourney;
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

          {regionCoords.latitudeDelta <= 0.013 &&
            visibleStops.map((stop, index) => {
              const coords = sliceCoordinates(stop.location);

              return (
                <Marker
                  key={index}
                  coordinate={{
                    latitude: coords.latitude,
                    longitude: coords.longitude,
                  }}
                  image={require("../assets/images/bus/stop.png")}
                />
              );
            })}
        </MapView>
      )}
      {!userLocation && (
        <View>
          <ActivityIndicator />
          <Text>Getting location</Text>
        </View>
      )}
    </View>
  );
}
