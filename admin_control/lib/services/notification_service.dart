import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

class NotificationService {
  static final FlutterLocalNotificationsPlugin _plugin = FlutterLocalNotificationsPlugin();

  static const AndroidNotificationChannel _alertChannel = AndroidNotificationChannel(
    'venkys_alerts',
    'Venky\'s Alerts',
    description: 'Critical alerts for orders and payments',
    importance: Importance.max,
    playSound: true,
    enableVibration: true,
    enableLights: true,
  );

  static const AndroidNotificationChannel _orderChannel = AndroidNotificationChannel(
    'venkys_orders',
    'Order Notifications',
    description: 'New order notifications',
    importance: Importance.high,
    playSound: true,
  );

  static Future<void> initialize() async {
    const androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');
    const settings = InitializationSettings(android: androidSettings);
    await _plugin.initialize(settings);

    final androidPlugin = _plugin.resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>();
    await androidPlugin?.createNotificationChannel(_alertChannel);
    await androidPlugin?.createNotificationChannel(_orderChannel);

    await FirebaseMessaging.instance.setForegroundNotificationPresentationOptions(
      alert: true,
      badge: true,
      sound: true,
    );
  }

  static Future<void> showNewOrderAlert({
    required String orderNo,
    required String customerName,
    required String total,
    bool isCritical = false,
  }) async {
    final androidDetails = AndroidNotificationDetails(
      isCritical ? 'venkys_alerts' : 'venkys_orders',
      isCritical ? 'Venky\'s Alerts' : 'Order Notifications',
      channelDescription: isCritical
          ? 'Critical alerts for orders and payments'
          : 'New order notifications',
      importance: Importance.max,
      priority: Priority.max,
      fullScreenIntent: true,
      category: isCritical ? AndroidNotificationCategory.alarm : AndroidNotificationCategory.message,
      ticker: 'New Order',
      playSound: true,
      enableVibration: true,
      ongoing: isCritical,
      showWhen: true,
      when: DateTime.now().millisecondsSinceEpoch,
    );

    await _plugin.show(
      orderNo.hashCode,
      isCritical ? 'New Order Requires Payment' : 'New Order Received',
      '$customerName • $total',
      NotificationDetails(android: androidDetails),
    );
  }

  static Future<String?> getFCMToken() async {
    return FirebaseMessaging.instance.getToken();
  }

  static void handleFCMMessage(RemoteMessage message, Function(Map<String, dynamic>) onOrder) {
    final data = message.data;
    if (data['type'] == 'new_order') {
      onOrder(data);
    }
  }
}
