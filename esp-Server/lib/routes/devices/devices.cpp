#include "devices.h"
#include "ESPControlPlatform.h"  // Provides access to global 'devices' and helper functions
#include "device_controller.h"
#include <ArduinoJson.h>
#include <SPIFFS.h>

// File path in SPIFFS to store devices
const char* DEVICES_FILE = "/devices.json";

// Forward declarations for persistence functions
bool saveDevicesToFlash();
bool loadDevicesFromFlash();

// Call this function during setup to load devices from flash memory.
void initializeDevices() {
  Serial.println("[DEBUG] Initializing devices from flash...");
  if (!loadDevicesFromFlash()) {
    Serial.println("[INFO] No devices file found, starting with an empty list.");
  } else {
    Serial.println("[INFO] Devices loaded from flash.");
  }
}

// Register all device routes for CRUD operations
void registerDeviceRoutes(ESPExpress &app) {
  // GET /api/devices - List all devices
  app.get("/api/devices", [](Request &req, Response &res) {
    String json = "[";
    for (size_t i = 0; i < devices.size(); i++) {
      json += "{";
      json += "\"id\":\"" + devices[i].id + "\",";
      json += "\"type\":\"" + devices[i].type + "\",";
      
      // Output pins array
      json += "\"pins\":[";
      for (size_t j = 0; j < devices[i].pins.size(); j++) {
        json += String(devices[i].pins[j]);
        if (j < devices[i].pins.size() - 1)
          json += ",";
      }
      json += "],";
      
      json += "\"state\":\"" + devices[i].state + "\",";
      
      // Convert interface enum back to string
      String interfaceStr;
      switch (devices[i].interface) {
        case DIGITAL_IF: interfaceStr = "digital"; break;
        case ANALOG_IF:  interfaceStr = "analog"; break;
        case PWM_IF:     interfaceStr = "pwm"; break;
        case I2C_IF:     interfaceStr = "i2c"; break;
        case SPI_IF:     interfaceStr = "spi"; break;
        default:         interfaceStr = "unknown";
      }
      json += "\"interfaceType\":\"" + interfaceStr + "\",";
      
      // Convert direction enum back to string
      String dirStr;
      switch (devices[i].direction) {
        case INPUT_DEVICE:      dirStr = "input"; break;
        case OUTPUT_DEVICE:     dirStr = "output"; break;
        case BIDIRECTIONAL:     dirStr = "bidirectional"; break;
        default:                dirStr = "unknown";
      }
      json += "\"direction\":\"" + dirStr + "\"";
      json += "}";
      if (i < devices.size() - 1)
        json += ",";
    }
    json += "]";
    Serial.println("[DEBUG] GET /api/devices response JSON: " + json);
    res.sendJson(json);
  });

  // GET /api/device/:id - Get a single device by id
  app.get("/api/device/:id", [](Request &req, Response &res) {
    String deviceId = req.getParam("id");
    Serial.println("[DEBUG] GET /api/device/" + deviceId);
    bool found = false;
    String json = "";
    for (size_t i = 0; i < devices.size(); i++) {
      if (devices[i].id == deviceId) {
        json += "{";
        json += "\"id\":\"" + devices[i].id + "\",";
        json += "\"type\":\"" + devices[i].type + "\",";
        json += "\"state\":\"" + devices[i].state + "\",";
        json += "\"pins\":[";
        for (size_t j = 0; j < devices[i].pins.size(); j++) {
          json += String(devices[i].pins[j]);
          if (j < devices[i].pins.size() - 1)
            json += ",";
        }
        json += "],";
        String interfaceStr;
        switch (devices[i].interface) {
          case DIGITAL_IF: interfaceStr = "digital"; break;
          case ANALOG_IF:  interfaceStr = "analog"; break;
          case PWM_IF:     interfaceStr = "pwm"; break;
          case I2C_IF:     interfaceStr = "i2c"; break;
          case SPI_IF:     interfaceStr = "spi"; break;
          default:         interfaceStr = "unknown";
        }
        json += "\"interfaceType\":\"" + interfaceStr + "\",";
        String dirStr;
        switch (devices[i].direction) {
          case INPUT_DEVICE:      dirStr = "input"; break;
          case OUTPUT_DEVICE:     dirStr = "output"; break;
          case BIDIRECTIONAL:     dirStr = "bidirectional"; break;
          default:                dirStr = "unknown";
        }
        json += "\"direction\":\"" + dirStr + "\"";
        json += "}";
        found = true;
        break;
      }
    }
    if (found)
      res.sendJson(json);
    else {
      res.status(404).send("Device not found");
      Serial.println("[DEBUG] GET /api/device/" + deviceId + " - not found");
    }
  });

  // POST /api/device - Add a new device
  app.post("/api/device", [](Request &req, Response &res) {
    String body = req.body;
    Serial.println("[DEBUG] POST /api/device received body: " + body);
    
    int idStart = body.indexOf("\"id\":\"") + 6;
    int idEnd   = body.indexOf("\"", idStart);
    int typeStart = body.indexOf("\"type\":\"") + 8;
    int typeEnd   = body.indexOf("\"", typeStart);
    
    if (idStart < 6 || typeStart < 8) {
      res.status(400).send("Invalid JSON format");
      Serial.println("[DEBUG] POST /api/device - Invalid JSON format");
      return;
    }
    
    Device d;
    d.id    = body.substring(idStart, idEnd);
    d.type  = body.substring(typeStart, typeEnd);
    d.state = "unknown";  // Default state

    // Check for "pins" array first, else fallback to "pin"
    int pinsIndex = body.indexOf("\"pins\":");
    if (pinsIndex != -1) {
      int bracketStart = body.indexOf('[', pinsIndex);
      int bracketEnd   = body.indexOf(']', bracketStart);
      if (bracketStart != -1 && bracketEnd != -1) {
        String pinsSubstr = body.substring(bracketStart + 1, bracketEnd);
        d.pins = parsePins(pinsSubstr);
      }
    } else {
      int pinStart = body.indexOf("\"pin\":") + 6;
      int pinEnd   = body.indexOf("}", pinStart);
      if (pinStart >= 6 && pinEnd != -1) {
        int pin = body.substring(pinStart, pinEnd).toInt();
        d.pins.push_back(pin);
      }
    }
    
    // Optionally parse interfaceType
    int intfIndex = body.indexOf("\"interfaceType\":\"");
    if (intfIndex != -1) {
      int intfStart = intfIndex + strlen("\"interfaceType\":\"");
      int intfEnd   = body.indexOf("\"", intfStart);
      String interfaceStr = body.substring(intfStart, intfEnd);
      d.interface = parseInterfaceType(interfaceStr);
    } else {
      d.interface = DIGITAL_IF; // Default
    }
    
    // Optionally parse direction
    int dirIndex = body.indexOf("\"direction\":\"");
    if (dirIndex != -1) {
      int dirStart = dirIndex + strlen("\"direction\":\"");
      int dirEnd   = body.indexOf("\"", dirStart);
      String directionStr = body.substring(dirStart, dirEnd);
      d.direction = parseDeviceDirection(directionStr);
    } else {
      d.direction = UNKNOWN_DIRECTION;
    }
    
    devices.push_back(d);
    
    // Debug: Print the device details as JSON for verification
    String debugJson = "{";
    debugJson += "\"id\":\"" + d.id + "\",";
    debugJson += "\"type\":\"" + d.type + "\",";
    debugJson += "\"state\":\"" + d.state + "\",";
    debugJson += "\"pins\":[";
    for (size_t i = 0; i < d.pins.size(); i++) {
      debugJson += String(d.pins[i]);
      if (i < d.pins.size() - 1)
        debugJson += ",";
    }
    debugJson += "],";
    String interfaceStr;
    switch (d.interface) {
      case DIGITAL_IF: interfaceStr = "digital"; break;
      case ANALOG_IF:  interfaceStr = "analog"; break;
      case PWM_IF:     interfaceStr = "pwm"; break;
      case I2C_IF:     interfaceStr = "i2c"; break;
      case SPI_IF:     interfaceStr = "spi"; break;
      default:         interfaceStr = "unknown";
    }
    debugJson += "\"interfaceType\":\"" + interfaceStr + "\",";
    String dirStr;
    switch (d.direction) {
      case INPUT_DEVICE:      dirStr = "input"; break;
      case OUTPUT_DEVICE:     dirStr = "output"; break;
      case BIDIRECTIONAL:     dirStr = "bidirectional"; break;
      default:                dirStr = "unknown";
    }
    debugJson += "\"direction\":\"" + dirStr + "\"";
    debugJson += "}";
    Serial.println("[DEBUG] Adding Device: " + debugJson);
    
    // Save updated devices list to flash
    if (saveDevicesToFlash())
      res.send("Device added");
    else
      res.status(500).send("Failed to save device");
  });

  // PUT /api/device/:id - Update device state or other attributes
  app.put("/api/device/:id", [](Request &req, Response &res) {
    String deviceId = req.getParam("id");
    String newState = req.body; // Assume the body is the new state as plain text
    Serial.println("[DEBUG] PUT /api/device/" + deviceId + " with new state: " + newState);
    
    bool found = false;
    bool updateSuccess = false;
    
    for (auto &d : devices) {
      if (d.id == deviceId) {
        found = true;
        updateSuccess = updateDeviceState(d, newState);
        break;
      }
    }

    if (found && updateSuccess) {
      if (saveDevicesToFlash())
        res.send("Device updated");
      else
        res.status(500).send("Device updated but failed to save changes");
      Serial.println("[DEBUG] Device " + deviceId + " updated successfully with state: " + newState);
    }
    else if (!found) {
      res.status(404).send("Device not found");
      Serial.println("[DEBUG] Device " + deviceId + " not found");
    }
    else {
      res.status(400).send("Invalid state update");
      Serial.println("[DEBUG] Failed to update device " + deviceId + " state");
    }
  });

  // PUT /api/device/:id/pins - Update device pins
  app.put("/api/device/:id/pins", [](Request &req, Response &res) {
    String deviceId = req.getParam("id");
    Serial.println("[DEBUG] PUT /api/device/" + deviceId + "/pins, body: " + req.body);

    // Parse the request body expecting JSON like: {"pins": [1,2,3]}
    DynamicJsonDocument doc(256);
    DeserializationError error = deserializeJson(doc, req.body);
    if (error) {
      res.status(400).send("Invalid JSON");
      Serial.println("[DEBUG] PUT /api/device/" + deviceId + "/pins - JSON parse error: " + String(error.c_str()));
      return;
    }
    JsonArray pins = doc["pins"].as<JsonArray>();
    if (pins.isNull()) {
      res.status(400).send("Missing pins array");
      Serial.println("[DEBUG] PUT /api/device/" + deviceId + "/pins - Missing pins array");
      return;
    }
    
    bool found = false;
    for (auto &d : devices) {
      if (d.id == deviceId) {
        found = true;
        d.pins.clear();
        for (JsonVariant v : pins) {
          d.pins.push_back(v.as<int>());
        }
        break;
      }
    }
    
    if (found) {
      if (saveDevicesToFlash())
        res.send("Device pins updated");
      else
        res.status(500).send("Pins updated but failed to save changes");
      Serial.println("[DEBUG] Device " + deviceId + " pins updated");
    } else {
      res.status(404).send("Device not found");
      Serial.println("[DEBUG] Device " + deviceId + " not found for pin update");
    }
  });

  // DELETE /api/device/:id - Delete a device
  app.del("/api/device/:id", [](Request &req, Response &res) {
    String deviceId = req.getParam("id");
    Serial.println("[DEBUG] DELETE /api/device/" + deviceId);
    bool found = false;
    
    // Find and remove the device with matching id
    for (auto it = devices.begin(); it != devices.end(); ++it) {
      if (it->id == deviceId) {
        devices.erase(it);
        found = true;
        break;
      }
    }
    
    if (found) {
      if (saveDevicesToFlash())
        res.send("Device deleted");
      else
        res.status(500).send("Device deleted but failed to save changes");
      Serial.println("[DEBUG] Device " + deviceId + " deleted");
    } else {
      res.status(404).send("Device not found");
      Serial.println("[DEBUG] Device " + deviceId + " not found for deletion");
    }
  });
}

