#ifndef DEVICE_CONTROLLER_H
#define DEVICE_CONTROLLER_H

#include <Arduino.h>
#include <vector>
#include <ESP32Servo.h>
#include "ESPControlPlatform.h"  // Use this instead of devices.h

// Global objects for device control
extern std::vector<Servo> servoControls;

// Function prototypes
void setupDevicePins();
bool updateDeviceState(Device &device, const String &newState);

// Specific device type control functions
bool controlLED(Device &device, const String &state);
bool controlServo(Device &device, const String &state);
bool controlStepperMotor(Device &device, const String &state);
bool controlMotor(Device &device, const String &state);
bool controlRelay(Device &device, const String &state);
bool controlLEDStrip(Device &device, const String &state);
bool controlSensor(Device &device, const String &state);
bool controlGenericDevice(Device &device, const String &state);

// Utility functions
float readAnalogSensor(int pin);
int readDigitalSensor(int pin);

#endif // DEVICE_CONTROLLER_H