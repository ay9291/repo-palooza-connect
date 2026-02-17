export function buildAdminKpis({ products, orders, assignments }) {
  const totalRevenue = orders
    .filter((order) => order.status === 'delivered')
    .reduce((sum, order) => sum + Number(order.total_amount || 0), 0);

  const openOrders = orders.filter((order) => ['placed', 'processing', 'assigned_to_delivery'].includes(order.status)).length;
  const lowStockCount = products.filter((product) => product.stock_quantity <= 5).length;

  return {
    totalProducts: products.length,
    openOrders,
    lowStockCount,
    totalRevenue,
    activeAssignments: assignments.filter((assignment) => assignment.delivery_status !== 'delivered').length,
  };
}

export function buildPartnerAssignmentStats(partners, assignments) {
  return partners.map((partner) => {
    const partnerAssignments = assignments.filter((assignment) => assignment.partner_id === partner.id);
    return {
      ...partner,
      assignedOrders: partnerAssignments.length,
      deliveredOrders: partnerAssignments.filter((assignment) => assignment.delivery_status === 'delivered').length,
    };
  });
}

export function filterOrdersByStatus(orders, statusFilter) {
  if (!statusFilter || statusFilter === 'all') return orders;
  return orders.filter((order) => order.status === statusFilter);
}
