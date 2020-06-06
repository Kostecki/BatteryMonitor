import 'package:flutter/material.dart';
import 'package:app/models/battery.dart';

class SingleBattery extends StatelessWidget {
  final Battery battery;
  SingleBattery({@required this.battery});

  num calcCharge(num voltage) {
    if (voltage >= 12.73) {
      return 100;
    } else if (voltage >= 12.62) {
      return 90;
    } else if (voltage >= 12.50) {
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

  Color setColor(num voltage) {
    if (voltage >= 12.24) {
      return Colors.green;
    } else if (voltage > 11.66) {
      return Colors.yellowAccent[700];
    } else {
      return Colors.red;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: <Widget>[
          ListTile(
            leading: ConstrainedBox(
              constraints: BoxConstraints(
                minWidth: 105,
              ),
              child: Padding(
                padding: EdgeInsets.only(top: 5.0, bottom: 5.0),
                child: Text(
                  '${calcCharge(battery.voltage)}%',
                  style: TextStyle(
                    fontSize: 40,
                    color: setColor(battery.voltage),
                  ),
                ),
              ),
            ),
            title: Padding(
              padding: EdgeInsets.symmetric(horizontal: 0, vertical: 5),
              child: Text(
                '${battery.name} (${battery.capacity} Ah)',
              ),
            ),
            subtitle: Padding(
              padding: EdgeInsets.only(top: 5.0, bottom: 5.0),
              child: Text(
                '${battery.manufacturer}, ${battery.model}\nVoltage: ${battery.voltage} V',
              ),
            ),
            isThreeLine: true,
          ),
        ],
      ),
    );
  }
}
