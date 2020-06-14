import 'dart:async';
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:http/http.dart' as http;

import 'package:app/models/battery.dart';
import 'package:app/settings/singleBatterySettings.dart';

class Settings extends StatefulWidget {
  @override
  _SettingsState createState() => _SettingsState();
}

class _SettingsState extends State<Settings> {
  final _formKey = GlobalKey<FormState>();
  final nameController = TextEditingController();
  final manufacturerController = TextEditingController();
  final modelController = TextEditingController();
  final latestVoltageController = TextEditingController();
  final capacityController = TextEditingController();

  @override
  void dispose() {
    nameController.dispose();
    manufacturerController.dispose();
    modelController.dispose();
    latestVoltageController.dispose();
    capacityController.dispose();
    super.dispose();
  }

  void _clearControllers() {
    nameController.clear();
    manufacturerController.clear();
    modelController.clear();
    latestVoltageController.clear();
    capacityController.clear();
  }

  Future<Map<String, dynamic>> createBattery(String newBatteryData) async {
    http.Response response = await http.post(
      'http://localhost:3000/api/battery',
      headers: <String, String>{
        'Content-Type': 'application/json; charset=UTF-8',
      },
      body: newBatteryData,
    );

    if (response.statusCode == 201) {
      Map<String, dynamic> resp = jsonDecode(response.body);
      return {"data": resp, "status": "success"};
    } else {
      return {"data": response.body, "status": "error"};
    }
  }

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
                    showDialog(
                      context: context,
                      builder: (_) => new AlertDialog(
                        title: new Text("Add New Battery"),
                        content: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: <Widget>[
                            Form(
                              key: _formKey,
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: <Widget>[
                                  TextFormField(
                                    controller: nameController,
                                    decoration:
                                        InputDecoration(labelText: 'Name'),
                                    validator: (value) {
                                      if (value.isEmpty) {
                                        return 'Please enter a name';
                                      }
                                      return null;
                                    },
                                  ),
                                  TextFormField(
                                    controller: manufacturerController,
                                    decoration: InputDecoration(
                                        labelText: 'Manufacturer'),
                                    validator: (value) {
                                      if (value.isEmpty) {
                                        return 'Please enter a manufacturer';
                                      }
                                      return null;
                                    },
                                  ),
                                  TextFormField(
                                    controller: modelController,
                                    decoration:
                                        InputDecoration(labelText: 'Model'),
                                    validator: (value) {
                                      if (value.isEmpty) {
                                        return 'Please enter a model';
                                      }
                                      return null;
                                    },
                                  ),
                                  TextFormField(
                                    controller: latestVoltageController,
                                    decoration: InputDecoration(
                                        labelText: 'Latest Voltage (Volt)'),
                                    keyboardType: TextInputType.number,
                                    inputFormatters: <TextInputFormatter>[
                                      WhitelistingTextInputFormatter.digitsOnly
                                    ],
                                  ),
                                  TextFormField(
                                    controller: capacityController,
                                    decoration: InputDecoration(
                                        labelText: 'Capcacity (Ah)'),
                                    keyboardType: TextInputType.number,
                                    inputFormatters: <TextInputFormatter>[
                                      WhitelistingTextInputFormatter.digitsOnly
                                    ],
                                    validator: (value) {
                                      if (value.isEmpty) {
                                        return 'Please enter a capacity';
                                      }
                                      return null;
                                    },
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                        actions: <Widget>[
                          FlatButton(
                            child: Text('Save'),
                            onPressed: () {
                              if (_formKey.currentState.validate()) {
                                // Start loading

                                Map<String, dynamic> newBattery = {
                                  "name": nameController.text,
                                  "manufacturer": manufacturerController.text,
                                  "model": modelController.text,
                                  "capacity": double.tryParse(
                                          capacityController.text) ??
                                      capacityController.text,
                                  "latestVoltage": double.tryParse(
                                          latestVoltageController.text) ??
                                      0,
                                };

                                String newBatteryJSON = jsonEncode(newBattery);

                                createBattery(newBatteryJSON).then(
                                  (response) {
                                    if (response['status'] == 'success') {
                                      Scaffold.of(context).showSnackBar(
                                        SnackBar(
                                          content: RichText(
                                            text: TextSpan(
                                              text:
                                                  'Successfully created battery: ',
                                              style: TextStyle(
                                                  color: Colors.white),
                                              children: <TextSpan>[
                                                TextSpan(
                                                  text: response['data']
                                                      ['name'],
                                                  style: TextStyle(
                                                    fontWeight: FontWeight.bold,
                                                    color: Colors.white,
                                                  ),
                                                ),
                                              ],
                                            ),
                                          ),
                                        ),
                                      );

                                      Navigator.of(context).pop();
                                      _clearControllers();
                                    } else {
                                      // End Loading
                                      Scaffold.of(context).showSnackBar(
                                        SnackBar(
                                          content: RichText(
                                            text: TextSpan(
                                              text: 'Something went wrong: ',
                                              style: TextStyle(
                                                  color: Colors.white),
                                              children: <TextSpan>[
                                                TextSpan(
                                                  text: response['data'],
                                                  style: TextStyle(
                                                    fontWeight: FontWeight.bold,
                                                    color: Colors.white,
                                                  ),
                                                ),
                                              ],
                                            ),
                                          ),
                                        ),
                                      );
                                    }
                                  },
                                );
                              }
                            },
                          ),
                        ],
                      ),
                    );
                  },
                  child: Padding(
                    padding: const EdgeInsets.all(10.0),
                    child: Column(
                      children: <Widget>[
                        Text('Add New Battery'),
                        Padding(
                          padding: const EdgeInsets.only(top: 5.0),
                          child: Icon(Icons.add_circle),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
            ...batteries.map(
              (battery) {
                return SingleBatterySettings(
                  battery: battery,
                );
              },
            ).toList(),
          ],
        ),
      ),
    );
  }
}
