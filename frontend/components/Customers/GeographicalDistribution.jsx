import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import axios from "axios";

const GeographicalDistribution = () => {
  const [geographicalData, setGeographicalData] = useState([]);

  useEffect(() => {
    // Function to fetch geographical data from the server
    const fetchGeographicalData = async () => {
      try {
        const response = await axios.get(
          "http://localhost:3010/api/customers/geographicalDistribution"
        );

        if (response.data.success) {
          setGeographicalData(response.data.geographicalData);
          console.log(
            "________map data________",
            response.data.geographicalData
          );
        } else {
          console.error(
            "Failed to fetch geographical data:",
            response.data.message
          );
        }
      } catch (error) {
        console.error("Error fetching geographical data:", error.message);
      }
    };

    fetchGeographicalData();
  }, []);

  const [locations, setLocations] = useState([]);

  useEffect(() => {
    const fetchCoordinates = async () => {
      const coordinatesPromises = geographicalData.map(async (location) => {
        const coords = await getCoordinates(location._id);
        return { ...location, ...coords };
      });
      const results = await Promise.all(coordinatesPromises);
      setLocations(results);
    };

    fetchCoordinates();
  }, [geographicalData]);

  const getCoordinates = async (city) => {
    const apiKey = import.meta.env.VITE_OPENCAGE_API_KEY;
    //Replace with your geocoding API key
    const response = await fetch(
      `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(
        city
      )}&key=${apiKey}`
    );
    const data = await response.json();

    if (data.results.length > 0) {
      const { lat, lng } = data.results[0].geometry;
      return { lat, lng };
    } else {
      console.error(`No results for city: ${city}`);
      return { lat: 0, lng: 0 }; // Default values for error handling
    }
  };

  return (
    <section id="customers" className="py-8 px-6 bg-gray-100 rounded-lg">
      <div className="container mx-auto px-6">
        <div className="bg-white rounded-lg shadow p-6 mb-10">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            Customer Geographical Distribution
          </h3>
        </div>
        <MapContainer
      center={[37.7749, -122.4194]}
      zoom={5}
      style={{ height: "500px", width: "100%" }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      {locations.map((location) =>
        location.lat && location.lng ? (
          <Marker key={location._id} position={[location.lat, location.lng]}>
            <Popup>
              {location._id}: {location.customerCount} customers
            </Popup>
          </Marker>
        ) : null
      )}
    </MapContainer>
      </div>
    </section>
    
  );
};

export default GeographicalDistribution;
