import 'package:flutter/material.dart';

import '../models/admin_user.dart';
import '../models/order.dart';
import '../services/firestore_service.dart';
import '../widgets/otp_entry_widget.dart';

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
  final TextEditingController _otpController = TextEditingController();

  Order? _selectedOrder;
  bool _verifying = false;
  String? _error;
  bool _success = false;

  Future<void> _verifyOtp() async {
    if (_selectedOrder == null) return;
    final entered = _otpController.text.trim();

    if (entered.isEmpty) {
      setState(() {
        _error = 'Please enter the OTP';
      });
      return;
    }

    if (entered != _selectedOrder!.cashManagerOtp) {
      setState(() {
        _error = 'Incorrect OTP. Please try again.';
      });
      return;
    }

    setState(() {
      _verifying = true;
      _error = null;
    });

    try {
      await _fs.verifyOtpAndAccept(
        orderId: _selectedOrder!.id,
        verifiedBy: widget.adminUser.email,
      );
      setState(() {
        _success = true;
        _verifying = false;
      });
      await Future.delayed(const Duration(seconds: 2));
      if (!mounted) return;
      setState(() {
        _success = false;
        _selectedOrder = null;
        _otpController.clear();
      });
    } catch (_) {
      setState(() {
        _error = 'Failed to verify. Please try again.';
        _verifying = false;
      });
    }
  }

  @override
  void dispose() {
    _otpController.dispose();
    super.dispose();
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
              'No pending OTP verifications',
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

                return GestureDetector(
                  onTap: () {
                    setState(() {
                      _selectedOrder = order;
                      _otpController.clear();
                      _error = null;
                      _success = false;
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
                          if (_success)
                            Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: Colors.green.withValues(alpha: 0.2),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: const Row(
                                children: [
                                  Icon(Icons.check_circle, color: Colors.green),
                                  SizedBox(width: 8),
                                  Text(
                                    'Payment verified!',
                                    style: TextStyle(color: Colors.green, fontWeight: FontWeight.bold),
                                  ),
                                ],
                              ),
                            )
                          else ...[
                            const Text(
                              'Enter OTP from biller screen:',
                              style: TextStyle(color: Colors.white70, fontSize: 12),
                            ),
                            const SizedBox(height: 8),
                            OtpEntryWidget(controller: _otpController, error: _error),
                            const SizedBox(height: 12),
                            SizedBox(
                              width: double.infinity,
                              child: ElevatedButton(
                                onPressed: _verifying ? null : _verifyOtp,
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: Colors.orange,
                                  foregroundColor: Colors.black,
                                  padding: const EdgeInsets.symmetric(vertical: 14),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                ),
                                child: _verifying
                                    ? const SizedBox(
                                        width: 20,
                                        height: 20,
                                        child: CircularProgressIndicator(strokeWidth: 2),
                                      )
                                    : const Text(
                                        'Verify & Collect Payment',
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
