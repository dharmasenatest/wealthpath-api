'use strict';

const { v4: uuidv4 } = require('uuid');

// ── Categories & merchants ────────────────────────────────────────────────────
const CATEGORIES = [
  { name: 'Groceries',   merchants: ['Supermart', 'FreshFields', 'GreenBasket', 'DailyMart', 'OrganicHub', 'CityGrocer', 'QuickMart', 'FarmFresh'] },
  { name: 'Dining',      merchants: ['The Grill House', 'Sushi Palace', 'Pizza Corner', 'Café Bloom', 'Burger Town', 'Thai Garden', 'Noodle Bar', 'The Bistro'] },
  { name: 'Transport',   merchants: ['PickRide', 'CityBus', 'MetroCard', 'FuelStop', 'QuickCab', 'TramPass', 'ParkEasy', 'ExpressTaxi'] },
  { name: 'Streaming',   merchants: ['NetStream', 'MovieBox', 'MusicFlow', 'GamePass', 'DocuWatch', 'SportsFeed', 'AudioLib'] },
  { name: 'Utilities',   merchants: ['PowerGrid', 'AquaSupply', 'CityGas', 'WebSpeed', 'PhonePlan', 'InsureCo', 'CloudStore'] },
  { name: 'Shopping',    merchants: ['StyleHub', 'TechMart', 'HomeDecor', 'SportGear', 'BookNook', 'GadgetWorld', 'FashionLane', 'EcoShop'] },
  { name: 'Healthcare',  merchants: ['CityClinic', 'PharmaCare', 'DentalPlus', 'VisionCare', 'WellnessLab', 'MedCenter', 'HealthRx'] },
  { name: 'Education',   merchants: ['LearnHub', 'CourseFlow', 'BookDepot', 'TutorZone', 'SkillCraft', 'AcademyPro'] },
  { name: 'Travel',      merchants: ['SkyWings', 'HotelNest', 'RoamCar', 'TrailPack', 'StayEasy', 'JetBudget'] },
  { name: 'Fitness',     merchants: ['IronGym', 'YogaSpace', 'RunnerShop', 'FitApp', 'CycleHub', 'SwimClub'] },
];

const CURRENCIES = ['USD', 'USD', 'USD', 'USD', 'USD', 'USD', 'LKR', 'EUR', 'GBP'];

// Amount ranges per category (min, max in USD)
const AMOUNT_RANGES = {
  Groceries:  [8.50,  120.00],
  Dining:     [6.00,   85.00],
  Transport:  [2.50,   45.00],
  Streaming:  [4.99,   29.99],
  Utilities:  [20.00, 180.00],
  Shopping:   [12.00, 250.00],
  Healthcare: [15.00, 200.00],
  Education:  [9.99,  150.00],
  Travel:     [40.00, 450.00],
  Fitness:    [10.00,  80.00],
};

function randBetween(min, max) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(2));
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(daysBack = 180) {
  const now = Date.now();
  const msBack = daysBack * 24 * 60 * 60 * 1000;
  return new Date(now - Math.random() * msBack).toISOString();
}

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ── Generate Spending Records ────────────────────────────────────────────────
function generateSpendingRecords(count = 180) {
  const records = [];

  for (let i = 0; i < count; i++) {
    const cat = randomItem(CATEGORIES);
    const [min, max] = AMOUNT_RANGES[cat.name] || [5, 100];
    const currency = i % 15 === 0 ? randomItem(['LKR', 'EUR', 'GBP']) : 'USD';

    records.push({
      id:       `sp_${String(i + 1).padStart(3, '0')}_${uuidv4().slice(0, 8)}`,
      merchant: randomItem(cat.merchants),
      amount:   randBetween(min, max),
      currency,
      category: cat.name,
      date:     randomDate(180),
    });
  }

  // Sort: latest first
  records.sort((a, b) => new Date(b.date) - new Date(a.date));
  return records;
}

// ── Generate Budget Records ──────────────────────────────────────────────────
function generateBudgetRecords() {
  const budgetDefs = [
    { category: 'Groceries',    spent: 312.40,  limit: 400.00 },
    { category: 'Dining',       spent: 218.75,  limit: 250.00 },
    { category: 'Transport',    spent:  97.20,  limit: 150.00 },
    { category: 'Streaming',    spent:  44.97,  limit:  60.00 },
    { category: 'Utilities',    spent: 195.00,  limit: 220.00 },
    { category: 'Shopping',     spent: 412.60,  limit: 350.00 }, // over budget
    { category: 'Healthcare',   spent:  55.00,  limit: 200.00 },
    { category: 'Education',    spent:  89.99,  limit: 100.00 },
    { category: 'Travel',       spent: 380.00,  limit: 500.00 },
    { category: 'Fitness',      spent:  45.00,  limit:  80.00 },
    { category: 'Entertainment',spent: 138.50,  limit: 150.00 },
    { category: 'Coffee',       spent:  72.30,  limit:  60.00 }, // over budget
    { category: 'Personal Care',spent:  38.00,  limit: 100.00 },
    { category: 'Home & Garden',spent: 145.00,  limit: 200.00 },
    { category: 'Electronics',  spent: 249.99,  limit: 300.00 },
    { category: 'Insurance',    spent: 180.00,  limit: 180.00 }, // at limit
    { category: 'Gifts',        spent:  25.00,  limit: 150.00 },
    { category: 'Pet Care',     spent:  62.40,  limit:  80.00 },
    { category: 'Books',        spent:  18.99,  limit:  50.00 },
    { category: 'Clothing',     spent: 185.00,  limit: 200.00 },
    { category: 'Sports',       spent:  76.50,  limit: 120.00 },
    { category: 'Software',     spent:  99.00,  limit: 100.00 },
    { category: 'Food Delivery',spent: 155.80,  limit: 120.00 }, // over budget
    { category: 'Pharmacy',     spent:  42.30,  limit:  80.00 },
  ];

  return budgetDefs.map((def, i) => ({
    id:       `bud_${String(i + 1).padStart(3, '0')}`,
    category: def.category,
    spent:    parseFloat(def.spent.toFixed(2)),
    limit:    parseFloat(def.limit.toFixed(2)),
    currency: 'USD',
  }));
}

// ── In-Memory Store ──────────────────────────────────────────────────────────
const store = {
  spending: generateSpendingRecords(180),
  budgets:  generateBudgetRecords(),
};

function reseed() {
  store.spending = generateSpendingRecords(180);
  store.budgets  = generateBudgetRecords();
}

module.exports = { store, reseed, generateSpendingRecords, generateBudgetRecords };
