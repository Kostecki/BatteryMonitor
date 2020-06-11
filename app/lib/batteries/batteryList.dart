import 'package:flutter/material.dart';

import 'package:provider/provider.dart';
import 'package:app/models/battery.dart';

import 'package:app/batteries/singleBattery.dart';

class BatteryList extends StatefulWidget {
  @override
  _BatteryListState createState() => _BatteryListState();
}

class _BatteryListState extends State<BatteryList> {
  @override
  Widget build(BuildContext context) {
    var batteries = Provider.of<List<Battery>>(context) ?? [];
    batteries.sort((a, b) => a.voltage.compareTo(b.voltage));

    return ListView(
      children: <Widget>[
        ...batteries.map((battery) {
          return SingleBattery(
            battery: battery,
          );
        }).toList()
      ],
    );
  }
}
