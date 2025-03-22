#include "websocket.h"

void registerWebSocketRoutes(ESPExpress &app) {
  // Capture app by reference using [&app]
  app.ws("/ws", [&app](uint8_t num, WStype_t type, uint8_t* payload, size_t length) {
    switch (type) {
      case WStype_CONNECTED:
        Serial.printf("WS client %u connected\n", num);
        break;
      case WStype_DISCONNECTED:
        Serial.printf("WS client %u disconnected\n", num);
        break;
      case WStype_TEXT:
        Serial.printf("WS message from %u: %s\n", num, payload);
        // Echo the message back
        app.wsSendTXT(num, String((char*)payload));
        break;
      default:
        break;
    }
  });
}
