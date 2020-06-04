import 'package:cloud_firestore/cloud_firestore.dart';

import 'package:app/models/battery.dart';

class DatabaseService {
  // Collection reference
  final CollectionReference batteryCollection =
      Firestore.instance.collection('batteries');

  // Battery list from snapshot
  List<Battery> _batteryListFromSnapshot(QuerySnapshot snapshot) {
    return snapshot.documents.map((doc) {
      return Battery(
        name: doc.data['name'] ?? '',
        manufacturer: doc.data['manufacturer'] ?? '',
        model: doc.data['model'] ?? '',
        capacity: doc.data['capacity'] ?? 0,
        voltage: doc.data['voltage'] ?? 0,
      );
    }).toList();
  }

  // Get batteries stream
  Stream<List<Battery>> get batteries {
    return batteryCollection.snapshots().map(_batteryListFromSnapshot);
  }
}
