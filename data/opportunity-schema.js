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
    purchaseCost: null,
    shippingCost: null,
    customsCost: null,
    landedCost: null,
    sellingPrice: null,
    margin: null,
    cac: null
  },
  analysis: {
    scoreV4: null,
    confidence: null,
    risks: [],
    decision: 'PENDING'
  },
  traceability: {
    sources: [],
    createdAt: null,
    updatedAt: null
  }
};
