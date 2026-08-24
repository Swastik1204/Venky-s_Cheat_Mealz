import 'package:cloud_firestore/cloud_firestore.dart' hide Order;
import 'package:flutter/foundation.dart';

import '../models/order.dart';

class FirestoreService {
  final FirebaseFirestore _db = FirebaseFirestore.instance;

  Stream<List<Order>> activeOrdersStream(String userId, String role) {
    Query<Map<String, dynamic>> q = _db.collection('orders');
    if (role != 'admin' && userId.isNotEmpty) {
      // Firestore rules gate data for non-admin roles.
    }

    q = q
        .where('status', whereNotIn: ['delivered', 'rejected', 'cancelled', 'pending-payment'])
        .orderBy('status')
        .orderBy('createdAt', descending: true);

    return q.snapshots().map((snap) {
      return snap.docs.map((d) => Order.fromFirestore(d.data(), d.id)).toList(growable: false);
    });
  }

  Stream<List<Order>> cashManagerOrdersStream() {
    final q = _db
        .collection('orders')
        .where('orderType', isEqualTo: 'dine-in')
        .where('status', isEqualTo: 'placed')
        .where('cashManagerOtpVerified', isEqualTo: false)
        .orderBy('createdAt', descending: true);

    return q.snapshots().map((snap) {
      return snap.docs.map((d) => Order.fromFirestore(d.data(), d.id)).toList(growable: false);
    });
  }

  Stream<List<Order>> onlineOrdersStream() {
    final q = _db
        .collection('orders')
        .where('status', isEqualTo: 'placed')
        .orderBy('createdAt', descending: true);

    return q.snapshots().map((snap) {
      return snap.docs.map((d) => Order.fromFirestore(d.data(), d.id)).toList(growable: false);
    });
  }

  Future<void> verifyOtpAndAccept({
    required String orderId,
    required String verifiedBy,
  }) async {
    final now = DateTime.now().toIso8601String();
    await _db.collection('orders').doc(orderId).update({
      'status': 'preparing',
      'cashManagerOtpVerified': true,
      'cashManagerOtpVerifiedAt': now,
      'cashManagerOtpVerifiedBy': verifiedBy,
      'cashManagerOtp': FieldValue.delete(), // canonical: remove OTP after verification
      'payment.status': 'paid',
      'payment.collectedAt': now,
      'payment.collectedBy': verifiedBy,
      'updatedAt': FieldValue.serverTimestamp(),
    });
  }

  Future<void> setOrderOtp({
    required String orderId,
    required String otp,
  }) async {
    await _db.collection('orders').doc(orderId).update({
      'cashManagerOtp': otp,
      'cashManagerOtpGeneratedAt': FieldValue.serverTimestamp(),
      'updatedAt': FieldValue.serverTimestamp(),
    });
  }

  Future<void> saveFCMToken(String uid, String token, {String? email}) async {
    // Save to fcmTokens collection for push notification delivery
    try {
      await _db.collection('fcmTokens').doc(uid).set({
        'token': token,
        'uid': uid,
        'email': email,
        'updatedAt': FieldValue.serverTimestamp(),
      });

    } catch (e) {
      debugPrint('[FirestoreService] Failed to save FCM token: $e');
    }
  }
}
