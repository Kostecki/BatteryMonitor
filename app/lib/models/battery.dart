import 'package:cloud_firestore/cloud_firestore.dart';

class Battery {
  final String id;
  final String name;
  final String manufacturer;
  final String model;
  final num capacity;
  final num voltage;
  final Timestamp updatedAt;
  final Map<String, dynamic> notificationsSent;

  Battery({
    this.id,
    this.name,
    this.manufacturer,
    this.model,
    this.capacity,
    this.voltage,
    this.updatedAt,
    this.notificationsSent,
  });

  Map<String, dynamic> toJson() {
    return {
      "id": this.id,
      "name": this.name,
      "manufacturer": this.manufacturer,
      "model": this.model,
      "latestVoltage": this.voltage,
      "capacity": this.capacity
    };
  }
}
