class AdminUser {
  final String uid;
  final String email;
  final String displayName;
  final String role; // 'admin' | 'staff' | 'delivery'
  final Map<String, bool> pages;
  final String status;

  AdminUser({
    required this.uid,
    required this.email,
    required this.displayName,
    required this.role,
    required this.pages,
    required this.status,
  });

  bool get isSuperAdmin => email == 'swastiksaha1204@gmail.com';
  bool get isAdmin => role == 'admin' || isSuperAdmin;
  bool get isCashManager => pages['cashManager'] == true || isAdmin;
  bool get isOrderMessenger => pages['orderMessenger'] == true || isAdmin;
  bool get isDelivery => role == 'delivery' || isAdmin;
  bool get canManageOrders => pages['orders'] == true || pages['biller'] == true || isAdmin;

  factory AdminUser.fromFirestore(Map<String, dynamic> data, String uid) {
    final rawPages = data['pages'];
    final parsedPages = <String, bool>{};
    if (rawPages is Map) {
      rawPages.forEach((key, value) {
        parsedPages[key.toString()] = value == true;
      });
    }

    return AdminUser(
      uid: uid,
      email: (data['email'] ?? '').toString(),
      displayName: (data['displayName'] ?? '').toString(),
      role: (data['role'] ?? 'staff').toString(),
      pages: parsedPages,
      status: (data['status'] ?? 'active').toString(),
    );
  }
}
