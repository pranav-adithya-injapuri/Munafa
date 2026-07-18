// data.js
// Synthetic demo dataset for a small Indian kirana/grocery store.
// Replace with real POS data later — for tonight this just needs to look
// and behave like the real thing (realistic prices, believable variance).

(function (root, factory) {
  var mod = factory();
  if (typeof module !== "undefined" && module.exports) {
    module.exports = mod;
  } else {
    root.MUNAFA_PRODUCTS = mod;
  }
})(typeof self !== "undefined" ? self : this, function () {
  return [
    { id: "sku-01", name: "Paneer (200g)", category: "Dairy", icon: "cheese", unitCost: 42, sellPrice: 60, currentStock: 38, daysToExpiry: 2, leadTimeDays: 1, salesHistory: [16,19,15,20,24,27,22,17,18,16,21,25,29,19] },
    { id: "sku-02", name: "Toned Milk (500ml)", category: "Dairy", icon: "milk", unitCost: 24, sellPrice: 30, currentStock: 120, daysToExpiry: 2, leadTimeDays: 1, salesHistory: [42,45,39,48,55,58,50,44,41,43,47,53,57,46] },
    { id: "sku-03", name: "Curd (400g)", category: "Dairy", icon: "curd", unitCost: 28, sellPrice: 40, currentStock: 55, daysToExpiry: 3, leadTimeDays: 1, salesHistory: [19,22,17,21,26,28,23,18,20,19,24,27,25,21] },
    { id: "sku-04", name: "Brown Bread (400g)", category: "Bakery", icon: "bread", unitCost: 35, sellPrice: 48, currentStock: 30, daysToExpiry: 3, leadTimeDays: 1, salesHistory: [11,13,9,12,15,17,14,10,12,11,13,16,18,12] },
    { id: "sku-05", name: "Tomatoes (kg)", category: "Produce", icon: "tomato", unitCost: 18, sellPrice: 28, currentStock: 60, daysToExpiry: 4, leadTimeDays: 2, salesHistory: [22,26,18,24,30,33,27,20,23,25,28,31,29,24] },
    { id: "sku-06", name: "Spinach (bunch)", category: "Produce", icon: "leaf", unitCost: 10, sellPrice: 18, currentStock: 45, daysToExpiry: 2, leadTimeDays: 1, salesHistory: [16,19,14,18,22,24,20,15,17,16,20,23,21,18] },
    { id: "sku-07", name: "Bananas (dozen)", category: "Produce", icon: "banana", unitCost: 30, sellPrice: 45, currentStock: 12, daysToExpiry: 4, leadTimeDays: 2, salesHistory: [9,11,7,10,13,15,12,8,10,9,12,14,13,10] },
    { id: "sku-08", name: "Eggs (tray of 6)", category: "Dairy & Eggs", icon: "egg", unitCost: 36, sellPrice: 48, currentStock: 22, daysToExpiry: 10, leadTimeDays: 3, salesHistory: [11,13,9,12,15,16,13,10,11,12,14,15,13,12] },
    { id: "sku-09", name: "Basmati Rice (1kg)", category: "Staples", icon: "grain", unitCost: 85, sellPrice: 110, currentStock: 70, daysToExpiry: 180, leadTimeDays: 5, salesHistory: [5,6,4,6,8,9,7,5,6,5,7,8,9,6] },
    { id: "sku-10", name: "Onions (kg)", category: "Produce", icon: "onion", unitCost: 15, sellPrice: 24, currentStock: 90, daysToExpiry: 6, leadTimeDays: 2, salesHistory: [28,32,24,30,36,39,33,26,29,28,34,37,31,30] },
    { id: "sku-11", name: "Amul Butter (100g)", category: "Dairy", icon: "butter", unitCost: 48, sellPrice: 58, currentStock: 14, daysToExpiry: 15, leadTimeDays: 3, salesHistory: [6,8,5,7,9,10,8,6,7,6,9,10,8,7] },
    { id: "sku-12", name: "Coriander (bunch)", category: "Produce", icon: "herb", unitCost: 6, sellPrice: 12, currentStock: 50, daysToExpiry: 1, leadTimeDays: 1, salesHistory: [19,22,16,20,25,27,22,17,19,18,23,26,24,20] }
  ];
});
