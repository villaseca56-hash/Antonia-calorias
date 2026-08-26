# API & Architecture Reference - Contador de Calorías Antonia

## 1. `FoodDatabase` (`database.js`)
IndexedDB Wrapper for managing offline persistence.

### Methods:
- `init(): Promise<FoodDatabase>`: Opens IndexedDB connection and seeds 516 food items if empty.
- `getAllFoods(): Promise<Array<Food>>`: Returns all food items.
- `searchFoods(query: string, category: string): Promise<Array<Food>>`: Filters foods by fuzzy query or category.
- `addMealLog(logItem: Object): Promise<number>`: Adds a meal entry to `daily_logs` store.
- `getLogsByDate(dateStr: string): Promise<Array<Log>>`: Retrieves all logged meals for a specific date.
- `getLogsRange(startStr: string, endStr: string): Promise<Array<Log>>`: Retrieves logs across a date range.
- `getWaterIntake(dateStr: string): Promise<number>`: Gets water glasses for a date.
- `setWaterIntake(dateStr: string, glasses: number): Promise<number>`: Persists water intake count.
- `saveUserProfileEncrypted(profile: Object): Promise<void>`: Encrypts profile data using Web Crypto API.

---

## 2. `CalorieRecognizer` (`calorie-calculator.js`)
Visual feature classifier for food detection.

### Methods:
- `analyzeFrame(canvas: HTMLCanvasElement): Promise<AnalysisResult>`:
  - Extracts RGB/HSL color histograms, texture density, and aspect volume.
  - Returns best matched food item, estimated calories, confidence score, and ±15% error margin bounds.

---

## 3. `AnalyticsEngine` (`analytics.js`)
Summary metrics and report generator.

### Methods:
- `getDailySummary(dateStr?: string): Promise<DailySummary>`: Computes calories consumed, remaining, and macro totals (P, C, G).
- `getWeeklySummary(): Promise<WeeklySummary>`: Aggregates 7-day trend, weekly average, and streak count.
- `getMonthlySummary(): Promise<MonthlySummary>`: Aggregates 30-day compliance rate and monthly totals.
- `exportPDFReport(): Promise<void>`: Opens a printable document formatted for offline PDF saving.

---

## 4. `RecommendationSystem` (`recommendations.js`)
Smart advice and meal plan generator.

### Methods:
- `getSmartRecommendations(): Promise<Object>`: Evaluates budget and suggests optimal snacks and alerts.
- `generateTomorrowMealPlan(): Promise<Object>`: Generates a balanced 4-meal plan matching user goals.

---

## 5. `SecurityManager` (`utils.js`)
AES-GCM Web Crypto API encryption wrapper.

### Methods:
- `encryptData(plainText: string): Promise<string>`: Encrypts data using a 256-bit AES-GCM key.
- `decryptData(cipherPayload: string): Promise<string>`: Decrypts AES-GCM ciphertext payload.
