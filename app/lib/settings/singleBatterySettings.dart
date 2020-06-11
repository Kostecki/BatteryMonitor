import 'package:flutter/material.dart';

import 'package:app/models/battery.dart';
import 'package:app/utils/helperFunctions.dart';

class SingleBatterySettings extends StatelessWidget {
  final Battery battery;
  SingleBatterySettings({@required this.battery});

  void editBattery(batteryID) {
    // TODO: Open modal(?) to edit battery
    print('Clicked' + ' ' + batteryID);
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
              trailing: IconButton(
                icon: Icon(Icons.edit),
                onPressed: () => editBattery(battery.id),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
