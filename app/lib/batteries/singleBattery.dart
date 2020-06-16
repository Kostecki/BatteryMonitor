import 'package:flutter/material.dart';

import 'package:app/models/battery.dart';
import 'package:app/utils/helperFunctions.dart';

class SingleBattery extends StatelessWidget {
  final Battery battery;
  SingleBattery({@required this.battery});

  BoxDecoration notificationStatusBorder() {
    print(battery.notificationsSent);

    return BoxDecoration(
      border: Border(
        right: BorderSide(
          color:
              HelperFunctions.setNotificationStatus(battery.notificationsSent),
          width: 5.0,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: <Widget>[
          Container(
            decoration: notificationStatusBorder(),
            child: ListTile(
              leading: ConstrainedBox(
                constraints: BoxConstraints(
                  minWidth: 105,
                ),
                child: Padding(
                  padding: EdgeInsets.only(top: 5.0, bottom: 5.0),
                  child: Text(
                    '${HelperFunctions.calcBatteryCharge(battery.voltage)}%',
                    style: TextStyle(
                      fontSize: 40,
                      color: HelperFunctions.setChargeColor(battery.voltage),
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
                  '${battery.manufacturer}, ${battery.model}\nVoltage: ${battery.voltage} Volt',
                ),
              ),
              isThreeLine: true,
            ),
          ),
        ],
      ),
    );
  }
}
