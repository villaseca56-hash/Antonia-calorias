/**
 * Contador de Calorías Antonia - Analytics & PDF Export Engine
 * Daily, Weekly, Monthly Stats Summaries, Chart.js integrations & Client-Side PDF generation
 */

class AnalyticsEngine {
  constructor(database) {
    this.db = database;
    this.dailyChart = null;
    this.weeklyChart = null;
    this.monthlyChart = null;
  }

  async getDailySummary(dateStr = window.Utils.getTodayString()) {
    const logs = await this.db.getLogsByDate(dateStr);
    const goal = await this.db.getUserGoal();

    let totalCals = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;

    const meals = {
      Desayuno: { cals: 0, items: [] },
      Almuerzo: { cals: 0, items: [] },
      Cena: { cals: 0, items: [] },
      Snacks: { cals: 0, items: [] }
    };

    logs.forEach(log => {
      totalCals += log.calories || 0;
      totalProtein += log.protein || 0;
      totalCarbs += log.carbs || 0;
      totalFat += log.fat || 0;

      const type = log.mealType || 'Snacks';
      if (meals[type]) {
        meals[type].cals += log.calories || 0;
        meals[type].items.push(log);
      }
    });

    return {
      date: dateStr,
      goal,
      consumed: Math.round(totalCals),
      remaining: Math.max(0, Math.round(goal - totalCals)),
      isOverGoal: totalCals > goal,
      protein: window.Utils.round(totalProtein),
      carbs: window.Utils.round(totalCarbs),
      fat: window.Utils.round(totalFat),
      meals
    };
  }

  async getWeeklySummary() {
    const today = new Date();
    const days = [];
    let totalWeekCals = 0;
    let streakDays = 0;
    const goal = await this.db.getUserGoal();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const daySummary = await this.getDailySummary(dateStr);

      const dayName = d.toLocaleDateString('es-ES', { weekday: 'short' });
      days.push({
        date: dateStr,
        dayName: dayName.toUpperCase(),
        calories: daySummary.consumed,
        goalAchieved: daySummary.consumed >= (goal * 0.75) && daySummary.consumed <= (goal * 1.15)
      });

      totalWeekCals += daySummary.consumed;
      if (daySummary.consumed > 0) streakDays++;
    }

    return {
      days,
      weeklyAverage: Math.round(totalWeekCals / 7),
      activeStreak: streakDays,
      totalWeekCalories: totalWeekCals
    };
  }

  async getMonthlySummary() {
    const today = new Date();
    const daysInMonth = 30;
    const startDate = new Date();
    startDate.setDate(today.getDate() - 29);

    const startStr = startDate.toISOString().split('T')[0];
    const endStr = today.toISOString().split('T')[0];

    const logs = await this.db.getLogsRange(startStr, endStr);
    const goal = await this.db.getUserGoal();

    const dailyMap = {};
    logs.forEach(l => {
      dailyMap[l.date] = (dailyMap[l.date] || 0) + l.calories;
    });

    let monthTotal = 0;
    let daysTracked = 0;
    let compliantDays = 0;

    Object.keys(dailyMap).forEach(d => {
      const c = dailyMap[d];
      monthTotal += c;
      daysTracked++;
      if (c >= (goal * 0.75) && c <= (goal * 1.15)) compliantDays++;
    });

    return {
      daysTracked,
      compliantDays,
      monthlyTotalCalories: Math.round(monthTotal),
      dailyAverage: daysTracked > 0 ? Math.round(monthTotal / daysTracked) : 0,
      complianceRate: daysTracked > 0 ? Math.round((compliantDays / daysTracked) * 100) : 0
    };
  }

  renderDailyChart(canvasId, summary) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    if (this.dailyChart) this.dailyChart.destroy();

    // Use Chart.js if loaded, or custom Canvas fallback
    if (typeof Chart !== 'undefined') {
      this.dailyChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Proteínas (g)', 'Carbohidratos (g)', 'Grasas (g)'],
          datasets: [{
            data: [summary.protein, summary.carbs, summary.fat],
            backgroundColor: ['#FF7B9C', '#64DFDF', '#FFD166'],
            borderWidth: 2,
            borderColor: '#2B283A'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom', labels: { font: { family: 'Outfit', weight: 'bold' } } }
          }
        }
      });
    }
  }

  renderWeeklyChart(canvasId, weeklyData) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    if (this.weeklyChart) this.weeklyChart.destroy();

    if (typeof Chart !== 'undefined') {
      this.weeklyChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: weeklyData.days.map(d => d.dayName),
          datasets: [{
            label: 'Calorías Consumidas',
            data: weeklyData.days.map(d => d.calories),
            backgroundColor: '#FFB6C1',
            borderColor: '#2B283A',
            borderWidth: 2,
            borderRadius: 12
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } }
          }
        }
      });
    }
  }

  async exportPDFReport() {
    const daily = await this.getDailySummary();
    const weekly = await this.getWeeklySummary();
    const monthly = await this.getMonthlySummary();

    // Pure Client-Side HTML Print/PDF Generator Window
    const printWin = window.open('', '_blank');
    printWin.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Reporte Nutricional Antonia - ${daily.date}</title>
        <style>
          body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 40px; color: #2B283A; background: #FFF0F5; }
          .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 3px solid #2B283A; padding-bottom: 20px; }
          h1 { margin: 0; color: #FF7B9C; }
          .section { background: #FFFFFF; border: 2px solid #2B283A; border-radius: 16px; padding: 20px; margin-top: 20px; box-shadow: 4px 4px 0px #2B283A; }
          .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-top: 15px; }
          .card { background: #FFF0F5; padding: 15px; border-radius: 12px; border: 1.5px solid #2B283A; text-align: center; }
          .card-val { font-size: 1.6rem; font-weight: bold; margin-top: 5px; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th, td { border: 1px solid #2B283A; padding: 10px; text-align: left; }
          th { background: #FFD1DC; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1>Contador de Calorías Antonia</h1>
            <p>Reporte Oficial de Nutrición y Salud</p>
          </div>
          <div>
            <strong>Fecha:</strong> ${daily.date}<br>
            <strong>Meta Diaria:</strong> ${daily.goal} kcal
          </div>
        </div>

        <div class="section">
          <h2>Resumen Diario</h2>
          <div class="grid">
            <div class="card">
              <div>Consumido</div>
              <div class="card-val">${daily.consumed} kcal</div>
            </div>
            <div class="card">
              <div>Restante</div>
              <div class="card-val">${daily.remaining} kcal</div>
            </div>
            <div class="card">
              <div>Proteínas / Carbs / Grasas</div>
              <div class="card-val">${daily.protein}g / ${daily.carbs}g / ${daily.fat}g</div>
            </div>
          </div>
        </div>

        <div class="section">
          <h2>Resumen Semanal y Mensual</h2>
          <div class="grid">
            <div class="card">
              <div>Promedio Semanal</div>
              <div class="card-val">${weekly.weeklyAverage} kcal/día</div>
            </div>
            <div class="card">
              <div>Racha de Registro</div>
              <div class="card-val">${weekly.activeStreak} días</div>
            </div>
            <div class="card">
              <div>Tasa Cumplimiento Mensual</div>
              <div class="card-val">${monthly.complianceRate}%</div>
            </div>
          </div>
        </div>

        <script>
          window.onload = function() { window.print(); };
        </script>
      </body>
      </html>
    `);
    printWin.document.close();
  }
}

window.AnalyticsEngine = AnalyticsEngine;
