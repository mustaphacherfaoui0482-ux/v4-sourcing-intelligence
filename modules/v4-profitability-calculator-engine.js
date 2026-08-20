// V4 Profitability Calculator Engine v1
// Cost rendering, margin and ROI preparation layer

class V4ProfitabilityCalculatorEngine {
  constructor() {
    this.calculations = [];
  }

  calculate(input) {
    const revenue = Number(input.salePrice || 0);
    const costs = {
      product: Number(input.productCost || 0),
      shipping: Number(input.shippingCost || 0),
      taxes: Number(input.taxes || 0),
      fees: Number(input.fees || 0),
      marketing: Number(input.cac || 0)
    };

    const totalCost = Object.values(costs).reduce((a, b) => a + b, 0);
    const profit = revenue - totalCost;
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

    const result = {
      revenue,
      costs,
      totalCost,
      profit,
      margin,
      timestamp: new Date().toISOString()
    };

    this.calculations.push(result);
    return result;
  }

  getHistory() {
    return this.calculations;
  }

  getStatus() {
    return {
      engine: 'V4 Profitability Calculator Engine',
      version: '1.0',
      calculations: this.calculations.length,
      status: 'active'
    };
  }
}

module.exports = V4ProfitabilityCalculatorEngine;
