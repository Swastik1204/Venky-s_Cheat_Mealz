import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart';
import 'package:google_sign_in/google_sign_in.dart';

import '../models/admin_user.dart';

class AuthService {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final GoogleSignIn _googleSignIn = GoogleSignIn(scopes: const ['email']);
  final FirebaseFirestore _db = FirebaseFirestore.instance;

  Stream<User?> get authStateChanges => _auth.authStateChanges();

  String _normalizeEmail(String? value) {
    return (value ?? '').trim().toLowerCase();
  }

  Future<AdminUser?> getAdminUser(String uid) async {
    final user = _auth.currentUser;
    final email = _normalizeEmail(user?.email);



    try {

      final doc = await _db.collection('adminUsers').doc(uid).get();

      if (doc.exists && doc.data() != null) {
        final data = doc.data()!;
        if (data['status'] == 'active') {
          final adminUser = AdminUser.fromFirestore(data, uid);

          return adminUser;
        } else {

        }
      }
    } catch (e) {
      debugPrint('[AuthService] adminUsers check failed: $e');
    }

    try {

      if (email.isNotEmpty) {
        final roleDoc = await _db.collection('roles').doc(email).get();

        if (roleDoc.exists && roleDoc.data() != null) {
          final data = roleDoc.data()!;
          final adminUser = AdminUser(
            uid: uid,
            email: email,
            displayName: user?.displayName ?? '',
            role: (data['role'] ?? 'staff').toString(),
            pages: _pagesFrom(data['pages']),
            status: 'active',
          );

          return adminUser;
        }
      } else {

      }
    } catch (e) {
      debugPrint('[AuthService] roles check failed: $e');
    }


    if (email == 'swastiksaha1204@gmail.com') {

      return AdminUser(
        uid: uid,
        email: email,
        displayName: user?.displayName ?? 'Super Admin',
        role: 'admin',
        pages: {
          'biller': true,
          'orders': true,
          'inventory': true,
          'analytics': true,
          'settings': true,
          'appearance': true,
          'delivery': true,
          'cashManager': true,
          'orderMessenger': true,
        },
        status: 'active',
      );
    }


    return null;
  }

  Map<String, bool> _pagesFrom(dynamic raw) {
    final result = <String, bool>{};
    if (raw is Map) {
      raw.forEach((key, value) {
        result[key.toString()] = value == true;
      });
    }
    return result;
  }

  Future<User?> signInWithGoogle() async {
    try {

      final googleUser = await _googleSignIn.signIn();


      if (googleUser == null) {

        return null;
      }


      final googleAuth = await googleUser.authentication;


      final credential = GoogleAuthProvider.credential(
        accessToken: googleAuth.accessToken,
        idToken: googleAuth.idToken,
      );


      final userCredential = await _auth.signInWithCredential(credential);
      final user = userCredential.user;


      if (user != null) {

        final adminUser = await getAdminUser(user.uid);

        if (adminUser == null) {

        }
      }

      return user;
    } catch (e) {


      rethrow;
    }
  }

  Future<void> signOut() async {
    await _auth.signOut();
    await _googleSignIn.signOut();
  }
}
