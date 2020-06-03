import 'package:flutter/material.dart';
import 'package:js/js.dart' if (dart.library.io) 'dart:ffi';

class BatteryStatus extends StatelessWidget {
  final battery;

  BatteryStatus({Key key, @required this.battery}) : super(key: key);

  bool gteq(double source, double compareVal) {
    return source.compareTo(compareVal) >= 0;
  }

  int calcCharge(double voltage) {
    if (gteq(voltage, 12.73)) { return 100; }
    else if (gteq(voltage, 12.62)) { return 90; }
    else if (gteq(voltage, 12.50)) { return 80; }
    else if (gteq(voltage, 12.37)) { return 70; }
    else if (gteq(voltage, 12.24)) { return 60; }
    else if (gteq(voltage, 12.10)) { return 50; }
    else if (gteq(voltage, 11.96)) { return 40; }
    else if (gteq(voltage, 11.81)) { return 30; }
    else if (gteq(voltage, 11.66)) { return 20; }
    else if (gteq(voltage, 11.51)) { return 10; }
    else { return 0; }
  }

  Color setColor(double voltage) {
    if (gteq(voltage, 12.24)) {
      return Colors.green;
    } else if (gteq(voltage, 11.66)) {
      return Colors.yellow;
    } else {
      return Colors.red;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Column(
        children: <Widget>[
          ListTile(
            contentPadding: EdgeInsets.fromLTRB(8, 1, 0, 1),
            leading: 
              ConstrainedBox(
                constraints: BoxConstraints(
                  minWidth: 103 // Default width of 100% text
                ),
                child: Text(
                  '${calcCharge(battery['voltage'])}%',
                  textAlign: TextAlign.left,
                  style: TextStyle(fontSize: 40, color: setColor(battery['voltage'])),
                )
              ),
            title: Padding(padding: const EdgeInsets.only(bottom: 8), child: Text(battery['name'])),
            subtitle: Text('${battery['description']}\nCapacity: ${battery['capacity']} Ah, Voltage: ${battery['voltage']} V'),
            isThreeLine: true,
          )
        ],
      )
    );
  }
}