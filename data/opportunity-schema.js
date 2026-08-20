// V4 Sourcing Intelligence - Opportunity schema
export const opportunitySchema = {
  product: {
    name: '',
    category: '',
    source: '',
    trendSignal: null,
    demandSignal: null
  },
  supplier: {
    name: '',
    country: '',
    moq: null,
    availability: null
  },
  economics: {
    purchaseCost: 0,
    shippingCost: 0,
    customsCost: 0,
    landedCost: 0,
    sellingPrice: 0,
    margin: 0,
    cac: 0
  },
  analysis: {
    scoreV4: 0,
    confidence: 0,
    risks: [],
    decision: 'PENDING'
  },
  traceability: {
    sources: [],
    createdAt: null,
    updatedAt: null
  }
};
