import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'package:app/models/battery.dart';

import 'package:app/settings/singleBatterySettings.dart';

class Settings extends StatefulWidget {
  @override
  _SettingsState createState() => _SettingsState();
}

class _SettingsState extends State<Settings> {
  @override
  Widget build(BuildContext context) {
    var batteries = Provider.of<List<Battery>>(context) ?? [];
    batteries.sort((a, b) => a.name.compareTo((b.name)));

    return Padding(
      padding: EdgeInsets.all(5),
      child: Container(
        child: ListView(
          children: <Widget>[
            Align(
              alignment: Alignment.topLeft,
              child: Text(
                'Batteries',
                textAlign: TextAlign.right,
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 30,
                ),
              ),
            ),
            Padding(
              padding: EdgeInsets.only(top: 5, bottom: 10),
              child: Divider(
                color: Colors.grey,
                height: 1,
                thickness: 0.3,
              ),
            ),
            Padding(
              padding: EdgeInsets.only(bottom: 15.0),
              child: Card(
                child: InkWell(
                  onTap: () {
                    // TODO: Modal for adding new battery
                    print('tapped');
                  },
                  child: Padding(
                    padding: const EdgeInsets.all(10.0),
                    child: Column(
                      children: <Widget>[
                        Text('Add New Battery'),
                        Padding(
                          padding: const EdgeInsets.only(top: 5.0),
                          child: Icon(Icons.add_circle),
                        )
                      ],
                    ),
                  ),
                ),
              ),
            ),
            ...batteries.map((battery) {
              return SingleBatterySettings(
                battery: battery,
              );
            }).toList()
          ],
        ),
      ),
    );
  }
}
