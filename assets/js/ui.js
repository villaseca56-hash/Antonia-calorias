/**
 * Contador de Calorías Antonia - UI Controller & View Router
 * Handles mascot animations, dynamic DOM updates, food search autocomplete, modals & alerts
 */

class UIController {
  constructor() {
    this.currentView = 'dashboardView';
    this.selectedMealType = 'Desayuno';
  }

  init() {
    this.bindNavigationEvents();
    this.bindWaterEvents();
    this.bindSearchEvents();
    this.bindModalEvents();
    this.bindBackupEvents();
    this.refreshDashboard();

    // EventBus Subscriptions
    window.appEvents.on('logsUpdated', () => this.refreshDashboard());
    window.appEvents.on('waterUpdated', () => this.refreshWaterIntake());
    window.appEvents.on('goalUpdated', () => this.refreshDashboard());
  }

  bindNavigationEvents() {
    document.querySelectorAll('.nav-item').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const targetView = btn.getAttribute('data-view');
        if (targetView) this.switchView(targetView);
      });
    });
  }

  switchView(viewId) {
    document.querySelectorAll('.view-page').forEach(page => page.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));

    const targetPage = document.getElementById(viewId);
    const targetNavBtn = document.querySelector(`.nav-item[data-view="${viewId}"]`);

    if (targetPage) targetPage.classList.add('active');
    if (targetNavBtn) targetNavBtn.classList.add('active');

    this.currentView = viewId;

    // View specific initialization
    if (viewId === 'cameraView') {
      window.appCamera.startCamera();
      this.updateMascot('analyst', '¡Apunta la cámara a tu comida para estimar las calorías!');
    } else {
      window.appCamera.stopCamera();
    }

    if (viewId === 'analyticsView') {
      this.refreshAnalyticsView();
      this.updateMascot('analyst', '¡Mira tus estadísticas completas y exporta tu reporte PDF!');
    }

    if (viewId === 'recommendationsView') {
      this.refreshRecommendationsView();
      this.updateMascot('happy', '¡Aquí tienes recomendaciones personalizadas y tu plan para mañana!');
    }

    if (viewId === 'logsView') {
      this.refreshLogsView();
    }
  }

  async refreshDashboard() {
    const summary = await window.appAnalytics.getDailySummary();

    // 1. Calorie Progress Ring
    const consumedEl = document.getElementById('ringConsumed');
    const targetEl = document.getElementById('ringTarget');
    const progressCircle = document.getElementById('ringProgressCircle');

    if (consumedEl) consumedEl.textContent = summary.consumed;
    if (targetEl) targetEl.textContent = `Meta: ${summary.goal} kcal`;

    if (progressCircle) {
      const radius = 90;
      const circumference = 2 * Math.PI * radius; // ~565
      const percent = Math.min(1, summary.consumed / summary.goal);
      const offset = circumference - (percent * circumference);
      progressCircle.style.strokeDashoffset = offset;
    }

    // 2. Macro Bars
    const protVal = document.getElementById('macroProteinVal');
    const carbVal = document.getElementById('macroCarbsVal');
    const fatVal = document.getElementById('macroFatVal');
    const protFill = document.getElementById('macroProteinFill');
    const carbFill = document.getElementById('macroCarbsFill');
    const fatFill = document.getElementById('macroFatFill');

    if (protVal) protVal.textContent = `${summary.protein}g`;
    if (carbVal) carbVal.textContent = `${summary.carbs}g`;
    if (fatVal) fatVal.textContent = `${summary.fat}g`;

    // Estimate macro targets: Protein ~ 25%, Carbs ~ 50%, Fat ~ 25% of calories
    const targetProtGrams = Math.round((summary.goal * 0.25) / 4);
    const targetCarbGrams = Math.round((summary.goal * 0.50) / 4);
    const targetFatGrams = Math.round((summary.goal * 0.25) / 9);

    if (protFill) protFill.style.width = `${Math.min(100, (summary.protein / targetProtGrams) * 100)}%`;
    if (carbFill) carbFill.style.width = `${Math.min(100, (summary.carbs / targetCarbGrams) * 100)}%`;
    if (fatFill) fatFill.style.width = `${Math.min(100, (summary.fat / targetFatGrams) * 100)}%`;

    // 3. Meal Slots Calories
    ['Desayuno', 'Almuerzo', 'Cena', 'Snacks'].forEach(type => {
      const el = document.getElementById(`mealSlotCals_${type}`);
      if (el) el.textContent = `${summary.meals[type].cals} kcal`;
    });

    // 4. Mascot Speech & Expression
    if (summary.isOverGoal) {
      this.updateMascot('analyst', `¡Has consumido ${summary.consumed} kcal! Superaste la meta diaria por ${summary.consumed - summary.goal} kcal. ¡Toma agua y mantén el equilibrio!`);
    } else if (summary.remaining <= 300) {
      this.updateMascot('happy', `¡Excelente trabajo! Te quedan ${summary.remaining} kcal para completar el día.`);
    } else {
      this.updateMascot('eating', `¡Hola! Llevas ${summary.consumed} kcal de tu meta de ${summary.goal} kcal. ¿Qué comeremos hoy?`);
    }

    this.refreshWaterIntake();
  }

  async refreshWaterIntake() {
    const glasses = await window.foodDB.getWaterIntake(window.Utils.getTodayString());
    const countEl = document.getElementById('waterCount');
    if (countEl) countEl.textContent = `${glasses} / 8 vasos (${glasses * 250} ml)`;
  }

  bindWaterEvents() {
    const btnAdd = document.getElementById('btnWaterAdd');
    const btnSub = document.getElementById('btnWaterSub');

    if (btnAdd) {
      btnAdd.addEventListener('click', async () => {
        const cur = await window.foodDB.getWaterIntake(window.Utils.getTodayString());
        await window.foodDB.setWaterIntake(window.Utils.getTodayString(), cur + 1);
      });
    }

    if (btnSub) {
      btnSub.addEventListener('click', async () => {
        const cur = await window.foodDB.getWaterIntake(window.Utils.getTodayString());
        await window.foodDB.setWaterIntake(window.Utils.getTodayString(), Math.max(0, cur - 1));
      });
    }
  }

  updateMascot(expression, message) {
    const imgEl = document.getElementById('mascotImage');
    const textEl = document.getElementById('mascotSpeech');

    if (imgEl) {
      const srcMap = {
        happy: 'assets/images/characters/antonia_happy.png',
        eating: 'assets/images/characters/antonia_eating.png',
        analyst: 'assets/images/characters/antonia_analyst.png'
      };
      imgEl.src = srcMap[expression] || srcMap.happy;
    }

    if (textEl) textEl.textContent = message;
  }

  // Food Search & Manual Log Binding
  bindSearchEvents() {
    const searchInput = document.getElementById('foodSearchInput');
    const categorySelect = document.getElementById('foodCategoryFilter');

    if (searchInput) {
      searchInput.addEventListener('input', () => this.performFoodSearch());
    }
    if (categorySelect) {
      categorySelect.addEventListener('change', () => this.performFoodSearch());
    }
  }

  async performFoodSearch() {
    const searchInput = document.getElementById('foodSearchInput');
    const categorySelect = document.getElementById('foodCategoryFilter');
    const resultsContainer = document.getElementById('foodSearchResults');

    if (!resultsContainer) return;

    const query = searchInput ? searchInput.value : '';
    const cat = categorySelect ? categorySelect.value : 'Todos';

    const results = await window.foodDB.searchFoods(query, cat);
    resultsContainer.innerHTML = '';

    if (results.length === 0) {
      resultsContainer.innerHTML = `<div style="text-align:center; padding: 20px; color: var(--color-ink-muted);">No se encontraron alimentos en la base de datos (516 cargados).</div>`;
      return;
    }

    results.slice(0, 30).forEach(food => {
      const card = document.createElement('div');
      card.className = 'comic-card';
      card.style.padding = '14px';
      card.style.marginBottom = '10px';
      card.style.display = 'flex';
      card.style.alignItems = 'center';
      card.style.justifySpaceBetween = 'space-between';

      card.innerHTML = `
        <div style="flex: 1;">
          <strong style="font-size: 1rem;">${food.name}</strong>
          <div style="font-size: 0.8rem; color: var(--color-ink-muted); margin-top: 4px;">
            ${food.portion} • <span style="color: var(--color-mauve); font-weight: bold;">${food.calories} kcal</span>
            (P: ${food.protein}g | C: ${food.carbs}g | G: ${food.fat}g)
          </div>
        </div>
        <button class="btn-kawaii" style="padding: 6px 14px; font-size: 0.85rem;" onclick="window.appUI.openLogModalForFood(${food.id})">
          + Agregar
        </button>
      `;
      resultsContainer.appendChild(card);
    });
  }

  async openLogModalForFood(foodId) {
    const foods = await window.foodDB.getAllFoods();
    const food = foods.find(f => f.id === foodId);
    if (!food) return;

    this.currentSelectedFood = food;
    const modal = document.getElementById('logFoodModal');
    const titleEl = document.getElementById('modalFoodTitle');
    const calsEl = document.getElementById('modalFoodCals');
    const amountInput = document.getElementById('modalFoodAmount');

    if (titleEl) titleEl.textContent = food.name;
    if (calsEl) calsEl.textContent = `${food.calories} kcal por ${food.portion}`;
    if (amountInput) amountInput.value = 1;

    if (modal) modal.classList.add('active');
  }

  bindModalEvents() {
    const closeBtn = document.getElementById('btnCloseModal');
    const confirmBtn = document.getElementById('btnConfirmAddFood');

    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        document.getElementById('logFoodModal').classList.remove('active');
      });
    }

    if (confirmBtn) {
      confirmBtn.addEventListener('click', async () => {
        if (!this.currentSelectedFood) return;

        const amountInput = document.getElementById('modalFoodAmount');
        const mealTypeSelect = document.getElementById('modalMealTypeSelect');

        const mult = parseFloat(amountInput.value) || 1;
        const mealType = mealTypeSelect ? mealTypeSelect.value : 'Desayuno';

        const logItem = {
          date: window.Utils.getTodayString(),
          mealType: mealType,
          foodId: this.currentSelectedFood.id,
          foodName: this.currentSelectedFood.name,
          calories: Math.round(this.currentSelectedFood.calories * mult),
          protein: window.Utils.round(this.currentSelectedFood.protein * mult),
          carbs: window.Utils.round(this.currentSelectedFood.carbs * mult),
          fat: window.Utils.round(this.currentSelectedFood.fat * mult),
          portion: `${mult}x (${this.currentSelectedFood.portion})`,
          amount: mult
        };

        await window.foodDB.addMealLog(logItem);
        document.getElementById('logFoodModal').classList.remove('active');
        this.switchView('dashboardView');
      });
    }
  }

  async refreshLogsView() {
    const dateInput = document.getElementById('logDateSelector');
    const selectedDate = dateInput && dateInput.value ? dateInput.value : window.Utils.getTodayString();
    if (dateInput && !dateInput.value) dateInput.value = selectedDate;

    const logs = await window.foodDB.getLogsByDate(selectedDate);
    const container = document.getElementById('loggedMealsList');
    if (!container) return;

    container.innerHTML = '';
    if (logs.length === 0) {
      container.innerHTML = `<div style="text-align:center; padding: 24px; color: var(--color-ink-muted);">No hay comidas registradas para este día.</div>`;
      return;
    }

    logs.forEach(log => {
      const item = document.createElement('div');
      item.className = 'comic-card';
      item.style.padding = '14px';
      item.style.marginBottom = '10px';
      item.style.display = 'flex';
      item.style.alignItems = 'center';
      item.style.justifyContent = 'space-between';

      item.innerHTML = `
        <div>
          <span class="badge-kawaii" style="background: var(--color-soft-rose); border: 1px solid var(--color-ink); padding: 2px 8px; border-radius: 10px; font-size: 0.75rem; font-weight: bold;">${log.mealType}</span>
          <h4 style="margin-top: 4px; font-size: 1rem;">${log.foodName}</h4>
          <div style="font-size: 0.82rem; color: var(--color-ink-muted);">
            ${log.portion} • <strong style="color: var(--color-ink);">${log.calories} kcal</strong> (P: ${log.protein}g, C: ${log.carbs}g, G: ${log.fat}g)
          </div>
        </div>
        <button class="btn-icon" onclick="window.appUI.deleteLogItem(${log.id}, '${log.date}')">🗑️</button>
      `;
      container.appendChild(item);
    });
  }

  async deleteLogItem(id, date) {
    await window.foodDB.deleteMealLog(id, date);
    this.refreshLogsView();
  }

  async refreshAnalyticsView() {
    const daily = await window.appAnalytics.getDailySummary();
    const weekly = await window.appAnalytics.getWeeklySummary();
    const monthly = await window.appAnalytics.getMonthlySummary();

    const avgEl = document.getElementById('weeklyAvgCals');
    const streakEl = document.getElementById('streakDaysCount');
    const monthCompEl = document.getElementById('monthlyComplianceRate');

    if (avgEl) avgEl.textContent = `${weekly.weeklyAverage} kcal`;
    if (streakEl) streakEl.textContent = `${weekly.activeStreak} días`;
    if (monthCompEl) monthCompEl.textContent = `${monthly.complianceRate}%`;

    window.appAnalytics.renderDailyChart('dailyChart', daily);
    window.appAnalytics.renderWeeklyChart('weeklyChart', weekly);
  }

  async refreshRecommendationsView() {
    const data = await window.appRecommendations.getSmartRecommendations();
    const tomorrowPlan = await window.appRecommendations.generateTomorrowMealPlan();

    const alertsContainer = document.getElementById('recommendationAlerts');
    const snacksContainer = document.getElementById('suggestedSnacksList');
    const planContainer = document.getElementById('tomorrowMealPlan');

    if (alertsContainer) {
      alertsContainer.innerHTML = '';
      data.alerts.forEach(a => {
        const div = document.createElement('div');
        div.className = 'comic-card';
        div.style.background = 'linear-gradient(135deg, #FFF0F5 0%, #FFD1DC 100%)';
        div.style.marginBottom = '10px';
        div.innerHTML = `<strong>${a.title}</strong><p style="font-size: 0.9rem; margin-top: 4px;">${a.message}</p>`;
        alertsContainer.appendChild(div);
      });
    }

    if (snacksContainer) {
      snacksContainer.innerHTML = '';
      data.suggestedSnacks.forEach(food => {
        const card = document.createElement('div');
        card.className = 'comic-card';
        card.style.padding = '12px';
        card.style.marginBottom = '8px';
        card.innerHTML = `
          <strong>${food.name}</strong> (${food.portion})
          <div style="color: var(--color-mauve); font-weight: bold;">${food.calories} kcal • Proteína: ${food.protein}g</div>
        `;
        snacksContainer.appendChild(card);
      });
    }

    if (planContainer) {
      planContainer.innerHTML = `
        <p style="font-weight: bold; margin-bottom: 10px;">Total estimado para mañana: ${tomorrowPlan.totalCalories} kcal</p>
      `;
      tomorrowPlan.meals.forEach(m => {
        const d = document.createElement('div');
        d.style.padding = '8px 0';
        d.style.borderBottom = '1px dashed rgba(0,0,0,0.1)';
        d.innerHTML = `<strong>${m.type}:</strong> ${m.item.name} (${m.item.calories} kcal)`;
        planContainer.appendChild(d);
      });
    }
  }

  bindBackupEvents() {
    const btnExport = document.getElementById('btnExportBackup');
    const fileImport = document.getElementById('fileImportBackup');
    const btnPDF = document.getElementById('btnExportPDF');
    const btnClear = document.getElementById('btnClearData');
    const btnSaveGoal = document.getElementById('btnSaveGoal');

    if (btnExport) {
      btnExport.addEventListener('click', async () => {
        const foods = await window.foodDB.getAllFoods();
        const logs = await window.foodDB.getLogsRange('2020-01-01', '2030-12-31');
        const goal = await window.foodDB.getUserGoal();
        const profile = await window.foodDB.getUserProfileEncrypted();

        window.Utils.exportBackupJSON({
          goal,
          profile,
          logs,
          foodsCount: foods.length
        });
      });
    }

    if (fileImport) {
      fileImport.addEventListener('change', async (e) => {
        if (!e.target.files.length) return;
        try {
          const imported = await window.Utils.readJSONFile(e.target.files[0]);
          if (imported.goal) await window.foodDB.setUserGoal(imported.goal);
          if (imported.logs) {
            for (const log of imported.logs) {
              await window.foodDB.addMealLog(log);
            }
          }
          alert('¡Copia de seguridad importada con éxito!');
          window.location.reload();
        } catch (err) {
          alert('Error al leer el archivo JSON.');
        }
      });
    }

    if (btnPDF) {
      btnPDF.addEventListener('click', () => {
        window.appAnalytics.exportPDFReport();
      });
    }

    if (btnClear) {
      btnClear.addEventListener('click', () => {
        if (confirm('¿Estás seguro de borrar todos los datos locales? Esta acción no se puede deshacer.')) {
          window.foodDB.clearAllData();
        }
      });
    }

    if (btnSaveGoal) {
      btnSaveGoal.addEventListener('click', async () => {
        const input = document.getElementById('userGoalInput');
        if (input && input.value) {
          await window.foodDB.setUserGoal(parseInt(input.value, 10));
          alert('¡Meta diaria de calorías actualizada!');
        }
      });
    }
  }
}

window.UIController = UIController;
