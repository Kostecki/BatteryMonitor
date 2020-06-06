import 'package:flutter/material.dart';
import 'package:js/js.dart' if (dart.library.io) 'dart:ffi';
import 'package:progress_indicators/progress_indicators.dart';

import 'package:app/singleBattery.dart';
import 'package:provider/provider.dart';
import 'package:app/models/battery.dart';

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
        // JumpingDotsProgressIndicator(
        //   fontSize: 20.0,
        // ),
        ...batteries.map((battery) {
          return SingleBattery(
            battery: battery,
          );
        }).toList()
      ],
    );
  }
}
