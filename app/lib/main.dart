import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'package:app/services/database.dart';
import 'package:app/models/battery.dart';

import './batteryList.dart';

void main() => runApp(MaterialApp(home: Home()));

class BatteryMonitor extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Battery Monitor',
      theme: ThemeData(primarySwatch: Colors.orangeAccent[700]),
      home: Home(),
    );
  }
}

class Home extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return StreamProvider<List<Battery>>.value(
      value: DatabaseService().batteries,
      child: Scaffold(
          backgroundColor: Colors.grey[200],
          appBar: AppBar(
            title: Text('Battery Monitor'),
            centerTitle: true,
            backgroundColor: Colors.orangeAccent[700],
            elevation: 2,
          ),
          body: Padding(
            padding: EdgeInsets.all(5.0),
            child: BatteryList(),
          )),
    );
  }
}
