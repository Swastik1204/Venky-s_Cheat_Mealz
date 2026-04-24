import 'dart:async';
import 'dart:math';
import 'package:flutter/material.dart';

import '../models/admin_user.dart';
import '../models/order.dart';
import '../services/firestore_service.dart';

class CashManagerScreen extends StatefulWidget {
  final List<Order> orders;
  final AdminUser adminUser;

  const CashManagerScreen({
    super.key,
    required this.orders,
    required this.adminUser,
  });

  @override
  State<CashManagerScreen> createState() => _CashManagerScreenState();
}

class _CashManagerScreenState extends State<CashManagerScreen> {
  final FirestoreService _fs = FirestoreService();
  Order? _selectedOrder;
  bool _processing = false;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (mounted) setState(() {});
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  Future<void> _generateOtp() async {
    if (_selectedOrder == null) return;
    setState(() => _processing = true);

    try {
      final otp = (Random().nextInt(900000) + 100000).toString();
      await _fs.setOrderOtp(orderId: _selectedOrder!.id, otp: otp);
      setState(() => _processing = false);
    } catch (e) {
      if (!mounted) return;
      setState(() => _processing = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to generate OTP: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    if (widget.orders.isEmpty) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.check_circle, size: 64, color: Colors.green),
            SizedBox(height: 16),
            Text(
              'No pending payments',
              style: TextStyle(color: Colors.white54, fontSize: 16),
            ),
          ],
        ),
      );
    }

    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '${widget.orders.length} order${widget.orders.length > 1 ? 's' : ''} awaiting payment',
            style: const TextStyle(color: Colors.white70, fontSize: 14),
          ),
          const SizedBox(height: 12),
          Expanded(
            child: ListView.builder(
              itemCount: widget.orders.length,
              itemBuilder: (_, i) {
                final order = widget.orders[i];
                final isSelected = _selectedOrder?.id == order.id;
                final hasOtp = order.cashManagerOtp != null && !order.isOtpExpired;
                
                String expiryText = '';
                if (hasOtp && order.cashManagerOtpGeneratedAt != null) {
                  final remaining = const Duration(minutes: 30) - DateTime.now().difference(order.cashManagerOtpGeneratedAt!);
                  if (remaining.isNegative) {
                    expiryText = 'Expired';
                  } else {
                    expiryText = '${remaining.inMinutes}:${(remaining.inSeconds % 60).toString().padLeft(2, '0')}';
                  }
                }

                return GestureDetector(
                  onTap: () {
                    setState(() {
                      _selectedOrder = order;
                    });
                  },
                  child: Container(
                    margin: const EdgeInsets.only(bottom: 12),
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: isSelected ? Colors.orange.withValues(alpha: 0.15) : const Color(0xFF16213E),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: isSelected ? Colors.orange : Colors.orange.withValues(alpha: 0.3),
                        width: isSelected ? 2 : 1,
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
                                fontSize: 18,
                              ),
                            ),
                            Text(
                              '₹${order.totalAmount.toStringAsFixed(0)}',
                              style: const TextStyle(
                                color: Color(0xFFFACC15),
                                fontWeight: FontWeight.bold,
                                fontSize: 18,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Text(order.customer?['name']?.toString() ?? '—', style: const TextStyle(color: Colors.white70)),
                        if (isSelected) ...[
                          const Divider(color: Colors.white24, height: 24),
                          if (hasOtp) ...[
                            const Center(
                              child: Text(
                                'COLLECT CASH & SHOW CODE:',
                                style: TextStyle(color: Colors.white54, fontSize: 10, fontWeight: FontWeight.bold),
                              ),
                            ),
                            const SizedBox(height: 8),
                            Center(
                              child: Text(
                                order.cashManagerOtp!,
                                style: const TextStyle(
                                  color: Colors.orange,
                                  fontSize: 48,
                                  fontWeight: FontWeight.w900,
                                  letterSpacing: 8,
                                ),
                              ),
                            ),
                            const SizedBox(height: 8),
                            Center(
                              child: Text(
                                'Expires in: $expiryText',
                                style: TextStyle(
                                  color: order.isOtpExpired ? Colors.red : Colors.white54,
                                  fontSize: 12,
                                ),
                              ),
                            ),
                            const SizedBox(height: 16),
                            SizedBox(
                              width: double.infinity,
                              child: OutlinedButton(
                                onPressed: _processing ? null : _generateOtp,
                                style: OutlinedButton.styleFrom(
                                  foregroundColor: Colors.white70,
                                  side: const BorderSide(color: Colors.white24),
                                  padding: const EdgeInsets.symmetric(vertical: 12),
                                ),
                                child: const Text('Regenerate OTP'),
                              ),
                            ),
                          ] else ...[
                            SizedBox(
                              width: double.infinity,
                              child: ElevatedButton(
                                onPressed: _processing ? null : _generateOtp,
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: Colors.orange,
                                  foregroundColor: Colors.black,
                                  padding: const EdgeInsets.symmetric(vertical: 14),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                ),
                                child: _processing
                                    ? const SizedBox(
                                        width: 20,
                                        height: 20,
                                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.black),
                                      )
                                    : const Text(
                                        'Generate OTP',
                                        style: TextStyle(fontWeight: FontWeight.bold),
                                      ),
                              ),
                            ),
                          ],
                        ],
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
