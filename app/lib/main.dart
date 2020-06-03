import 'package:flutter/material.dart';

import './batteryStatus.dart';

Future<void> main() async {
  runApp(BatteryMonitor());
}

class BatteryMonitor extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Battery Monitor',
      theme: ThemeData(
        primarySwatch: Colors.blue,
        visualDensity: VisualDensity.adaptivePlatformDensity,
      ),
      home: BatteryMonitorHome(),
    );
  }
}

class BatteryMonitorHome extends StatelessWidget {
  final batteries = [
    {
      'id': 1,
      'name': 'Lightning Goose',
      'description': 'Volvo, Heavy Duty Extra II',
      'capacity': 225,
      'voltage': 12.73
    },
    {
      'id': 2,
      'name': 'Current Swallow',
      'description': 'Volvo, Heavy Duty Extra II',
      'capacity': 225,
      'voltage': 12.62
    },
    {
      'id': 3,
      'name': 'Charge Dove',
      'description': 'Sonnenschein, GF 12 65 Y',
      'capacity': 75,
      'voltage': 12.50
    },
    {
      'id': 4,
      'name': 'Electric Chicken',
      'description': 'Sonnenschein, GF 12 65 Y',
      'capacity': 75,
      'voltage': 12.37
    },
    {
      'id': 5,
      'name': 'Cloud Raven',
      'description': 'Sonnenschein, GF 12 105 V',
      'capacity': 120,
      'voltage': 12.24
    },
    {
      'id': 6,
      'name': 'Power Pelican',
      'description': 'Varta, LFD230',
      'capacity': 230,
      'voltage': 12.10
    },
    {
      'id': 6,
      'name': 'Storm Gobbler',
      'description': 'Varta, K10',
      'capacity': 140,
      'voltage': 11.96
    },
    {
      'id': 7,
      'name': 'Thunder Duck',
      'description': '?',
      'capacity': 7.2,
      'voltage': 11.81
    }
  ];

  Future<void> refresh() async{
    print('refreshing stocks...');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(),
      body: Center(
        child: Column(
          children: <Widget>[
            Expanded(
              child: RefreshIndicator(
                child: ListView(
                  children: <Widget>[
                    ...batteries.map((battery) {
                      return BatteryStatus(battery: battery,);
                    }).toList()
                  ],
                ),
                onRefresh: refresh,
              )
            )
          ],
        ),
      ),
    );
  }
}
