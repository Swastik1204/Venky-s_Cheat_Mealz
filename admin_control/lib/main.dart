import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';

import 'screens/access_denied_screen.dart';
import 'screens/home_screen.dart';
import 'screens/login_screen.dart';
import 'services/auth_service.dart';
import 'services/notification_service.dart';

@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  await NotificationService.initialize();

  final data = message.data;
  if (data['type'] == 'new_order') {
    await NotificationService.showNewOrderAlert(
      orderNo: data['orderNo'] ?? '',
      customerName: data['customerName'] ?? 'Customer',
      total: '₹${data['total'] ?? ''}',
      isCritical: data['isDineInCod'] == 'true',
    );
  }
}

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();
  FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);
  await NotificationService.initialize();

  // Handle FCM when app is in foreground
  FirebaseMessaging.onMessage.listen((RemoteMessage message) {
    final data = message.data;
    if (data['type'] == 'new_order') {
      NotificationService.showNewOrderAlert(
        orderNo: data['orderNo'] ?? '',
        customerName: data['customerName'] ?? 'Customer',
        total: '₹${data['total'] ?? ''}',
        isCritical: data['isDineInCod'] == 'true',
      );
    }
  });

  // Handle FCM when app is opened from background notification
  FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
    // App was opened from notification — the stream listener will handle UI update

  });

  // Request notification permission
  await FirebaseMessaging.instance.requestPermission(
    alert: true,
    sound: true,
    badge: true,
  );

  runApp(const VenkysAdminApp());
}

class VenkysAdminApp extends StatelessWidget {
  const VenkysAdminApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: "Venky's Admin",
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: const ColorScheme.dark(
          primary: Color(0xFFFACC15),
          surface: Color(0xFF16213E),
        ),
        scaffoldBackgroundColor: const Color(0xFF1A1A2E),
        useMaterial3: true,
      ),
      home: const AuthWrapper(),
    );
  }
}

class AuthWrapper extends StatefulWidget {
  const AuthWrapper({super.key});

  @override
  State<AuthWrapper> createState() => _AuthWrapperState();
}

class _AuthWrapperState extends State<AuthWrapper> {
  final AuthService _auth = AuthService();

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<User?>(
      stream: _auth.authStateChanges,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Scaffold(
            body: Center(
              child: CircularProgressIndicator(color: Color(0xFFFACC15)),
            ),
          );
        }

        if (snapshot.hasData && snapshot.data != null) {
          return FutureBuilder(
            future: _auth.getAdminUser(snapshot.data!.uid),
            builder: (context, adminSnapshot) {
              if (adminSnapshot.connectionState == ConnectionState.waiting) {
                return const Scaffold(
                  body: Center(
                    child: CircularProgressIndicator(color: Color(0xFFFACC15)),
                  ),
                );
              }

              if (adminSnapshot.hasData && adminSnapshot.data != null) {
                return HomeScreen(adminUser: adminSnapshot.data!);
              }

              return AccessDeniedScreen(email: snapshot.data?.email);
            },
          );
        }

        return const LoginScreen();
      },
    );
  }
}
