import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:url_launcher/url_launcher.dart';

import '../models/admin_user.dart';
import '../models/order.dart';

class OrderMessengerScreen extends StatelessWidget {
  final List<Order> orders;
  final AdminUser adminUser;

  const OrderMessengerScreen({
    super.key,
    required this.orders,
    required this.adminUser,
  });

  String _buildOrderSummary(Order order) {
    final items = order.items.map((i) {
      if (i is Map) {
        return '${i['name']} x${i['qty']}';
      }
      return i.toString();
    }).join(', ');

    String addrStr = 'No address';
    final addr = order.customer?['address'];
    if (addr is Map) {
      final parts = [addr['line1'], addr['line2'], addr['city']]
          .where((s) => s != null && s.toString().isNotEmpty)
          .map((s) => s.toString())
          .toList();
      if (parts.isNotEmpty) addrStr = parts.join(', ');
    }

    return 'Order ${order.identifier}\n'
        'Items: $items\n'
        'Total: ₹${order.totalAmount.toStringAsFixed(0)}\n'
        'Address: $addrStr';
  }

  @override
  Widget build(BuildContext context) {
    if (orders.isEmpty) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.inbox, size: 64, color: Colors.white24),
            SizedBox(height: 16),
            Text('No new orders', style: TextStyle(color: Colors.white54)),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: orders.length,
      itemBuilder: (_, i) {
        final order = orders[i];
        final phone = order.customer?['phone']?.toString() ?? '';

        return Container(
          margin: const EdgeInsets.only(bottom: 16),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: const Color(0xFF16213E),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.blue.withValues(alpha: 0.3)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    order.identifier,
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                      fontSize: 18,
                    ),
                  ),
                  Text(
                    '₹${order.totalAmount.toStringAsFixed(0)}',
                    style: const TextStyle(color: Color(0xFFFACC15), fontWeight: FontWeight.bold),
                  ),
                ],
              ),
              const SizedBox(height: 4),
              Text(order.customer?['name']?.toString() ?? '—', style: const TextStyle(color: Colors.white70, fontSize: 16)),
              if (phone.isNotEmpty) Text(phone, style: const TextStyle(color: Colors.white54)),
              const Divider(color: Colors.white12, height: 20),
              ...order.items.map((item) {
                if (item is! Map) {
                  return Padding(
                    padding: const EdgeInsets.symmetric(vertical: 2),
                    child: Text(item.toString(), style: const TextStyle(color: Colors.white70)),
                  );
                }
                return Padding(
                  padding: const EdgeInsets.symmetric(vertical: 2),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(item['name']?.toString() ?? '—', style: const TextStyle(color: Colors.white70)),
                      Text('×${item['qty']}', style: const TextStyle(color: Colors.white54)),
                    ],
                  ),
                );
              }),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () {
                        Clipboard.setData(ClipboardData(text: _buildOrderSummary(order)));
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Order details copied')),
                        );
                      },
                      icon: const Icon(Icons.copy, size: 16),
                      label: const Text('Copy'),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: Colors.blue,
                        side: const BorderSide(color: Colors.blue),
                      ),
                    ),
                  ),
                  if (order.mapUrl != null) ...[
                    const SizedBox(width: 8),
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () async {
                          final url = Uri.parse(order.mapUrl!);
                          if (await canLaunchUrl(url)) {
                            await launchUrl(url);
                          }
                        },
                        icon: const Icon(Icons.map, size: 16),
                        label: const Text('Map'),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: Colors.orange,
                          side: const BorderSide(color: Colors.orange),
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ],
          ),
        );
      },
    );
  }
}
