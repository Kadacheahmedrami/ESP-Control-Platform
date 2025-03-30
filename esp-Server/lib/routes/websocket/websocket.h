#ifndef WEBSOCKET_H
#define WEBSOCKET_H

#include "ESPExpress.h"

void registerWebSocketRoutes(ESPExpress &app);
void sendTemperatureUpdate(ESPExpress &app, float temperature);

#endif // WEBSOCKET_H