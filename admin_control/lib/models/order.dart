class Order {
  final String id;
  final String? orderNo;
  final String status;
  final String? orderType;
  final Map<String, dynamic>? customer;
  final Map<String, dynamic>? payment;
  final List<dynamic> items;
  final double totalAmount;
  final DateTime? createdAt;
  final String? cashManagerOtp;
  final DateTime? cashManagerOtpGeneratedAt;
  final bool cashManagerOtpVerified;
  final String? mapUrl;

  Order({
    required this.id,
    this.orderNo,
    required this.status,
    this.orderType,
    this.customer,
    this.payment,
    required this.items,
    required this.totalAmount,
    this.createdAt,
    this.cashManagerOtp,
    this.cashManagerOtpGeneratedAt,
    required this.cashManagerOtpVerified,
    this.mapUrl,
  });

  bool get isDineInCod => orderType == 'dine-in' && payment?['method'] == 'cod';

  bool get needsOtpVerification => isDineInCod && cashManagerOtp != null && !cashManagerOtpVerified;

  bool get isOtpExpired {
    if (cashManagerOtpGeneratedAt == null) return true;
    final diff = DateTime.now().difference(cashManagerOtpGeneratedAt!);
    return diff.inMinutes >= 30;
  }

  String get identifier {
    if (orderNo != null && orderNo!.isNotEmpty) return orderNo!;
    final tail = id.length > 6 ? id.substring(id.length - 6) : id;
    return '#$tail';
  }

  factory Order.fromFirestore(Map<String, dynamic> data, String id) {
    double total = 0;
    final explicit = data['totalAmount'] ?? data['total'] ?? data['grandTotal'];
    if (explicit is num) {
      total = explicit.toDouble();
    }

    DateTime? created;
    final ts = data['createdAt'];
    if (ts != null) {
      try {
        created = (ts as dynamic).toDate() as DateTime?;
      } catch (_) {
        created = null;
      }
    }

    DateTime? otpAt;
    final ots = data['cashManagerOtpGeneratedAt'];
    if (ots != null) {
      try {
        otpAt = (ots as dynamic).toDate() as DateTime?;
      } catch (_) {
        otpAt = null;
      }
    }

    Map<String, dynamic>? customer;
    if (data['customer'] is Map) {
      customer = Map<String, dynamic>.from(data['customer'] as Map);
    }

    Map<String, dynamic>? payment;
    if (data['payment'] is Map) {
      payment = Map<String, dynamic>.from(data['payment'] as Map);
    }

    final rawItems = data['items'];
    final parsedItems = rawItems is List ? List<dynamic>.from(rawItems) : <dynamic>[];

    return Order(
      id: id,
      orderNo: data['orderNo']?.toString(),
      status: (data['status'] ?? 'placed').toString(),
      orderType: data['orderType']?.toString(),
      customer: customer,
      payment: payment,
      items: parsedItems,
      totalAmount: total,
      createdAt: created,
      cashManagerOtp: data['cashManagerOtp']?.toString(),
      cashManagerOtpGeneratedAt: otpAt,
      cashManagerOtpVerified: data['cashManagerOtpVerified'] == true,
      mapUrl: data['mapUrl']?.toString(),
    );
  }
}
