import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

class HelperFunctions {
  static num calcBatteryCharge(num voltage) {
    if (voltage >= 12.73) {
      return 100;
    } else if (voltage >= 12.62) {
      return 90;
    } else if (voltage >= 12.60) {
      return 80;
    } else if (voltage >= 12.37) {
      return 70;
    } else if (voltage >= 12.24) {
      return 60;
    } else if (voltage >= 12.10) {
      return 50;
    } else if (voltage >= 11.96) {
      return 40;
    } else if (voltage >= 11.81) {
      return 30;
    } else if (voltage >= 11.66) {
      return 20;
    } else if (voltage >= 11.51) {
      return 10;
    } else {
      return 0;
    }
  }

  static Color setChargeColor(num voltage) {
    if (voltage >= 12.24) {
      return Colors.green;
    } else if (voltage > 11.66) {
      return Colors.yellowAccent[700];
    } else {
      return Colors.red;
    }
  }

  static String convertTimestamp(int timestampInSeconds,
      {String dateFormat = 'dd-MM-yyyy hh:mm'}) {
    final df = new DateFormat('dd-MM-yyyy hh:mm');
    return df.format(
        new DateTime.fromMillisecondsSinceEpoch(timestampInSeconds * 1000));
  }
}
