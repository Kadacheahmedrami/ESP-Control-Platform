#include "ESPControlPlatform.h"

// Define the global devices vector
std::vector<Device> devices;

// --- Helper Function Definitions ---

InterfaceType parseInterfaceType(const String &typeStr) {
  if (typeStr.equalsIgnoreCase("digital")) return DIGITAL_IF;
  else if (typeStr.equalsIgnoreCase("analog")) return ANALOG_IF;
  else if (typeStr.equalsIgnoreCase("pwm")) return PWM_IF;
  else if (typeStr.equalsIgnoreCase("i2c")) return I2C_IF;
  else if (typeStr.equalsIgnoreCase("spi")) return SPI_IF;
  else return UNKNOWN_INTERFACE;
}

DeviceDirection parseDeviceDirection(const String &dirStr) {
  if (dirStr.equalsIgnoreCase("input")) return INPUT_DEVICE;
  else if (dirStr.equalsIgnoreCase("output")) return OUTPUT_DEVICE;
  else if (dirStr.equalsIgnoreCase("bidirectional")) return BIDIRECTIONAL;
  else return UNKNOWN_DIRECTION;
}

std::vector<int> parsePins(const String &pinsStr) {
  std::vector<int> result;
  int start = 0;
  while (true) {
    int commaIndex = pinsStr.indexOf(',', start);
    String number;
    if (commaIndex == -1) {
      number = pinsStr.substring(start);
      number.trim();
      if (number.length() > 0)
        result.push_back(number.toInt());
      break;
    } else {
      number = pinsStr.substring(start, commaIndex);
      number.trim();
      result.push_back(number.toInt());
      start = commaIndex + 1;
    }
  }
  return result;
}
