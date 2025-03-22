#ifndef ESPCONTROLPLATFORM_H
#define ESPCONTROLPLATFORM_H

#include <Arduino.h>
#include <vector>

// --- Enums ---

enum InterfaceType {
  DIGITAL_IF,
  ANALOG_IF,
  PWM_IF,
  I2C_IF,
  SPI_IF,
  UNKNOWN_INTERFACE
};

enum DeviceDirection {
  INPUT_DEVICE,
  OUTPUT_DEVICE,
  BIDIRECTIONAL,
  UNKNOWN_DIRECTION
};

// --- Helper Function Declarations ---

InterfaceType parseInterfaceType(const String &typeStr);
DeviceDirection parseDeviceDirection(const String &dirStr);
std::vector<int> parsePins(const String &pinsStr);

// --- Device Structure ---

struct Device {
  String id;
  String type;                   // e.g., "sensor", "actuator"
  std::vector<int> pins;         // supports one or more pins
  String state;                  // e.g., sensor reading or actuator state
  InterfaceType interface;       // e.g., DIGITAL_IF, ANALOG_IF, etc.
  DeviceDirection direction;     // e.g., INPUT_DEVICE, OUTPUT_DEVICE, etc.
};

// Global container for devices.  
extern std::vector<Device> devices;

#endif  // ESPCONTROLPLATFORM_H
