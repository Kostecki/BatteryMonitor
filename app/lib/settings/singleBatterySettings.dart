import 'dart:async';
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter/cupertino.dart';
import 'package:http/http.dart' as http;

import 'package:BatteryMonitor/app_config.dart';
import 'package:BatteryMonitor/models/battery.dart';
import 'package:BatteryMonitor/utils/helperFunctions.dart';

class SingleBatterySettings extends StatefulWidget {
  final Battery battery;
  SingleBatterySettings({Key key, @required this.battery}) : super(key: key);

  @override
  _SingleBatterySettingsState createState() => _SingleBatterySettingsState();
}

class _SingleBatterySettingsState extends State<SingleBatterySettings> {
  final _formKey = GlobalKey<FormState>();
  final nameController = TextEditingController();
  final manufacturerController = TextEditingController();
  final modelController = TextEditingController();
  final latestVoltageController = TextEditingController();
  final capacityController = TextEditingController();

  @override
  void initState() {
    super.initState();
    nameController.text = widget.battery.name;
    manufacturerController.text = widget.battery.manufacturer;
    modelController.text = widget.battery.model;
    latestVoltageController.text = widget.battery.voltage.toString();
    capacityController.text = widget.battery.capacity.toString();
  }

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

  Future<Map<String, dynamic>> updateBattery(String updatedBatteryData) async {
    var config = AppConfig.of(context);

    http.Response response = await http.put(
      '${config.apiBaseUrl}/battery',
      headers: <String, String>{
        'Content-Type': 'application/json; charset=UTF-8',
      },
      body: updatedBatteryData,
    );

    if (response.statusCode == 200) {
      Map<String, dynamic> resp = jsonDecode(response.body);
      return {"data": resp, "status": "success"};
    } else {
      return {"data": response.body, "status": "error"};
    }
  }

  Future<Map<String, dynamic>> deleteBattery(String batteryId) async {
    var config = AppConfig.of(context);

    http.Response response =
        await http.delete('${config.apiBaseUrl}/battery/$batteryId');

    if (response.statusCode == 204) {
      return {"data": 'OK', "status": "success"};
    } else {
      return {"data": response.body, "status": "error"};
    }
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Column(
        children: <Widget>[
          Padding(
            padding: EdgeInsets.symmetric(vertical: 5),
            child: ListTile(
              title: Text(
                  '${widget.battery.name} (${widget.battery.capacity} Ah)'),
              subtitle: RichText(
                text: TextSpan(
                  text:
                      '${widget.battery.manufacturer}, ${widget.battery.model} \n',
                  style: TextStyle(color: Colors.grey[600]),
                  children: <TextSpan>[
                    TextSpan(
                      text:
                          'Updated: ${HelperFunctions.convertTimestamp(widget.battery.updatedAt.seconds)}',
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
                      child: Icon(Icons.delete, size: 25.0),
                    ),
                    onTap: () {
                      showDialog(
                        context: context,
                        builder: (_) => CupertinoAlertDialog(
                          title: Text('Delete "${widget.battery.name}"?'),
                          content: Text('This action cannot be undone'),
                          actions: <Widget>[
                            CupertinoDialogAction(
                              isDefaultAction: true,
                              child: Text('Cancel'),
                              onPressed: () {
                                Navigator.of(context).pop();
                              },
                            ),
                            CupertinoDialogAction(
                              isDestructiveAction: true,
                              child: Text(
                                'Delete',
                              ),
                              onPressed: () {
                                deleteBattery(widget.battery.id).then(
                                  (response) {
                                    if (response['status'] == 'success') {
                                      Scaffold.of(context).showSnackBar(
                                        SnackBar(
                                          content: Text(
                                              'Successfully deleted battery'),
                                        ),
                                      );

                                      Navigator.of(context).pop();
                                    } else {
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
                              },
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                  InkWell(
                    customBorder: CircleBorder(),
                    child: Container(
                      padding: EdgeInsets.all(10.0),
                      child: Icon(
                        Icons.edit,
                        size: 25.0,
                      ),
                    ),
                    onTap: () {
                      showDialog(
                        context: context,
                        builder: (_) => new AlertDialog(
                          title: new Text('Editing: ${widget.battery.name}'),
                          scrollable: true,
                          content: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: <Widget>[
                              Form(
                                key: _formKey,
                                child: Column(
                                  children: <Widget>[
                                    TextFormField(
                                      controller:
                                          TextEditingController.fromValue(
                                        TextEditingValue(
                                          text: widget.battery.name,
                                        ),
                                      ),
                                      decoration: InputDecoration(
                                        labelText: 'Name',
                                      ),
                                      autocorrect: false,
                                      enableSuggestions: false,
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
                                        labelText: 'Manufacturer',
                                      ),
                                      autocorrect: false,
                                      enableSuggestions: false,
                                      validator: (value) {
                                        if (value.isEmpty) {
                                          return 'Please enter a manufacturer';
                                        }
                                        return null;
                                      },
                                    ),
                                    TextFormField(
                                      controller: modelController,
                                      decoration: InputDecoration(
                                        labelText: 'Model',
                                      ),
                                      autocorrect: false,
                                      enableSuggestions: false,
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
                                        labelText: 'Latest Voltage',
                                        suffixText: 'Volt',
                                      ),
                                      keyboardType:
                                          TextInputType.numberWithOptions(
                                        decimal: true,
                                      ),
                                    ),
                                    TextFormField(
                                      controller: capacityController,
                                      decoration: InputDecoration(
                                        labelText: 'Capcacity',
                                        suffixText: 'Ah',
                                      ),
                                      keyboardType:
                                          TextInputType.numberWithOptions(
                                        decimal: true,
                                      ),
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
                            CupertinoButton(
                              child: Text('Update'),
                              onPressed: () {
                                if (_formKey.currentState.validate()) {
                                  // Start loading

                                  // Handle comma instead of period for numbers
                                  String capacity = capacityController.text
                                      .replaceAll(",", ".");
                                  String latestVoltage = latestVoltageController
                                      .text
                                      .replaceAll(",", ".");

                                  Map<String, dynamic> newBattery = {
                                    "id": widget.battery.id,
                                    "name": nameController.text,
                                    "manufacturer": manufacturerController.text,
                                    "model": modelController.text,
                                    "capacity":
                                        double.tryParse(capacity) ?? capacity,
                                    "latestVoltage":
                                        double.tryParse(latestVoltage) ?? 0,
                                  };

                                  String newBatteryJSON =
                                      jsonEncode(newBattery);

                                  updateBattery(newBatteryJSON).then(
                                    (response) {
                                      if (response['status'] == 'success') {
                                        // End loading

                                        Scaffold.of(context).showSnackBar(
                                          SnackBar(
                                            content: RichText(
                                              text: TextSpan(
                                                text:
                                                    'Successfully updated battery: ',
                                                style: TextStyle(
                                                  color: Colors.white,
                                                ),
                                                children: <TextSpan>[
                                                  TextSpan(
                                                    text: response['data']
                                                        ['name'],
                                                    style: TextStyle(
                                                      fontWeight:
                                                          FontWeight.bold,
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
                                        // End loading
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
                                                      fontWeight:
                                                          FontWeight.bold,
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
