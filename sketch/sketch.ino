#include "config.h";
#include "ntp_time.h";

#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClientSecureBearSSL.h>
#include <time.h>
#include <ArduinoOTA.h>
#include <ArduinoJson.h>
#include <RunningMedian.h>

// Keep track of first run
bool isFirstRun = true;

// Voltage measurements
int raw_analog_value = 0;
float voltage = 0.0;

// Warning-LED Status
bool warningLED = false;

// Intervals and time keeping
unsigned long previousMillisLogInterval = 0;
unsigned long previousMillisHeartbeat = 0;
const long heartbeatInterval = HEARTBEAT_FREQUENCY_MINUTES * 60000; // Convert minutes (from HEARTBEAT_FREQUENCY_MINUTES) to milliseconds
const long logInterval = LOG_INTERVAL_HOURS * 3600000; // Convert hours (from LOG_INTERVAL_HOURS) to milliseconds
const long firstRunThreshold = FIRST_RUN_THRESHOLD_MINUTES * 60000; // Convert minutes (from FIRST_RUN_THRESHOLD_MINUTES) to milliseconds

void setup(){
  Serial.begin(9600);

  // Setup pins: Voltage IN + LED
  pinMode(VOLTAGE_INPUT_PIN, INPUT);
  pinMode(LED_PIN, OUTPUT);

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

  Serial.print("Measuring battery ");
  Serial.print(BATTERY_NAME);
  Serial.print(" (");
  Serial.print(BATTERY_ID);
  Serial.print(") ");
  Serial.print("every ");
  Serial.print(LOG_INTERVAL_HOURS);
  Serial.println(" hour(s)");

  // Setup OTA
  ArduinoOTA.setPort(OTA_PORT);
  ArduinoOTA.setHostname(OTA_NAME);
  ArduinoOTA.setPassword(OTA_PASSWORD);
  ArduinoOTA.begin();
}

void sendHeartbeat() {
  // Create JSON object
  const size_t CAPACITY = JSON_OBJECT_SIZE(1);
  StaticJsonDocument<CAPACITY> doc;

  // Populate JSON object
  doc["batteryId"] = BATTERY_ID;

  // Serialized JSON is required for the POST request
  String json;
  serializeJson(doc, json);

  // HTTPS Client setup
  std::unique_ptr<BearSSL::WiFiClientSecure>client(new BearSSL::WiFiClientSecure);
  client->setInsecure();
  HTTPClient https;

  // Handle POST request
  if (https.begin(*client, API_URL_HEARTBEAT)) {
    https.POST(json);
    https.end();
  }
}

// Measure voltage of connected battery
float createMeasurement(bool postToAPI = false) {
  // Sample battery voltage 100 times and get median value
  RunningMedian samples = RunningMedian(100);
  for (int i = 0; i < 100; i++) {
    raw_analog_value = analogRead(VOLTAGE_INPUT_PIN);
    voltage = raw_analog_value * 0.0124;  //0.01243
    samples.add(voltage);
  }

  // Set status-LED.. status
  if (voltage < WARNING_VOLTAGE) {
    warningLED = true;
  } else {
    warningLED = false;
  }
  
  if (postToAPI) {
    sendMeasurement(voltage);
  }
}

// Send measured voltage to API
void sendMeasurement(float measurement) {
  // Create JSON object
  const size_t CAPACITY = JSON_OBJECT_SIZE(2);
  StaticJsonDocument<CAPACITY> doc;

  // Populate JSON object
  doc["batteryId"] = BATTERY_ID;
  doc["voltage"] = measurement;

  // Serialized JSON is required for the POST request
  String json;
  serializeJson(doc, json);

  // HTTPS Client setup
  std::unique_ptr<BearSSL::WiFiClientSecure>client(new BearSSL::WiFiClientSecure);
  client->setInsecure();
  HTTPClient https;

  // Handle POST request
  if (https.begin(*client, API_URL_MEASUREMENT)) {
    https.POST(json);
    https.end();
  }
}

void loop(){
  ArduinoOTA.handle();

  // Time since boot
  unsigned long currentMillis = millis();

  // Send heartbeat to API
  if (currentMillis - previousMillisHeartbeat >= heartbeatInterval) {
    previousMillisHeartbeat = currentMillis;
    sendHeartbeat();
  }
  
  // Measure voltage on boot (with delay) for status LED
  if (currentMillis > firstRunThreshold && isFirstRun) {
    isFirstRun = false;
    createMeasurement();
  }

  // Measure voltage every 6 (logInterval) hours
  if (currentMillis - previousMillisLogInterval >= logInterval) {
    previousMillisLogInterval = currentMillis;
    createMeasurement(true);
  }

  // Turn on red "warning led" if voltage is less than 20%
  if (warningLED) {
    digitalWrite(LED_PIN, HIGH);
  }
}