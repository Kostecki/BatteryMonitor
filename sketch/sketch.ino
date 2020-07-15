#include "config.h";
#include "ntp_time.h";

#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClientSecureBearSSL.h>
#include <time.h>
#include <ArduinoOTA.h>
#include <ArduinoJson.h>
#include <RunningMedian.h>

// Voltage measurements
int raw_analog_value = 0;
float voltage = 0.0;

// Warning-LED Status
bool warningLED = false;

// Logging-interval time keeping
unsigned long previousMillis = 0;
const long logInterval = LOG_INTERVAL_HOURS * 3600000; // Convert hours (from logIntervalHours) to milliseconds

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

void loop(){
    ArduinoOTA.handle();

    // Turn on red "warning led" if voltage is less than 20%
    if (warningLED) {
      digitalWrite(LED_PIN, HIGH);
    }

    // Measure voltage every 6 (logInterval) hours
    unsigned long currentMillis = millis();
    if (currentMillis - previousMillis >= logInterval) {
      previousMillis = currentMillis;
      createMeasurement();
    }
}

// Measure voltage of connected battery
float createMeasurement() {
  // Sample battery voltage 100 times and get median value
  RunningMedian samples = RunningMedian(100);
  for (int i = 0; i < 100; i++) {
    raw_analog_value = analogRead(VOLTAGE_INPUT_PIN);
    voltage = raw_analog_value * 0.01243;  
    samples.add(voltage);
  }

  // Set status-LED.. status
  if (voltage < WARNING_VOLTAGE) {
    warningLED = true;
  } else {
    warningLED = false;
  }
  
  sendMeasurement(voltage);
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
  if (https.begin(*client, API_URL)) {
    https.POST(json);
    https.end();
  }
}