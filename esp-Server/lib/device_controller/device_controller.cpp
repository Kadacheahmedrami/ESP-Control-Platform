#include "device_controller.h"
#include <ESP32Servo.h>
#include <Wire.h>
#include <map>

// Global map to store Servo instances for each servo pin
std::map<int, Servo> servoMap;

void setupDevicePins() {
    // Initialize all registered devices
    for (auto &device : devices) {
        // Set pin modes based on device direction
        for (int pin : device.pins) {
            switch (device.direction) {
                case INPUT_DEVICE:
                    pinMode(pin, INPUT);
                    break;
                case OUTPUT_DEVICE:
                    pinMode(pin, OUTPUT);
                    break;
                case BIDIRECTIONAL:
                    pinMode(pin, INPUT_PULLUP);
                    break;
                default:
                    break;
            }
        }
    }
}

bool updateDeviceState(Device &device, const String &newState) {
    bool success = false;
    
    // Route state update to appropriate device type handler
    if (device.type == "led") 
        success = controlLED(device, newState);
    else if (device.type == "servo") 
        success = controlServo(device, newState);
    else if (device.type == "stepper") 
        success = controlStepperMotor(device, newState);
    else if (device.type == "motor") 
        success = controlMotor(device, newState);
    else if (device.type == "relay") 
        success = controlRelay(device, newState);
    else if (device.type == "led_strip") 
        success = controlLEDStrip(device, newState);
    else if (device.type == "sensor") 
        success = controlSensor(device, newState);
    else 
        success = controlGenericDevice(device, newState);

    // Update device state if operation was successful
    if (success) {
        device.state = newState;
    }

    return success;
}

bool controlLED(Device &device, const String &state) {
    Serial.println(device.pins[0]);
    Serial.println(state);
    pinMode(device.pins[0], OUTPUT);
    if (state == "on" || state == "1" || state == "true") {
        digitalWrite(device.pins[0], HIGH);
        Serial.println("LED Turned ON");
        return true;
    }
    else if (state == "off" || state == "0" || state == "false") {
        digitalWrite(device.pins[0], LOW);
        Serial.println("LED Turned OFF");
        return true;
    }
    Serial.println("Invalid LED state");
    return false;
}

bool controlServo(Device &device, const String &state) {
    int angle = state.toInt();
    int servoPin = device.pins[0];
    Serial.print("Servo angle: ");
    Serial.println(angle);
    Serial.print("Servo pin: ");
    Serial.println(servoPin);

    // Check if a Servo instance for this pin already exists in the map
    if (servoMap.find(servoPin) == servoMap.end()) {
        // Create and attach a new Servo instance if not found
        servoMap[servoPin] = Servo();
        servoMap[servoPin].attach(servoPin);
    }

    // Write the angle to the servo associated with this pin
    servoMap[servoPin].write(angle);
    return true;
}

bool controlStepperMotor(Device &device, const String &state) {
    // Implement stepper motor control logic
    return false;
}

bool controlMotor(Device &device, const String &state) {
    if (state == "off") {
        for (int pin : device.pins) {
            digitalWrite(pin, LOW);
        }
        return true;
    }
    
    int firstColon = state.indexOf(':');
    int secondColon = state.indexOf(':', firstColon + 1);
    
    if (firstColon == -1 || secondColon == -1) return false;
    
    int speed = state.substring(firstColon + 1, secondColon).toInt();
    String direction = state.substring(secondColon + 1);
    
    if (device.pins.size() >= 2) {
        if (direction == "forward") {
            digitalWrite(device.pins[0], HIGH);
            digitalWrite(device.pins[1], LOW);
        } else if (direction == "reverse") {
            digitalWrite(device.pins[0], LOW);
            digitalWrite(device.pins[1], HIGH);
        }
        
        analogWrite(device.pins[2], map(speed, 0, 100, 0, 255));
        return true;
    }
    
    return false;
}

bool controlRelay(Device &device, const String &state) {
    if (state == "on" || state == "1") {
        digitalWrite(device.pins[0], HIGH);
        return true;
    }
    else if (state == "off" || state == "0") {
        digitalWrite(device.pins[0], LOW);
        return true;
    }
    return false;
}

bool controlLEDStrip(Device &device, const String &state) {
    // Placeholder for LED strip control
    return false;
}

bool controlSensor(Device &device, const String &state) {
    return true;
}

bool controlGenericDevice(Device &device, const String &state) {
    return true;
}

float readAnalogSensor(int pin) {
    return analogRead(pin) * (3.3 / 4095.0);  // Convert to voltage on ESP32
}

int readDigitalSensor(int pin) {
    return digitalRead(pin);
}
