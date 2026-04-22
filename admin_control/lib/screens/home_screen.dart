import 'package:flutter/material.dart';

import '../models/admin_user.dart';
import '../models/order.dart';
import '../services/auth_service.dart';
import '../services/firestore_service.dart';
import '../services/notification_service.dart';
import '../widgets/order_card.dart';
import '../widgets/role_badge.dart';
import 'cash_manager_screen.dart';
import 'delivery_screen.dart';
import 'login_screen.dart';
import 'order_messenger_screen.dart';

class HomeScreen extends StatefulWidget {
  final AdminUser adminUser;

  const HomeScreen({super.key, required this.adminUser});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final FirestoreService _fs = FirestoreService();
  final AuthService _auth = AuthService();

  List<Order> _activeOrders = <Order>[];
  int _previousOrderCount = -1;
  int _selectedIndex = 0;

  // Lazily built list of tabs based on user's permissions
  late final List<_NavTab> _tabs;

  @override
  void initState() {
    super.initState();
    _setupFCMToken();
    _buildTabs();
    _listenToOrders();
  }

  void _buildTabs() {
    final user = widget.adminUser;
    final tabs = <_NavTab>[];

    // Orders tab — always visible for admin; for staff, only if they have orders/biller page
    if (user.isAdmin || user.canManageOrders) {
      tabs.add(const _NavTab(
        label: 'Orders',
        icon: Icons.receipt_long,
        type: _TabType.orders,
      ));
    }

    // Cash Manager tab — only if role grants it (and they aren't pure delivery)
    if ((user.isCashManager) && !user.isDelivery || user.isAdmin) {
      // Avoid duplicates for admin (they have every permission)
      if (!tabs.any((t) => t.type == _TabType.cashManager)) {
        tabs.add(const _NavTab(
          label: 'Cash Mgr',
          icon: Icons.payments,
          type: _TabType.cashManager,
        ));
      }
    }

    // Order Messenger tab
    if ((user.isOrderMessenger) && !user.isDelivery || user.isAdmin) {
      if (!tabs.any((t) => t.type == _TabType.messenger)) {
        tabs.add(const _NavTab(
          label: 'Messenger',
          icon: Icons.message,
          type: _TabType.messenger,
        ));
      }
    }

    // Delivery tab — shown for delivery role or admin
    if (user.isDelivery) {
      tabs.add(const _NavTab(
        label: 'Delivery',
        icon: Icons.delivery_dining,
        type: _TabType.delivery,
      ));
    }

    _tabs = tabs;
  }

  Future<void> _setupFCMToken() async {
    final token = await NotificationService.getFCMToken();
    if (token != null) {
      // FIX 2: Pass email so fcmTokens collection is also populated
      await _fs.saveFCMToken(widget.adminUser.uid, token,
          email: widget.adminUser.email);
    }
  }

  void _listenToOrders() {
    final Stream<List<Order>> stream =
        _fs.activeOrdersStream(widget.adminUser.uid, widget.adminUser.role);

    stream.listen((orders) {
      if (_previousOrderCount >= 0 &&
          orders.length > _previousOrderCount &&
          orders.isNotEmpty) {
        final newOrder = orders.first;
        NotificationService.showNewOrderAlert(
          orderNo: newOrder.identifier,
          customerName: newOrder.customer?['name']?.toString() ?? 'Customer',
          total: '₹${newOrder.totalAmount.toStringAsFixed(0)}',
          isCritical: widget.adminUser.isCashManager &&
              newOrder.needsOtpVerification,
        );
      }
      _previousOrderCount = orders.length;
      if (mounted) {
        setState(() {
          _activeOrders = orders;
        });
      }
    });
  }

  Future<void> _signOut() async {
    await _auth.signOut();
    if (!mounted) return;
    Navigator.pushAndRemoveUntil(
      context,
      MaterialPageRoute(builder: (_) => const LoginScreen()),
      (route) => false,
    );
  }

  /// Number of active orders needing attention (for badge)
  int get _activeOrderBadgeCount => _activeOrders.length;

  /// Pending OTP orders count (for cash manager badge)
  int get _pendingOtpCount =>
      _activeOrders.where((o) => o.needsOtpVerification).length;

  /// New placed online orders count (for messenger badge)
  int get _placedOnlineCount =>
      _activeOrders.where((o) => o.status == 'placed').length;

