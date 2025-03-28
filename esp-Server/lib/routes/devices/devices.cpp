#include "devices.h"
#include "ESPControlPlatform.h"
#include "device_controller.h"
#include <ArduinoJson.h>
#include <SPIFFS.h>

// File path in SPIFFS to store devices
const char* DEVICES_FILE = "/devices.json";

// Persistence function prototypes
bool saveDevicesToFlash();
bool loadDevicesFromFlash();

void initializeDevices() {
  Serial.println("[DEBUG] Initializing devices from flash...");
  if (!loadDevicesFromFlash()) {
    Serial.println("[INFO] No devices file found, starting with an empty list.");
  } else {
    Serial.println("[INFO] Devices loaded from flash.");
  }
}

// Helper function to convert enums to strings
String getInterfaceTypeString(InterfaceType interface) {
  switch (interface) {
    case DIGITAL_IF: return "digital";
    case ANALOG_IF:  return "analog";
    case PWM_IF:     return "pwm";
    case I2C_IF:     return "i2c";
    case SPI_IF:     return "spi";
    default:         return "unknown";
  }
}

String getDeviceDirectionString(DeviceDirection direction) {
  switch (direction) {
    case INPUT_DEVICE:      return "input";
    case OUTPUT_DEVICE:     return "output";
    case BIDIRECTIONAL:     return "bidirectional";
    default:                return "unknown";
  }
}

void registerDeviceRoutes(ESPExpress &app) {
  // GET /api/devices - List all devices
  app.get("/api/devices", [](Request &req, Response &res) {
    JsonDocument doc;
    JsonArray deviceArray = doc.to<JsonArray>();

    for (const auto& device : devices) {
      JsonObject deviceObj = deviceArray.add<JsonObject>();
      
      deviceObj["id"] = device.id;
      deviceObj["type"] = device.type;
      deviceObj["state"] = device.state;
      
      JsonArray pinsArray = deviceObj["pins"].to<JsonArray>();
      for (int pin : device.pins) {
        pinsArray.add(pin);
      }
      
      deviceObj["interfaceType"] = getInterfaceTypeString(device.interface);
      deviceObj["direction"] = getDeviceDirectionString(device.direction);
    }

    String jsonResponse;
    serializeJson(doc, jsonResponse);
    Serial.println("[DEBUG] GET /api/devices response JSON: " + jsonResponse);
    res.sendJson(jsonResponse);
  });

  // GET /api/device/:id - Get a single device by id
  app.get("/api/device/:id", [](Request &req, Response &res) {
    String deviceId = req.getParam("id");
    Serial.println("[DEBUG] GET /api/device/" + deviceId);

    for (const auto& device : devices) {
      if (device.id == deviceId) {
        JsonDocument doc;
        JsonObject deviceObj = doc.to<JsonObject>();
        
        deviceObj["id"] = device.id;
        deviceObj["type"] = device.type;
        deviceObj["state"] = device.state;
        
        JsonArray pinsArray = deviceObj["pins"].to<JsonArray>();
        for (int pin : device.pins) {
          pinsArray.add(pin);
        }
        
        deviceObj["interfaceType"] = getInterfaceTypeString(device.interface);
        deviceObj["direction"] = getDeviceDirectionString(device.direction);

        String jsonResponse;
        serializeJson(doc, jsonResponse);
        res.sendJson(jsonResponse);
        return;
      }
    }

    res.status(404).send("Device not found");
    Serial.println("[DEBUG] GET /api/device/" + deviceId + " - not found");
  });

  // POST /api/device - Add a new device
  app.post("/api/device", [](Request &req, Response &res) {
    JsonDocument doc;
    DeserializationError error = deserializeJson(doc, req.body);
    
    if (error) {
      res.status(400).send("Invalid JSON");
      Serial.println("[DEBUG] POST /api/device - JSON parse error: " + String(error.c_str()));
      return;
    }

    Device d;
    d.id = doc["id"].as<String>();
    d.type = doc["type"].as<String>();
    d.state = doc.containsKey("state") ? doc["state"].as<String>() : "unknown";

    // Parse pins
    if (doc.containsKey("pins")) {
      JsonArray pinsJson = doc["pins"].as<JsonArray>();
      for (JsonVariant pinVar : pinsJson) {
        d.pins.push_back(pinVar.as<int>());
      }
    }

    // Parse interface type
    d.interface = doc.containsKey("interfaceType") 
      ? parseInterfaceType(doc["interfaceType"].as<String>()) 
      : DIGITAL_IF;

    // Parse device direction
    d.direction = doc.containsKey("direction")
      ? parseDeviceDirection(doc["direction"].as<String>())
      : UNKNOWN_DIRECTION;

    devices.push_back(d);
    
    // Debug output
    JsonDocument debugDoc;
    JsonObject debugObj = debugDoc.to<JsonObject>();
    debugObj["id"] = d.id;
    debugObj["type"] = d.type;
    debugObj["state"] = d.state;
    
    JsonArray debugPinsArray = debugObj["pins"].to<JsonArray>();
    for (int pin : d.pins) {
      debugPinsArray.add(pin);
    }
    
    debugObj["interfaceType"] = getInterfaceTypeString(d.interface);
    debugObj["direction"] = getDeviceDirectionString(d.direction);

    String debugJson;
    serializeJson(debugDoc, debugJson);
    Serial.println("[DEBUG] Adding Device: " + debugJson);
    
    // Save to flash
    if (saveDevicesToFlash()) {
      res.send("Device added");
    } else {
      res.status(500).send("Failed to save device");
    }
  });

  // PUT /api/device/:id - Update device state or other attributes
  app.put("/api/device/:id", [](Request &req, Response &res) {
    String deviceId = req.getParam("id");
    String newState = req.body;
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

    JsonDocument doc;
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
    
    auto it = std::find_if(devices.begin(), devices.end(), 
      [&deviceId](const Device& d) { return d.id == deviceId; });
    
    if (it != devices.end()) {
      devices.erase(it);
      
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

bool saveDevicesToFlash() {
  Serial.println("[DEBUG] Saving devices to flash...");
  
  File file = SPIFFS.open(DEVICES_FILE, "w");
  if (!file) {
    Serial.println("[ERROR] Unable to open file for writing: " + String(DEVICES_FILE));
    return false;
  }
  
  JsonDocument doc;
  JsonArray arr = doc.to<JsonArray>();
  
  for (const auto& device : devices) {
    JsonObject obj = arr.add<JsonObject>();
    
    obj["id"] = device.id;
    obj["type"] = device.type;
    obj["state"] = device.state;
    
    JsonArray pins = obj["pins"].to<JsonArray>();
    for (int pin : device.pins) {
      pins.add(pin);
    }
    
    obj["interfaceType"] = getInterfaceTypeString(device.interface);
    obj["direction"] = getDeviceDirectionString(device.direction);
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
  
  JsonDocument doc;
  DeserializationError error = deserializeJson(doc, file);
  file.close();
  
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
    
    d.interface = parseInterfaceType(obj["interfaceType"].as<String>());
    d.direction = parseDeviceDirection(obj["direction"].as<String>());
    
    devices.push_back(d);
  }
  
  Serial.println("[DEBUG] Loaded " + String(devices.size()) + " device(s) from flash.");
  return true;
}