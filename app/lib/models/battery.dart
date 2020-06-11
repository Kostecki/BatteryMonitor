import 'package:cloud_firestore/cloud_firestore.dart';

class Battery {
  final String id;
  final String name;
  final String manufacturer;
  final String model;
  final num capacity;
  final num voltage;
  final Timestamp updatedAt;

  Battery({
    this.id,
    this.name,
    this.manufacturer,
    this.model,
    this.capacity,
    this.voltage,
    this.updatedAt,
  });
}
