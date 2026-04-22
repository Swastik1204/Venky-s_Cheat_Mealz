import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../models/admin_user.dart';
import '../models/order.dart';
import '../services/firestore_service.dart';

class DeliveryScreen extends StatelessWidget {
  final AdminUser adminUser;

  const DeliveryScreen({super.key, required this.adminUser});

  @override
  Widget build(BuildContext context) {
    final fs = FirestoreService();
    return StreamBuilder<List<Order>>(
      stream: fs.activeOrdersStream(adminUser.uid, adminUser.role),
      builder: (context, snapshot) {
        if (!snapshot.hasData) {
          return const Center(child: CircularProgressIndicator());
        }

        final deliveryOrders = snapshot.data!.where((o) => o.orderType == 'delivery').toList();
        if (deliveryOrders.isEmpty) {
          return const Center(
            child: Text('No active deliveries', style: TextStyle(color: Colors.white54)),
          );
        }

        return ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: deliveryOrders.length,
          itemBuilder: (_, i) {
            final order = deliveryOrders[i];
            final address = order.customer?['address'];
            String? mapUrl = order.mapUrl;
            if (mapUrl == null && address is Map) {
              final lat = address['lat'];
              final lng = address['lng'];
              if (lat != null && lng != null) {
                mapUrl = 'https://www.google.com/maps?q=$lat,$lng';
              }
            }

            return Container(
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFF16213E),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.purple.withValues(alpha: 0.3)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    order.identifier,
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                    ),
                  ),
                  Text(order.customer?['name']?.toString() ?? '—', style: const TextStyle(color: Colors.white70)),
                  Text(order.customer?['phone']?.toString() ?? '—', style: const TextStyle(color: Colors.white54, fontSize: 12)),
                  if (mapUrl != null) ...[
                    const SizedBox(height: 12),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        onPressed: () async {
                          final url = Uri.parse(mapUrl!);
                          if (await canLaunchUrl(url)) {
                            await launchUrl(url);
                          }
                        },
                        icon: const Icon(Icons.navigation),
                        label: const Text('Open in Maps'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.purple,
                          foregroundColor: Colors.white,
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            );
          },
        );
      },
    );
  }
}
