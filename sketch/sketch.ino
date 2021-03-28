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

// Setup MQTT connection
WiFiClient espClient;
PubSubClient client(espClient);

// Setup Telnet server
WiFiServer TelnetServer(23);
WiFiClient Telnet;

void blinkBuiltinLED(String mode) {
  int blinks = 0;
  if (mode == "wifi") {
    blinks = 3;
  } else if (mode == "mqtt") {
    blinks = 4;
  } else if (mode == "fail") {
    blinks = 10;
  }

  digitalWrite(LED_BUILTIN, HIGH);
  delay(3000);

  for (int i = 0; i < blinks; i++) {
    digitalWrite(LED_BUILTIN, LOW);
    delay(1000);
    digitalWrite(LED_BUILTIN, HIGH);
    delay(1000);
  }
}

void setupWiFi() {
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  blinkBuiltinLED("wifi");
  Serial.println();
  Serial.println("Connected to WiFi");
  Serial.print("SSID: ");
  Serial.println(WIFI_SSID);
  Serial.print("IP: ");
  Serial.println(WiFi.localIP());
}

void setupMQTT() {
  client.setServer(MQTT_SERVER, 1883);

  while (!client.connected()) {
    if (client.connect(DEVICE_NAME, MQTT_USER, MQTT_PASSWORD)) {
      blinkBuiltinLED("mqtt");
      Serial.print("Connected to: ");
      Serial.println(MQTT_SERVER);
    } else {
      blinkBuiltinLED("fail");
      Serial.print("MQTT connection failed with state: ");
      Serial.println(client.state());
      delay(2000);
    }
  }
}

void setupTelnet() {
  if (TelnetServer.hasClient()) {
    if (!Telnet || !Telnet.connected()) {
      if (Telnet) Telnet.stop();
      Telnet = TelnetServer.available();
    } else {
      TelnetServer.available().stop();
    }
  }
}

void setupOTA() {
  ArduinoOTA.setPort(OTA_PORT);
  ArduinoOTA.setHostname(OTA_NAME);
  ArduinoOTA.setPassword(OTA_PASSWORD);
  ArduinoOTA.begin();
}

void setupADS() {
  ads.setGain(GAIN_TWOTHIRDS);  // 2/3x gain +/- 6.144V  1 bit = 3mV (default)
  ads.begin();
}

void sleep() {
  DEBUG_PRINTLN("sleep()");
  DEBUG_PRINT("Going to sleep for ");
  DEBUG_PRINT(microsToMinutes(deepSleepDuration));
  DEBUG_PRINTLN(" minutes(s)");

  // Problems with pubsubclient and deep sleep
  // https://github.com/knolleary/pubsubclient/issues/452
  client.disconnect(); 
  espClient.flush();
  while( client.state() != -1){  
    delay(10);
  }

  ESP.deepSleep(deepSleepDuration);
}

void setup() {
  // Setup pins
  pinMode(LED_PIN, OUTPUT);
  pinMode(LED_BUILTIN, OUTPUT);

  // Serial setup
  Serial.println("Setting up serial connection..");
  Serial.begin(9600);

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

  // Setup WiFi
  Serial.println("Connecting to WiFi..");
  setupWiFi();

  // Setup MQTT
  Serial.println("Connecting to MQTT..");
  setupMQTT();

  // Setup Telnet
  Serial.println("Setting up Telnet connection..");
  TelnetServer.begin();
  TelnetServer.setNoDelay(true);

  // Setup OTA
  Serial.println("Setting up OTA functionality..");
  setupOTA();

  // Setup ADS
  Serial.println("Setting up ADS..");
  setupADS();

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

// Measure voltage of connected battery
void createMeasurement(bool postToAPI = false) {
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
  if (postToAPI && voltage >= 1) {
    sendMeasurement(voltage_truncated);
  }
}

void sendMeasurement(float measurement) {
  DEBUG_PRINTLN("sendMeasurement()");

  // Create JSON object
  const size_t CAPACITY = JSON_OBJECT_SIZE(2);
  StaticJsonDocument<CAPACITY> doc;

  // Populate JSON object
  doc["key"] = MQTT_KEY;
  doc["voltage"] = measurement;

  // Publish payload
  char payload[256];
  size_t n = serializeJson(doc, payload);
  int payloadSize = static_cast<int>(n);

  // Create MQTT topic string
  char topic[sizeof(MQTT_TOPIC_BASE) + sizeof(MQTT_TOPIC)];
  strcpy(topic, MQTT_TOPIC_BASE);
  strcat(topic, MQTT_TOPIC);

  DEBUG_PRINTLN("MQTT Info:");
  DEBUG_PRINT("Topic: ");
  DEBUG_PRINTLN(topic);
  DEBUG_PRINT("Payload: ");
  DEBUG_PRINTLN(payload);
  DEBUG_PRINT("Payload size: ");
  DEBUG_PRINTLN(payloadSize);

  if (client.publish(topic, payload, payloadSize, false)) {
    DEBUG_PRINTLN("MQTT publish succeeded");
    
    if (doSleep) {
      sleep();
    }
  } else {
    DEBUG_PRINTLN("MQTT publish failed");
  }
}

void loop(){
  // Something, something MQTT
  client.loop();
  
  // Time since boot
  unsigned long currentMillis = millis();

  // Wait for firstRunThreshold before doing any measurements
  if (currentMillis > firstRunThreshold && isFirstRun) {
    DEBUG_PRINTLN("First run");
    isFirstRun = false;

    createMeasurement(true);
  }

  if (!doSleep) {
    setupTelnet();
    ArduinoOTA.handle();

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