  @override
  Widget build(BuildContext context) {
    final user = widget.adminUser;

    // ── Fast-path: delivery-only (pure delivery role, no admin) ──────────
    if (user.isDelivery && !user.isAdmin && !user.isCashManager &&
        !user.isOrderMessenger) {
      return Scaffold(
        backgroundColor: const Color(0xFF1A1A2E),
        appBar: _buildAppBar(user),
        body: DeliveryScreen(adminUser: user),
      );
    }

    // ── fast-path: single-role cash manager only ─────────────────────────
    if (user.isCashManager && !user.isAdmin && !user.isOrderMessenger &&
        !user.isDelivery) {
      return Scaffold(
        backgroundColor: const Color(0xFF1A1A2E),
        appBar: _buildAppBar(user),
        body: CashManagerScreen(
          orders: _activeOrders.where((o) => o.needsOtpVerification).toList(),
          adminUser: user,
        ),
      );
    }

    // ── fast-path: single-role order messenger only ──────────────────────
    if (user.isOrderMessenger && !user.isAdmin && !user.isCashManager &&
        !user.isDelivery) {
      return Scaffold(
        backgroundColor: const Color(0xFF1A1A2E),
        appBar: _buildAppBar(user),
        body: OrderMessengerScreen(orders: _activeOrders, adminUser: user),
      );
    }

    // ── Multi-tab layout (admin or multi-role users) ─────────────────────
    // Clamp _selectedIndex in case tabs list changed
    final safeIndex = _selectedIndex.clamp(0, _tabs.isEmpty ? 0 : _tabs.length - 1);

    return Scaffold(
      backgroundColor: const Color(0xFF1A1A2E),
      appBar: _buildAppBar(user),
      body: _tabs.isEmpty
          ? _buildAllOrdersView()
          : _buildTabBody(_tabs[safeIndex]),
      bottomNavigationBar: _tabs.length > 1
          ? NavigationBar(
              backgroundColor: const Color(0xFF16213E),
              indicatorColor: const Color(0xFFFACC15).withValues(alpha: 0.15),
              selectedIndex: safeIndex,
              onDestinationSelected: (i) => setState(() => _selectedIndex = i),
              destinations: _tabs.map((tab) {
                return NavigationDestination(
                  icon: _buildNavIcon(tab),
                  selectedIcon: _buildNavIcon(tab, selected: true),
                  label: tab.label,
                );
              }).toList(),
            )
          : null,
    );
  }

  Widget _buildNavIcon(_NavTab tab, {bool selected = false}) {
    int badgeCount = 0;
    switch (tab.type) {
      case _TabType.orders:
        badgeCount = _activeOrderBadgeCount;
        break;
      case _TabType.cashManager:
        badgeCount = _pendingOtpCount;
        break;
      case _TabType.messenger:
        badgeCount = _placedOnlineCount;
        break;
      case _TabType.delivery:
        badgeCount = 0;
        break;
    }

    final iconColor =
        selected ? const Color(0xFFFACC15) : Colors.white54;

    return Badge(
      isLabelVisible: badgeCount > 0,
      label: Text(
        '$badgeCount',
        style: const TextStyle(fontSize: 10, color: Colors.white),
      ),
      backgroundColor: Colors.red,
      child: Icon(tab.icon, color: iconColor),
    );
  }

  Widget _buildTabBody(_NavTab tab) {
    final user = widget.adminUser;
    switch (tab.type) {
      case _TabType.orders:
        return _buildAllOrdersView();
      case _TabType.cashManager:
        return CashManagerScreen(
          orders: _activeOrders.where((o) => o.needsOtpVerification).toList(),
          adminUser: user,
        );
      case _TabType.messenger:
        return OrderMessengerScreen(orders: _activeOrders, adminUser: user);
      case _TabType.delivery:
        return DeliveryScreen(adminUser: user);
    }
  }

  AppBar _buildAppBar(AdminUser user) {
    return AppBar(
      backgroundColor: const Color(0xFF16213E),
      title: Row(
        children: [
          const Icon(Icons.restaurant, color: Color(0xFFFACC15)),
          const SizedBox(width: 8),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text("Venky's Admin",
                  style: TextStyle(fontSize: 16, color: Colors.white)),
              Text(user.displayName,
                  style: const TextStyle(fontSize: 12, color: Colors.white54)),
            ],
          ),
        ],
      ),
      actions: [
        Padding(
          padding: const EdgeInsets.only(right: 8),
          child: RoleBadge(adminUser: user),
        ),
        IconButton(
          icon: const Icon(Icons.logout, color: Colors.white54),
          onPressed: _signOut,
        ),
      ],
    );
  }

  Widget _buildAllOrdersView() {
    if (_activeOrders.isEmpty) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.check_circle_outline, size: 64, color: Colors.green),
            SizedBox(height: 16),
            Text('No active orders', style: TextStyle(color: Colors.white54)),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _activeOrders.length,
      itemBuilder: (_, i) {
        return OrderCard(order: _activeOrders[i], adminUser: widget.adminUser);
      },
    );
  }
}

// ─── Data model for nav tabs ────────────────────────────────────────────────

enum _TabType { orders, cashManager, messenger, delivery }

class _NavTab {
  final String label;
  final IconData icon;
  final _TabType type;

  const _NavTab({
    required this.label,
    required this.icon,
    required this.type,
  });
}
