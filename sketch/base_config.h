// API
const char* API_URL_HEARTBEAT = "https://battery.israndom.win/api/heartbeat";
const char* API_URL_MEASUREMENT = "https://battery.israndom.win/api/measurement";

// WIFI
const char* WIFI_SSID = "Legacy";
const char* WIFI_PASSWORD = "Malibu56";

// OTA (OTA_NAME in board-config-file)
int OTA_PORT = 8266;
const char* OTA_PASSWORD = "met75afx"; 

// Hardware setup
const int LED_PIN = D5;

// ADC
float ADC_RESOLUTION = 0.003;

// Voltage of battery at 20%
// For Warning-LED
const int WARNING_VOLTAGE = 11.66;

// Time Config
const int sleepMinutes = 5;
const int DEEP_SLEEP_DURATION_HOURS = 3; // Time to deep sleep before waking up. Max sleep time is about 3,5 hours (https://thingpulse.com/max-deep-sleep-for-esp8266/)
const int HEARTBEAT_FREQUENCY_MINUTES = 60; // Frequency of heartbeats sent to API
const int FIRST_RUN_THRESHOLD_MINUTES = 10; // Threshold after power on to initiate first measurement (without post to API)
const int LOG_INTERVAL_HOURS = 3; // Hours between measurements