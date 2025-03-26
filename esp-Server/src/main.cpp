#include <WiFi.h>
#include <SPIFFS.h>
#include "ESPExpress.h"
#include "ESPControlPlatform.h"
#include "devices/devices.h"       // from lib/Routes/devices/
#include "websocket/websocket.h"   // from lib/Routes/websocket/

// Replace with your WiFi credentials
const char* ssid     = "Tenda1200";
const char* password = "78787878";

// Create an instance of the ESPExpress server on port 80
ESPExpress app(80);

void setup() {

  Serial.begin(115200);

  delay(1000);

  // Connect to WiFi
  WiFi.begin(ssid, password);
  Serial.println("Connecting to WiFi...");
  while(WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println();
  Serial.print("Connected! IP: ");
  Serial.println(WiFi.localIP());

  // Initialize SPIFFS
  if(!SPIFFS.begin(true)) {
    Serial.println("SPIFFS mount failed");
    return;
  }

  // Set up middleware, CORS, and static file serving
  app.use([](Request &req, Response &res, std::function<void()> next) {
    Serial.print("[LOG] Request: ");
    Serial.println(req.path);
    next();
  });
  app.enableCORS("*");
  app.serveStatic("/static", "/www");

  // Register route modules
  registerDeviceRoutes(app);
  registerWebSocketRoutes(app);  // Optional, if you have it

  Serial.println("Starting server...");
  app.listen("Platform running...");
}

void loop() {
  app.wsLoop();
}
