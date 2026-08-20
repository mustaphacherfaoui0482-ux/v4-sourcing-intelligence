// V4 Supplier Performance Engine v1

class V4SupplierPerformanceEngine {
  constructor() {
    this.suppliers = [];
  }

  registerSupplier(data) {
    const supplier = {
      id: Date.now(),
      ...data,
      metrics: data.metrics || {},
      createdAt: new Date().toISOString()
    };

    this.suppliers.push(supplier);
    return supplier;
  }

  evaluateSupplier(id) {
    const supplier = this.suppliers.find(item => item.id === id);

    if (!supplier) return null;

    const metrics = supplier.metrics;
    const score = (
      (metrics.quality || 0) +
      (metrics.reliability || 0) +
      (metrics.communication || 0) +
      (metrics.delivery || 0)
    ) / 4;

    return {
      supplierId: id,
      performanceScore: score,
      status: score >= 80 ? 'preferred' : score >= 50 ? 'review' : 'risk'
    };
  }

  getSuppliers() {
    return this.suppliers;
  }

  getStatus() {
    return {
      engine: 'V4 Supplier Performance Engine',
      version: '1.0',
      suppliersTracked: this.suppliers.length
    };
  }
}

module.exports = V4SupplierPerformanceEngine;
