import 'package:flutter/material.dart';

import '../models/admin_user.dart';
import '../models/order.dart';

class OrderCard extends StatelessWidget {
  final Order order;
  final AdminUser adminUser;

  const OrderCard({
    super.key,
    required this.order,
    required this.adminUser,
  });

  Color _statusColor(String status) {
    switch (status) {
      case 'placed':
        return const Color(0xFFFACC15);
      case 'preparing':
        return Colors.blue;
      case 'ready':
        return Colors.green;
      default:
        return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF16213E),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: order.needsOtpVerification
              ? Colors.orange.withValues(alpha: 0.6)
              : Colors.white.withValues(alpha: 0.1),
        ),
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
                  fontSize: 16,
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: _statusColor(order.status).withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(6),
                  border: Border.all(color: _statusColor(order.status).withValues(alpha: 0.5)),
                ),
                child: Text(
                  order.status.toUpperCase(),
                  style: TextStyle(color: _statusColor(order.status), fontSize: 10),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(order.customer?['name']?.toString() ?? '—', style: const TextStyle(color: Colors.white70)),
          Text(
            '₹${order.totalAmount.toStringAsFixed(0)} • ${order.orderType ?? '—'}',
            style: const TextStyle(color: Colors.white54, fontSize: 12),
          ),
          if (order.needsOtpVerification)
            Container(
              margin: const EdgeInsets.only(top: 8),
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: Colors.orange.withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(6),
              ),
              child: const Text(
                'OTP Required',
                style: TextStyle(color: Colors.orange, fontSize: 12),
              ),
            ),
        ],
      ),
    );
  }
}
