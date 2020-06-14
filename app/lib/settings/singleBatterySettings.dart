import 'package:flutter/material.dart';

import 'package:app/models/battery.dart';
import 'package:app/utils/helperFunctions.dart';

class SingleBatterySettings extends StatelessWidget {
  final Battery battery;
  SingleBatterySettings({@required this.battery});

  void deleteBattery(batteryID) {
    // TODO: Open modal(?) to edit battery
    // SimpleDialog https://api.flutter.dev/flutter/material/SimpleDialog-class.html
    print('Delete' + ' ' + batteryID);
  }

  void editBattery(batteryID) {
    // TODO: Open modal(?) to edit battery
    // SimpleDialog https://api.flutter.dev/flutter/material/SimpleDialog-class.html
    print('Edit' + ' ' + batteryID);
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Column(
        children: <Widget>[
          Padding(
            padding: EdgeInsets.symmetric(vertical: 5),
            child: ListTile(
              title: Text('${battery.name} (${battery.capacity} Ah)'),
              subtitle: RichText(
                text: TextSpan(
                  text: '${battery.manufacturer}, ${battery.model} \n',
                  style: TextStyle(color: Colors.grey[600]),
                  children: <TextSpan>[
                    TextSpan(
                      text:
                          'Updated: ${HelperFunctions.convertTimestamp(battery.updatedAt.seconds)}',
                      style: TextStyle(fontStyle: FontStyle.italic),
                    )
                  ],
                ),
              ),
              trailing: Row(
                mainAxisSize: MainAxisSize.min,
                children: <Widget>[
                  InkWell(
                    customBorder: CircleBorder(),
                    child: Container(
                      padding: EdgeInsets.all(10.0),
                      child: const Icon(
                        Icons.edit,
                        size: 25.0,
                      ),
                    ),
                    onTap: () => editBattery(battery.id),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
