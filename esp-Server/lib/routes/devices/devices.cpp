#include "devices.h"
#include "ESPControlPlatform.h"  // For access to global 'devices' and helper functions

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

  // POST /api/device - Add a new device
  // Expected JSON examples:
  // { "id": "sensor1", "type": "sensor", "pin": 5, "interfaceType": "analog", "direction": "input" }
  // { "id": "lamp", "type": "actuator", "pins": [2,3], "interfaceType": "pwm", "direction": "output" }
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
    
    res.send("Device added");
  });

  // PUT /api/device/:id - Update device state
  // Expects the new state in the request body (plain text)
  app.put("/api/device/:id", [](Request &req, Response &res) {
    String deviceId = req.getParam("id");
    Serial.println("[DEBUG] PUT /api/device/" + deviceId + " with new state: " + req.body);
    bool found = false;
    for (auto &d : devices) {
      if (d.id == deviceId) {
        d.state = req.body;
        found = true;
        break;
      }
    }
    if (found) {
      res.send("Device updated");
      Serial.println("[DEBUG] Device " + deviceId + " updated successfully");
    }
    else {
      res.status(404).send("Device not found");
      Serial.println("[DEBUG] Device " + deviceId + " not found");
    }
  });
}
