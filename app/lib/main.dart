import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'package:app/app_config.dart';
import 'package:app/services/database.dart';
import 'package:app/models/battery.dart';

import './batteries/batteryList.dart';
import './settings/settings.dart';

class BatteryMonitor extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    // Environment specific configuration
    var config = AppConfig.of(context);

    return MaterialApp(
      title: config.appName,
      theme: ThemeData(primaryColor: Colors.orangeAccent[700]),
      home: BatteryMonitorStatefulWidget(),
    );
  }
}

class BatteryMonitorStatefulWidget extends StatefulWidget {
  BatteryMonitorStatefulWidget({Key key}) : super(key: key);

  @override
  _BatteryMonitorState createState() => _BatteryMonitorState();
}

class _BatteryMonitorState extends State<BatteryMonitorStatefulWidget> {
  int _selectedIndex = 0;

  void _onItemTapped(int index) {
    setState(() {
      _selectedIndex = index;
    });
  }

  static List<Widget> _widgetSelector = <Widget>[
    BatteryList(),
    Settings(),
  ];

  @override
  Widget build(BuildContext context) {
    var config = AppConfig.of(context);

    return StreamProvider<List<Battery>>.value(
      value: DatabaseService().batteries,
      child: Scaffold(
        backgroundColor: Colors.grey[200],
        appBar: AppBar(
          title: Text(config.appName),
          centerTitle: true,
          backgroundColor: Colors.orangeAccent[700],
          elevation: 2,
        ),
        body: Padding(
          padding: EdgeInsets.all(5.0),
          child: _widgetSelector[_selectedIndex],
        ),
        bottomNavigationBar: BottomNavigationBar(
          items: const <BottomNavigationBarItem>[
            BottomNavigationBarItem(
              icon: Icon(Icons.battery_charging_full),
              title: Text('Batteries'),
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.settings),
              title: Text('Settings'),
            ),
          ],
          currentIndex: _selectedIndex,
          selectedItemColor: Colors.orange[800],
          onTap: _onItemTapped,
        ),
      ),
    );
  }
}
