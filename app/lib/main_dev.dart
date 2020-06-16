import 'package:app/app_config.dart';
import 'package:app/main.dart';
import 'package:flutter/material.dart';

void main() {
  var configuredApp = new AppConfig(
    appName: 'Battery Monitor (DEV)',
    flavorName: 'development',
    apiBaseUrl: 'http://localhost:3000/api',
    child: new BatteryMonitor(),
  );

  runApp(configuredApp);
}