// Persistence functions using SPIFFS and ArduinoJson

bool saveDevicesToFlash() {
  Serial.println("[DEBUG] Saving devices to flash...");
  File file = SPIFFS.open(DEVICES_FILE, "w");
  if (!file) {
    Serial.println("[ERROR] Unable to open file for writing: " + String(DEVICES_FILE));
    return false;
  }
  
  // Estimate capacity (adjust if needed)
  const size_t capacity = JSON_ARRAY_SIZE(devices.size()) + devices.size() * JSON_OBJECT_SIZE(6) + 1024;
  DynamicJsonDocument doc(capacity);
  JsonArray arr = doc.to<JsonArray>();
  
  for (size_t i = 0; i < devices.size(); i++) {
    JsonObject obj = arr.createNestedObject();
    obj["id"] = devices[i].id;
    obj["type"] = devices[i].type;
    obj["state"] = devices[i].state;
    
    // Add pins as an array
    JsonArray pins = obj.createNestedArray("pins");
    for (size_t j = 0; j < devices[i].pins.size(); j++) {
      pins.add(devices[i].pins[j]);
    }
    
    // Convert interface and direction enums to strings
    String interfaceStr;
    switch (devices[i].interface) {
      case DIGITAL_IF: interfaceStr = "digital"; break;
      case ANALOG_IF:  interfaceStr = "analog"; break;
      case PWM_IF:     interfaceStr = "pwm"; break;
      case I2C_IF:     interfaceStr = "i2c"; break;
      case SPI_IF:     interfaceStr = "spi"; break;
      default:         interfaceStr = "unknown";
    }
    obj["interfaceType"] = interfaceStr;
    
    String dirStr;
    switch (devices[i].direction) {
      case INPUT_DEVICE:      dirStr = "input"; break;
      case OUTPUT_DEVICE:     dirStr = "output"; break;
      case BIDIRECTIONAL:     dirStr = "bidirectional"; break;
      default:                dirStr = "unknown";
    }
    obj["direction"] = dirStr;
  }
  
  if (serializeJson(doc, file) == 0) {
    Serial.println("[ERROR] Failed to write to file");
    file.close();
    return false;
  }
  
  file.close();
  Serial.println("[INFO] Devices saved to flash");
  return true;
}

