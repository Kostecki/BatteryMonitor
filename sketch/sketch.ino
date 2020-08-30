#include "config.h";

#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClientSecureBearSSL.h>
#include <ArduinoOTA.h>
#include <ArduinoJson.h>
#include <RunningMedian.h>
#include <Adafruit_ADS1015.h>

// Setup ADS1015 ADC
Adafruit_ADS1015 ads;

// Keep track of first run
bool isFirstRun = true;

// Voltage measurements
float adc_reading;
float voltage;
float voltage_truncated;

// Warning-LED Status
bool warningLED = false;

// Intervals and time keeping
unsigned long previousMillisLogInterval = 0;
unsigned long previousMillisHeartbeat = 0;
const long heartbeatInterval = HEARTBEAT_FREQUENCY_MINUTES * 60000; // Convert minutes (from HEARTBEAT_FREQUENCY_MINUTES) to milliseconds
const long logInterval = LOG_INTERVAL_HOURS * 3600000; // Convert hours (from LOG_INTERVAL_HOURS) to milliseconds
const long firstRunThreshold = FIRST_RUN_THRESHOLD_MINUTES * 60000; // Convert minutes (from FIRST_RUN_THRESHOLD_MINUTES) to milliseconds

// WiFi jank
int wifiFailCount = 0;
int maxWiFiFailCount = 25; // Arbitrary "it has probably failed by now"-count

// Comment "#define DEBUG" for production
// #define DEBUG

// Debug functions
#ifdef DEBUG
  #define DEBUG_PRINT(x) Serial.print (x)
  #define DEBUG_PRINTLN(x) Serial.println (x)
#else
  #define DEBUG_PRINT(x)
  #define DEBUG_PRINTLN(x)
#endif

void setup(){
  Serial.begin(9600);

  delay(1000); // Wait for serial to be ready https://www.arduino.cc/reference/en/language/functions/communication/serial/ifserial/

  DEBUG_PRINTLN("");
  DEBUG_PRINTLN("DEBUG MODE ACTIVE");

  // Setup pins
  pinMode(LED_PIN, OUTPUT);

  // Setup WiFi with Mode, Hostname, SSID and Password
  Serial.println();
  Serial.print("Connecting to WiFi: ");
  Serial.println(WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.hostname(DEVICE_NAME);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
    wifiFailCount = wifiFailCount + 1;

    // Restart ESP if WiFi can't connect
    if (wifiFailCount >= maxWiFiFailCount) {
      ESP.restart();
    }
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

  // Setup ADS
  ads.setGain(GAIN_TWOTHIRDS);  // 2/3x gain +/- 6.144V  1 bit = 3mV (default)
  ads.begin();
}

void sendHeartbeat() {
  DEBUG_PRINTLN("sendHeartbeat()");

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
    DEBUG_PRINTLN("sendHeartbeat -> POST requset");

    https.addHeader("Content-Type", "application/json");
    https.POST(json);
    https.end();
  }
}

// Measure voltage of connected battery
float createMeasurement(bool postToAPI = false) {
  DEBUG_PRINTLN("createMeasurement()");

  int samplesCount = 200; // Sample battery voltage 200 times
  RunningMedian samples = RunningMedian(samplesCount);
  for (int i = 0; i < samplesCount; i++) {
    adc_reading = ads.readADC_SingleEnded(0) * ADC_RESOLUTION;
    samples.add(adc_reading * VOLTAGE_DIVIDER_RATIO);
    delay(50);
  }

  // Get median of all the sampled voltage readings
  voltage = samples.getMedian();

  DEBUG_PRINT("Voltage: ");
  DEBUG_PRINTLN(voltage);

  // Truncate to 2 decimals
  // "Multiply your float number by 100. Turn it into an int. to truncate it. Turn it back into a float and divide by 100"
  voltage_truncated = float(int(voltage * 100)) / 100;

  DEBUG_PRINT("Voltage Truncated: ");
  DEBUG_PRINTLN(voltage_truncated);

  // Set status-LED.. status
  if (voltage_truncated < WARNING_VOLTAGE) {
    warningLED = true;
  } else {
    warningLED = false;
  }
  
  if (postToAPI) {
    sendMeasurement(voltage_truncated);
  }
}

// Send measured voltage to API
void sendMeasurement(float measurement) {
  DEBUG_PRINTLN("sendHeartbeat()");

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
    DEBUG_PRINTLN("sendMeasurement -> POST requset");
    
    https.addHeader("Content-Type", "application/json");
    https.POST(json);
    https.end();
  }
}

void loop(){
  ArduinoOTA.handle();

  // Time since boot
  unsigned long currentMillis = millis();

  #ifdef DEBUG
    createMeasurement();
    delay(3000);
  #else
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
  #endif
}

