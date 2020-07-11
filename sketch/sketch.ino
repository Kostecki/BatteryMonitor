//Config
#include "config.h";

#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClientSecureBearSSL.h>
#include <ArduinoOTA.h>
#include <ArduinoJson.h>

int analogInput = A0;
int LEDPin = D5;
float VCC = 3.2;

float vout = 0.0;
float vin = 0.0;
float R1 = 30000.0; // resistance of R1 (30K)
float R2 = 7500.0; // resistance of R2 (7.5K)
int value = 0;

bool warningLED = true;

void setup(){
  Serial.begin(9600);

  // Setup pins: Voltage IN + LED
  pinMode(analogInput, INPUT);
  pinMode(LEDPin, OUTPUT);

  // Setup WiFi with Mode, Hostname, SSID and Password
  Serial.println();
  Serial.print("Connecting to WiFi: ");
  Serial.println(WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.hostname(HOSTNAME);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println();
  Serial.print("Conncted, IP address: ");
  Serial.println(WiFi.localIP());

  // Setup OTA
  ArduinoOTA.setPort(OTA_PORT);
  ArduinoOTA.setHostname(OTA_NAME);
  ArduinoOTA.setPassword(OTA_PASSWORD);
  ArduinoOTA.begin();
}

void loop(){
    ArduinoOTA.handle();
  
    if (warningLED) {
      digitalWrite(LEDPin, HIGH);
    }

    createMeasurement();
}

// Measure voltage of connected battery
float createMeasurement() {
  // Divide by 3.2 to account for built-in voltage divider on A0
  value = (analogRead(analogInput) / 3.2);
  vout = value * (VCC / 1023.0);
  vin = vout / (R2/(R1+R2));

  // Turn on red "warning led" if voltage is less than 20%
  if (vin < 11.66) {
    warningLED = true;
  } else {
    warningLED = false;
  }
  
  sendMeasurement(vin);
}

// Send measured voltage to API
void sendMeasurement(float measurement) {
  // Create JSON object
  const size_t CAPACITY = JSON_OBJECT_SIZE(2);
  StaticJsonDocument<CAPACITY> doc;

  // Populate JSON object
  doc["batteryId"] = BATTERY_ID;
  doc["voltage"] = measurement;

  // Serializeed JSON is required for the POST request
  String json;
  serializeJson(doc, json);

  // HTTPS Client setup
  std::unique_ptr<BearSSL::WiFiClientSecure>client(new BearSSL::WiFiClientSecure);
  client->setInsecure();
  HTTPClient https;

  // Handle POST request
  if (https.begin(*client, API_URL)) {
    https.POST(json);
    https.end();
  }
}
