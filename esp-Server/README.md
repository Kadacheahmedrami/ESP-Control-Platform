ESPExpress
==========

 [![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com/yourusername/ESPExpress)[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg) ](LICENSE)[![PlatformIO Compatible](https://img.shields.io/badge/PlatformIO-compatible-brightgreen)](https://platformio.org)

**ESPExpress** is a lightweight **back end** C++ framework for ESP microcontrollers that mimics the popular Express.js syntax. It empowers you to rapidly build robust web applications and APIs on embedded devices with minimal overhead.

* * *

✨ Features
----------

*   **Express.js Inspired API:** Easily define routes for HTTP methods like GET, POST, PUT, DELETE, and OPTIONS.
*   **Middleware Support:** Chain middleware functions for logging, authentication, and request manipulation.
*   **Static File Serving:** Serve files directly from SPIFFS with automatic content type detection.
*   **Template Rendering:** Render dynamic HTML pages using a simple templating engine with variable substitution.
*   **CORS Handling:** Built-in support for cross-origin resource sharing (CORS) for seamless API integrations.

🚀 Quick Start
--------------

### Installation

Clone the repository and add ESPExpress to your PlatformIO project:

    git clone https://github.com/kadacheahmedrami/ESPExpress.git

Then, structure your project as follows:

    your_project/
    ├── lib/
    │   └── ESPExpress/
    │       ├── src/
    │       │   ├── ESPExpress.cpp
    │       │   └── ESPExpress.h
    │       └── library.json
    └── src/
        └── main.cpp

### Example Code

Here's a minimal example to get your ESPExpress server up and running:

    #include <WiFi.h>
    #include <SPIFFS.h>
    #include "ESPExpress.h"
    
    // Replace with your WiFi credentials
    const char* ssid = "Your_SSID";
    const char* password = "Your_PASSWORD";
    
    // Create an instance of the ESPExpress server on port 80
    ESPExpress app(80);
    
    void setup() {
      Serial.begin(115200);
      delay(1000);
    
      // Connect to WiFi
      WiFi.begin(ssid, password);
      Serial.println("Connecting to WiFi...");
      while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
      }
      Serial.println();
      Serial.print("Connected! IP address: ");
      Serial.println(WiFi.localIP());
    
      // Initialize SPIFFS for static file serving and template rendering
      if (!SPIFFS.begin(true)) {
        Serial.println("Failed to mount SPIFFS");
        return;
      }
    
      // Serve the index.html file on the root "/"
      app.get("/", [](Request &req, Response &res) {
        res.sendFile("/www/index.html");
      });
    
      // Additional routes
      app.get("/user/:id", [](Request &req, Response &res) {
        String userId = req.getParam("id");
        res.send("<h1>User Profile</h1><p>User ID: " + userId + "</p>");
      });
    
      // Start the server
      app.listen("Server is running...");
    }
    
    void loop() {
      // The server runs in a loop inside app.listen(), no need for code here.
    }

📚 Documentation
----------------

For detailed documentation on all functions, middleware, routing, and configuration options, please visit our [Wiki](https://github.com/kadacheahmedrami/ESPExpress/wiki) or refer to the inline comments in the source code.

🤝 Contributing
---------------

Contributions are welcome! To contribute to ESPExpress:

1.  **Fork** the repository.
2.  Create a new branch for your feature or bug fix:
    
        git checkout -b feature/YourFeature
    
3.  Commit your changes:
    
        git commit -am 'Add new feature'
    
4.  Push to your branch:
    
        git push origin feature/YourFeature
    
5.  Open a **Pull Request** on GitHub.

📝 License
----------

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

📞 Contact
----------

For support, questions, or suggestions, please [open an issue](https://github.com/kadacheahmedrami/ESPExpress/issues) or contact [a_kadache@estin.dz](mailto:a_kadache@estin.dz).

* * *

Happy coding with ESPExpress, and build amazing back end applications on your ESP microcontrollers!
