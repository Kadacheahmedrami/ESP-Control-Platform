#include <ArduinoJson.h>
#include "websocket.h"
#include <stdint.h> // For uint8_t type

// Make sure ESPExpress is defined somewhere, likely in websocket.h
// If not, you'll need to include the appropriate header file for your ESP framework

void sendSensorUpdate(ESPExpress &app, uint8_t clientNum, const char* deviceId, const char* sensorType, float value) {
  // Create a JSON document
  DynamicJsonDocument doc(256);
  doc["deviceId"] = deviceId;
  doc["sensor"] = sensorType;
  doc["value"] = String(value, 2);
  
  // Serialize to string
  String sensorJson;
  serializeJson(doc, sensorJson);
  
  Serial.println("Sending update to client " + String(clientNum) + ": " + sensorJson);
  // Send only to the requesting client instead of broadcasting
  app.wsSendTXT(clientNum, sensorJson);
}

void registerWebSocketRoutes(ESPExpress &app) {
  app.ws("/ws", [&app](uint8_t num, WStype_t type, uint8_t* payload, size_t length) {
    switch (type) {
      case WStype_CONNECTED: {
        Serial.printf("WS client %u connected\n", num);
        
        // Send welcome message with supported sensors
        DynamicJsonDocument welcomeDoc(512);
        welcomeDoc["type"] = "info";
        welcomeDoc["message"] = "Connected to ESP32 sensor hub";
        welcomeDoc["supportedSensors"] = JsonArray();
        
        // Add supported sensors to the array
        JsonArray sensors = welcomeDoc["supportedSensors"];
        sensors.add("temperature");
        sensors.add("humidity");
        sensors.add("pressure");
        sensors.add("light");
        
        String welcomeJson;
        serializeJson(welcomeDoc, welcomeJson);
        app.wsSendTXT(num, welcomeJson);
        break;
      }
      case WStype_DISCONNECTED:
        Serial.printf("WS client %u disconnected\n", num);
        break;
      case WStype_TEXT: {
        Serial.printf("WS message from %u: %s\n", num, payload);
        
        // Parse incoming JSON payload.
        DynamicJsonDocument doc(256);
        DeserializationError error = deserializeJson(doc, payload, length);
        if (error) {
          Serial.println("Failed to parse JSON");
          
          // Send error message back to client
          DynamicJsonDocument errorDoc(128);
          errorDoc["error"] = "Failed to parse JSON request";
          String errorJson;
          serializeJson(errorDoc, errorJson);
          app.wsSendTXT(num, errorJson);
          break;
        }
        
        // Retrieve the device ID and sensor type from the JSON.
        const char* deviceId = doc["deviceId"];
        const char* sensorType = doc["sensor"];
        if (!deviceId || !sensorType) {
          Serial.println("Missing required fields: deviceId or sensor");
          
          // Send error message back to client
          DynamicJsonDocument errorDoc(128);
          errorDoc["error"] = "Missing required fields: deviceId or sensor";
          String errorJson;
          serializeJson(errorDoc, errorJson);
          app.wsSendTXT(num, errorJson);
          break;
        }
        
        // Simulate sensor reading based on the requested sensor type.
        if (strcmp(sensorType, "temperature") == 0) {
          float temperature = random(2000, 3500) / 100.0;  // Simulated temperature reading
          sendSensorUpdate(app, num, deviceId, sensorType, temperature);
        } else if (strcmp(sensorType, "humidity") == 0) {
          float humidity = random(3000, 6000) / 100.0;  // Simulated humidity reading
          sendSensorUpdate(app, num, deviceId, sensorType, humidity);
        } else if (strcmp(sensorType, "pressure") == 0) {
          float pressure = random(90000, 110000) / 100.0; // Simulated pressure reading in hPa
          sendSensorUpdate(app, num, deviceId, sensorType, pressure);
        } else if (strcmp(sensorType, "light") == 0) {
          float light = random(0, 1000); // Simulated light reading in lux
          sendSensorUpdate(app, num, deviceId, sensorType, light);
        } else {
          // If sensor type is not recognized, send an error message.
          DynamicJsonDocument errorDoc(128);
          errorDoc["error"] = "Unknown sensor type: " + String(sensorType);
          errorDoc["supportedTypes"] = JsonArray();
          
          // Add supported types
          JsonArray types = errorDoc["supportedTypes"];
          types.add("temperature");
          types.add("humidity");
          types.add("pressure");
          types.add("light");
          
          String errorJson;
          serializeJson(errorDoc, errorJson);
          app.wsSendTXT(num, errorJson);
        }
        break;
      }
      default:
        break;
    }
  });
}