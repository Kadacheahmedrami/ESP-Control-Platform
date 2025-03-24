#include "device_controller.h"
#include <ESP32Servo.h>
#include <Wire.h>

// Global objects for device control
std::vector<Servo> servoControls;

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

        // Special initializations for specific device types
        if (device.type == "servo") {
            Servo servo;
            servo.attach(device.pins[0]);
            servoControls.push_back(servo);
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
    // Print detailed device information
    Serial.println("LED Control - Device Details:");
    Serial.println("Device ID: " + device.id);
    Serial.println("Device Type: " + device.type);
    Serial.println("Requested State: " + state);
    Serial.println("Current Device State: " + device.state);
    Serial.print(device.pins[0]);
    Serial.println("Interface: " + device.interface);

    // LED control logic
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
    if (angle >= 0 && angle <= 180) {
        // Find the right servo by matching the pin
        for (size_t i = 0; i < servoControls.size(); i++) {
            if (device.pins[0] == servoControls[i].attached()) {
                servoControls[i].write(angle);
                return true;
            }
        }
    }
    return false;
}

bool controlStepperMotor(Device &device, const String &state) {
    // Implement stepper motor control logic
    // This is a placeholder - you'll need to add actual stepper motor library support
    return false;
}

bool controlMotor(Device &device, const String &state) {
    if (state == "off") {
        for (int pin : device.pins) {
            digitalWrite(pin, LOW);
        }
        return true;
    }
    
    // Parse state: on:speed:direction
    int firstColon = state.indexOf(':');
    int secondColon = state.indexOf(':', firstColon + 1);
    
    if (firstColon == -1 || secondColon == -1) return false;
    
    int speed = state.substring(firstColon + 1, secondColon).toInt();
    String direction = state.substring(secondColon + 1);
    
    // Assuming PWM for speed control and direction pins
    if (device.pins.size() >= 2) {
        if (direction == "forward") {
            digitalWrite(device.pins[0], HIGH);
            digitalWrite(device.pins[1], LOW);
        } else if (direction == "reverse") {
            digitalWrite(device.pins[0], LOW);
            digitalWrite(device.pins[1], HIGH);
        }
        
        // PWM speed control
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
    // You'll need to implement this based on your specific LED strip library
    return false;
}

bool controlSensor(Device &device, const String &state) {
    // For sensors, this is mainly for logging or tracking
    // Actual sensor reading should be done separately
    return true;
}

bool controlGenericDevice(Device &device, const String &state) {
    // Generic fallback for custom devices
    return true;
}

float readAnalogSensor(int pin) {
    return analogRead(pin) * (3.3 / 4095.0);  // Convert to voltage on ESP32
}

int readDigitalSensor(int pin) {
    return digitalRead(pin);
}