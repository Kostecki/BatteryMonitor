#include "base_config.h"
// #include "board_configs/charge_dove.h"
// #include "board_configs/cloud_raven.h"
// #include "board_configs/current_swallow.h"
// #include "board_configs/electric_chicken.h"
// #include "board_configs/energy_magpie.h"
// #include "board_configs/lightning_goose.h"
// #include "board_configs/power_pelican.h"
// #include "board_configs/storm_gobbler.h"
// #include "board_configs/thunder_duck.h"

#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClientSecureBearSSL.h>
#include <ArduinoOTA.h>
#include <ArduinoJson.h>
#include <RunningMedian.h>
#include <Adafruit_ADS1X15.h>
#include <PubSubClient.h>

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

// Print variable of type uint64_t
// https://stackoverflow.com/questions/45974514/serial-print-uint64-t-in-arduino
void print_uint64_t(uint64_t num) {
  char rev[128];
  char *p = rev+1;

  while (num > 0) {
    *p++ = '0' + ( num % 10);
    num/= 10;
  }
  p--;
  /*Print the number which is now in reverse*/
  while (p > rev) {
    Serial.print(*p--);
  }
}

// Time conversion
long microsToMinutes(uint64_t input) { return input / 60000000; }
long microsToHours(uint64_t input) { return input / 3600000000; }
long millisToMinutes(uint64_t input) { return input / 60000; }
long minutesToMillis(int input) { return input * 60000; }
long hoursToMillis(int input) { return input * 3600000; }
uint64_t hoursToMicros(int input) { return input * 3600000000; }
uint64_t minutesToMicros(int input) { return input * 6000000; } // Doesn't actually convert to microseconds, but nothing works and i hate everything..

// Intervals and time keeping
unsigned long previousMillisLogInterval = 0;
unsigned long previousMillisHeartbeat = 0;
const long heartbeatInterval = minutesToMillis(HEARTBEAT_FREQUENCY_MINUTES);
const long logInterval = minutesToMillis(LOG_INTERVAL_MINUTES);
const long firstRunThreshold = minutesToMillis(FIRST_RUN_THRESHOLD_MINUTES);
const uint64_t deepSleepDuration = minutesToMicros(DEEP_SLEEP_DURATION_MINUTES) * 10;
const long deepSleepMathTest = microsToHours(deepSleepDuration);

// WiFi jank
int wifiFailCount = 0;
int maxWiFiFailCount = 25; // Arbitrary "it has probably failed by now"-count

// Deep sleep
bool doSleep = true;

// Comment "#define DEBUG" for production
// #define DEBUG

// Debug functions
#ifdef DEBUG
  #define DEBUG_PRINT(x) Serial.print (x);
  #define DEBUG_PRINTLN(x) Serial.println (x);
#else
  #define DEBUG_PRINT(x) Telnet.print(x);
  #define DEBUG_PRINTLN(x) Telnet.println(x);
#endif

// Setup Telnet server
WiFiServer TelnetServer(23);
WiFiClient Telnet;

// Setup MQTT connection
WiFiClient espClient;
PubSubClient client(MQTT_SERVER, MQTT_PORT, espClient);

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

  // Debug status
  Serial.print("DEBUG MODE: ");
  #ifdef DEBUG
    Serial.println("ACTIVE");
  #else
    Serial.println("INACTIVE");
  #endif

  // Deep sleep status
  Serial.print("DEEP SLEEP: ");
  doSleep ? Serial.println("ACTIVE") : Serial.println("INACTIVE");

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

  // Setup MQTT
  Serial.println();
  Serial.println("Attempting MQTT connection");
  while (!client.connected()) {
    delay(500);
    Serial.print(".");

    if (client.connect(DEVICE_NAME, MQTT_USER, MQTT_PASSWORD)) {
      Serial.println();
      Serial.print("Connected to: ");
      Serial.println(MQTT_SERVER);

    } else {
      Serial.print("Failed:");
      Serial.println(client.state());
      Serial.println("Retrying in 5 seconds");
      delay(5000);
    }
  }

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

  Serial.println();
  Serial.print("Measuring battery ");
  Serial.print(BATTERY_NAME);
  Serial.print(" (");
  Serial.print(BATTERY_ID);
  Serial.print(") ");
  Serial.print("every ");
  doSleep ? Serial.print(microsToMinutes(deepSleepDuration)) : Serial.print(millisToMinutes(logInterval));
  Serial.println(" minute(s).");
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
    // sendMeasurement(voltage_truncated);
    sendMeasurementMQTT(voltage_truncated);
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

void sendMeasurementMQTT(float measurement) {
  DEBUG_PRINTLN("sendMeasurementMQTT()");

  // Create JSON object
  const size_t CAPACITY = JSON_OBJECT_SIZE(3);
  StaticJsonDocument<CAPACITY> doc;

  // Populate JSON object
  doc["key"] = MQTT_KEY;
  doc["voltage"] = measurement;
  doc["batteryName"] = BATTERY_NAME;

  // Publish payload
  char payload[256];
  size_t payloadSize = serializeJson(doc, payload);

  if (client.publish(MQTT_TOPIC, payload, payloadSize)) {
    Serial.println("success");
  } else {
    Serial.println("fail");
  }
}

void sleepActions() {
  DEBUG_PRINTLN("sleepActions()");
  createMeasurement(true);

  DEBUG_PRINT("Going to sleep for ");
  DEBUG_PRINT(microsToMinutes(deepSleepDuration));
  DEBUG_PRINTLN(" minutes(s)");

  ESP.deepSleep(deepSleepDuration);
}

void loop(){
  // Something, something MQTT
  client.loop();

  // Time since boot
  unsigned long currentMillis = millis();

  // Wait for firstRunThreshold before doing any measurements
  if (currentMillis > firstRunThreshold && isFirstRun) {
    DEBUG_PRINTLN("First run");
    sendHeartbeat();
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
