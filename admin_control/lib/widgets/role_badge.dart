import 'package:flutter/material.dart';

import '../models/admin_user.dart';

class RoleBadge extends StatelessWidget {
  final AdminUser adminUser;

  const RoleBadge({super.key, required this.adminUser});

  @override
  Widget build(BuildContext context) {
    final label = adminUser.isSuperAdmin ? 'SUPER' : adminUser.role.toUpperCase();
    return Chip(
      label: Text(label, style: const TextStyle(fontSize: 10)),
      backgroundColor: const Color(0xFFFACC15).withValues(alpha: 0.2),
      labelStyle: const TextStyle(color: Color(0xFFFACC15)),
    );
  }
}
