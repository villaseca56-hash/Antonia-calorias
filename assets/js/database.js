/**
 * Contador de Calorías Antonia - Database Module (IndexedDB + LocalStorage)
 * Handles 500+ food items database, meal logs, water logs, user profile & encrypted backups
 */

class FoodDatabase {
  constructor() {
    this.dbName = 'AntoniaCalorieDB';
    this.version = 1;
    this.db = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('foods')) {
          const foodStore = db.createObjectStore('foods', { keyPath: 'id' });
          foodStore.createIndex('name', 'name', { unique: false });
          foodStore.createIndex('category', 'category', { unique: false });
        }
        if (!db.objectStoreNames.contains('daily_logs')) {
          const logStore = db.createObjectStore('daily_logs', { keyPath: 'id', autoIncrement: true });
          logStore.createIndex('date', 'date', { unique: false });
        }
        if (!db.objectStoreNames.contains('water_logs')) {
          db.createObjectStore('water_logs', { keyPath: 'date' });
        }
      };

      request.onsuccess = async (event) => {
        this.db = event.target.result;
        await this.seedFoodsIfEmpty();
        resolve(this);
      };

      request.onerror = (event) => {
        console.error('IndexedDB Error:', event.target.error);
        reject(event.target.error);
      };
    });
  }

  async seedFoodsIfEmpty() {
    const count = await this.getFoodCount();
    if (count === 0) {
      try {
        const response = await fetch('assets/data/foods-database.json');
        const foodsData = await response.json();
        const tx = this.db.transaction('foods', 'readwrite');
        const store = tx.objectStore('foods');
        foodsData.forEach(food => store.put(food));
        await new Promise(res => tx.oncomplete = res);
        console.log(`Successfully seeded ${foodsData.length} foods into IndexedDB!`);
      } catch (err) {
        console.error('Failed to seed foods:', err);
      }
    }
  }

  async getFoodCount() {
    return new Promise((resolve) => {
      const tx = this.db.transaction('foods', 'readonly');
      const store = tx.objectStore('foods');
      const req = store.count();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(0);
    });
  }

  async getAllFoods() {
    return new Promise((resolve) => {
      const tx = this.db.transaction('foods', 'readonly');
      const store = tx.objectStore('foods');
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
    });
  }

  async searchFoods(query, category = null) {
    const all = await this.getAllFoods();
    let results = all;
    if (category && category !== 'Todos') {
      results = results.filter(f => f.category === category);
    }
    if (query && query.trim().length > 0) {
      const q = query.toLowerCase().trim();
      results = results.filter(f => 
        f.name.toLowerCase().includes(q) || 
        (f.tags && f.tags.some(t => t.toLowerCase().includes(q)))
      );
    }
    return results;
  }

  // Daily Logs CRUD
  async addMealLog(logItem) {
    // logItem: { date, mealType, foodId, foodName, calories, protein, carbs, fat, portion, amount }
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('daily_logs', 'readwrite');
      const store = tx.objectStore('daily_logs');
      const req = store.add(logItem);
      req.onsuccess = () => {
        window.appEvents.emit('logsUpdated', logItem.date);
        resolve(req.result);
      };
      req.onerror = () => reject(req.error);
    });
  }

  async deleteMealLog(id, date) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('daily_logs', 'readwrite');
      const store = tx.objectStore('daily_logs');
      const req = store.delete(id);
      req.onsuccess = () => {
        window.appEvents.emit('logsUpdated', date);
        resolve(true);
      };
      req.onerror = () => reject(req.error);
    });
  }

  async getLogsByDate(dateStr) {
    return new Promise((resolve) => {
      const tx = this.db.transaction('daily_logs', 'readonly');
      const store = tx.objectStore('daily_logs');
      const index = store.index('date');
      const req = index.getAll(dateStr);
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
  }

  async getLogsRange(startDateStr, endDateStr) {
    const all = await new Promise((resolve) => {
      const tx = this.db.transaction('daily_logs', 'readonly');
      const store = tx.objectStore('daily_logs');
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
    });
    return all.filter(l => l.date >= startDateStr && l.date <= endDateStr);
  }

  // Water Intake Persistence
  async getWaterIntake(dateStr) {
    return new Promise((resolve) => {
      const tx = this.db.transaction('water_logs', 'readonly');
      const store = tx.objectStore('water_logs');
      const req = store.get(dateStr);
      req.onsuccess = () => resolve(req.result ? req.result.glasses : 0);
      req.onerror = () => resolve(0);
    });
  }

  async setWaterIntake(dateStr, glasses) {
    return new Promise((resolve) => {
      const tx = this.db.transaction('water_logs', 'readwrite');
      const store = tx.objectStore('water_logs');
      store.put({ date: dateStr, glasses: Math.max(0, glasses) });
      tx.oncomplete = () => {
        window.appEvents.emit('waterUpdated', { date: dateStr, glasses });
        resolve(glasses);
      };
    });
  }

  // User Profile & Goals (Encrypted via Web Crypto API)
  async getUserGoal() {
    const saved = localStorage.getItem('antonia_user_goal');
    return saved ? parseInt(saved, 10) : 2000;
  }

  async setUserGoal(goalCals) {
    localStorage.setItem('antonia_user_goal', goalCals);
    window.appEvents.emit('goalUpdated', goalCals);
  }

  async saveUserProfileEncrypted(profileObj) {
    const json = JSON.stringify(profileObj);
    const encrypted = await window.SecurityManager.encryptData(json);
    localStorage.setItem('antonia_user_profile_enc', encrypted);
  }

  async getUserProfileEncrypted() {
    const enc = localStorage.getItem('antonia_user_profile_enc');
    if (!enc) return { name: 'Usuario', weight: 65, height: 170, age: 25 };
    const decrypted = await window.SecurityManager.decryptData(enc);
    try {
      return JSON.parse(decrypted);
    } catch (e) {
      return { name: 'Usuario', weight: 65, height: 170, age: 25 };
    }
  }

  async clearAllData() {
    const tx = this.db.transaction(['daily_logs', 'water_logs'], 'readwrite');
    tx.objectStore('daily_logs').clear();
    tx.objectStore('water_logs').clear();
    localStorage.clear();
    await new Promise(res => tx.oncomplete = res);
    window.location.reload();
  }
}

window.foodDB = new FoodDatabase();
