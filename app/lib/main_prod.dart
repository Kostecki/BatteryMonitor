import 'package:app/app_config.dart';
import 'package:app/main.dart';
import 'package:flutter/material.dart';

void main() {
  var configuredApp = new AppConfig(
    appName: 'Battery Monitor',
    flavorName: 'production',
    apiBaseUrl: 'https://battery.israndom.win/api',
    child: new BatteryMonitor(),
  );

  runApp(configuredApp);
}
