// V4 Search Intelligence Engine v1
// Internal search layer for products, suppliers and historical data.

const searchIndex = [];

function indexItem(item) {
  searchIndex.push({
    ...item,
    indexedAt: new Date().toISOString()
  });
  return item;
}

function search(query) {
  const q = String(query).toLowerCase();

  return searchIndex.filter(item =>
    JSON.stringify(item).toLowerCase().includes(q)
  );
}

function filterByType(type) {
  return searchIndex.filter(item => item.type === type);
}

function getSearchStats() {
  return {
    totalIndexedItems: searchIndex.length
  };
}

module.exports = {
  indexItem,
  search,
  filterByType,
  getSearchStats
};