bool loadDevicesFromFlash() {
  Serial.println("[DEBUG] Loading devices from flash...");
  if (!SPIFFS.exists(DEVICES_FILE)) {
    Serial.println("[INFO] Devices file not found: " + String(DEVICES_FILE));
    return false;
  }
  
  File file = SPIFFS.open(DEVICES_FILE, "r");
  if (!file) {
    Serial.println("[ERROR] Unable to open file for reading: " + String(DEVICES_FILE));
    return false;
  }
  
  String content = file.readString();
  Serial.println("[DEBUG] Devices file content: " + content);
  file.close();
  
  const size_t capacity = JSON_ARRAY_SIZE(10) + 10 * JSON_OBJECT_SIZE(6) + 1024;
  DynamicJsonDocument doc(capacity);
  DeserializationError error = deserializeJson(doc, content);
  if (error) {
    Serial.println("[ERROR] Failed to parse JSON: " + String(error.c_str()));
    return false;
  }
  
  JsonArray arr = doc.as<JsonArray>();
  devices.clear();
  
  for (JsonObject obj : arr) {
    Device d;
    d.id = obj["id"].as<String>();
    d.type = obj["type"].as<String>();
    d.state = obj["state"].as<String>();
    
    JsonArray pins = obj["pins"].as<JsonArray>();
    for (JsonVariant v : pins) {
      d.pins.push_back(v.as<int>());
    }
    
    String interfaceStr = obj["interfaceType"].as<String>();
    d.interface = parseInterfaceType(interfaceStr);
    
    String directionStr = obj["direction"].as<String>();
    d.direction = parseDeviceDirection(directionStr);
    
    devices.push_back(d);
  }
  
  Serial.println("[DEBUG] Loaded " + String(devices.size()) + " device(s) from flash.");
  return true;
}
