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
float raw_voltage;
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
const long deepSleepDuration = DEEP_SLEEP_DURATION_HOURS * 3600000000; // Convert hours (from DEEP_SLEEP_DURATION_HOURS) to microseconds

// WiFi jank
int wifiFailCount = 0;
int maxWiFiFailCount = 25; // Arbitrary "it has probably failed by now"-count

// Deep sleep
bool doSleep = true;

// Comment "#define DEBUG" for production
// #define DEBUG

// Debug functions
#ifdef DEBUG
  #define DEBUG_PRINT(x) Serial.print (x)
  #define DEBUG_PRINTLN(x) Serial.println (x)
#else
  #define DEBUG_PRINT(x) Telnet.print(x);
  #define DEBUG_PRINTLN(x) Telnet.println(x);
#endif

// Setup Telnet server
WiFiServer TelnetServer(23);
WiFiClient Telnet;

void handleTelnet() {
  if (TelnetServer.hasClient()) {
    if (!Telnet || !Telnet.connected()) {
      if (Telnet) Telnet.stop();
      Telnet = TelnetServer.available();
    } else {
      TelnetServer.available().stop();
    }
  }
}

void setup(){
  Serial.begin(9600);
  delay(1000); // Wait for serial to be ready https://www.arduino.cc/reference/en/language/functions/communication/serial/ifserial/
  Serial.println();

  #ifdef DEBUG
    Serial.println("DEBUG MODE ACTIVE");
  #else
    Serial.println("PRODUCTION MODE ACTIVE");
  #endif

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

  // Telnet
  TelnetServer.begin();
  TelnetServer.setNoDelay(true);

  // Setup OTA
  ArduinoOTA.setPort(OTA_PORT);
  ArduinoOTA.setHostname(OTA_NAME);
  ArduinoOTA.setPassword(OTA_PASSWORD);
  ArduinoOTA.begin();

  // Setup ADS
  ads.setGain(GAIN_TWOTHIRDS);  // 2/3x gain +/- 6.144V  1 bit = 3mV (default)
  ads.begin();

  Serial.print("Measuring battery ");
  Serial.print(BATTERY_NAME);
  Serial.print(" (");
  Serial.print(BATTERY_ID);
  Serial.print(") ");
  Serial.print("every ");
  doSleep ? Serial.print(DEEP_SLEEP_DURATION_HOURS) : Serial.print(LOG_INTERVAL_HOURS);
  Serial.println(" hour(s).");

  if (doSleep) {
    Serial.println("DEEP SLEEP IS ON");
    // sleepActions();
  }
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
    raw_voltage = ads.readADC_SingleEnded(0);

    /*
      Only handle readings if they're valid and above 0
      4095 is the max reading of the ADC
      this probably means it's not connected rather than reading a voltage of 60+ volts ¯\_(ツ)_/¯
    */
    if (raw_voltage > 0 && raw_voltage < 4095) {
      adc_reading = raw_voltage * ADC_RESOLUTION;
      samples.add(adc_reading * VOLTAGE_DIVIDER_RATIO);

      DEBUG_PRINTLN(adc_reading);
    } else {
      samples.add(0.0);
    }

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

  // Only POST if there's an actual real voltage reading
  if (postToAPI && voltage > 0) {
    sendMeasurement(voltage_truncated);
  }
}

// Send measured voltage to API
void sendMeasurement(float measurement) {
  DEBUG_PRINTLN("sendMeasurement()");

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

void sleepActions() {
  DEBUG_PRINTLN("sleepActions()");
  createMeasurement(true);

  DEBUG_PRINT("Going to sleep for ");
  DEBUG_PRINT(DEEP_SLEEP_DURATION_HOURS);
  DEBUG_PRINTLN(" hour(s)");
  ESP.deepSleep(deepSleepDuration);
}

void loop(){
  // Time since boot
  unsigned long currentMillis = millis();

  // Wait for firstRunThreshold before doing any measurements
  if (currentMillis > firstRunThreshold && isFirstRun) {
    DEBUG_PRINTLN("First run");
    isFirstRun = false;

    if (doSleep) {
      sleepActions();
    } else {
      // Measure voltage on boot (with delay) for status LED without posting to API
      createMeasurement();
    }
  }

  if (!doSleep) {
    handleTelnet();

    ArduinoOTA.handle();
    // Send heartbeat to API
    if (currentMillis - previousMillisHeartbeat >= heartbeatInterval) {
      previousMillisHeartbeat = currentMillis;
      sendHeartbeat();
    }

    // Measure voltage every "logInterval" hours
    if (currentMillis - previousMillisLogInterval >= logInterval) {
      previousMillisLogInterval = currentMillis;
      createMeasurement(true);
    }

    // Turn on red "warning led" if voltage is less than 20%
    if (warningLED) {
      digitalWrite(LED_PIN, HIGH);
    }
  }
}
