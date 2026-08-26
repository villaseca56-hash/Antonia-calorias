/**
 * Contador de Calorías Antonia - Smart AI Recommendation Engine
 * Recommends optimal foods based on remaining calories & macros,
 * generates tomorrow's suggested meal plan, and alerts users.
 */

class RecommendationSystem {
  constructor(database, analytics) {
    this.db = database;
    this.analytics = analytics;
  }

  async getSmartRecommendations() {
    const daily = await this.analytics.getDailySummary();
    const foods = await this.db.getAllFoods();
    const remainingCals = daily.remaining;

    const suggestions = [];
    const alerts = [];

    // Smart Alert Rules
    if (daily.isOverGoal) {
      alerts.push({
        type: 'warning',
        title: '¡Meta diaria superada!',
        message: `Has superado tu meta por ${daily.consumed - daily.goal} kcal. ¡Antonia sugiere una caminata suave de 20 minutos!`
      });
    } else if (remainingCals <= 250 && remainingCals > 0) {
      alerts.push({
        type: 'info',
        title: '¡Cerca de la meta!',
        message: `Te quedan ${remainingCals} kcal. Antonia sugiere un té o snack ligero.`
      });
    }

    // Macro balance advice
    const totalMacroGrams = daily.protein + daily.carbs + daily.fat;
    if (totalMacroGrams > 0) {
      const proteinPercent = (daily.protein * 4) / (daily.consumed || 1);
      if (proteinPercent < 0.20 && remainingCals > 150) {
        alerts.push({
          type: 'tip',
          title: 'Aumenta tus proteínas',
          message: 'Tu consumo de proteína está bajo el 20%. Antonia te recomienda agregar pavo, huevo o yogurt griego.'
        });
      }
    }

    // Food Suggestions matching remaining budget
    let eligibleFoods = foods.filter(f => f.calories <= remainingCals && f.calories > 30);
    
    // Sort by macro balance (prefer protein rich if low protein)
    eligibleFoods.sort((a, b) => b.protein - a.protein);

    // Pick top 4 recommendations
    const recommendedFoods = eligibleFoods.slice(0, 4);

    return {
      alerts,
      remainingCalories: remainingCals,
      suggestedSnacks: recommendedFoods
    };
  }

  async generateTomorrowMealPlan() {
    const goal = await this.db.getUserGoal();
    const foods = await this.db.getAllFoods();

    // Target breakdown: Desayuno 25%, Almuerzo 35%, Cena 25%, Snacks 15%
    const targetDesayuno = goal * 0.25;
    const targetAlmuerzo = goal * 0.35;
    const targetCena = goal * 0.25;
    const targetSnack = goal * 0.15;

    const pickClosestFood = (category, targetCals) => {
      const catFoods = foods.filter(f => f.category === category || f.tags.includes(category.toLowerCase()));
      if (catFoods.length === 0) return foods[0];
      return catFoods.reduce((prev, curr) => 
        Math.abs(curr.calories - targetCals) < Math.abs(prev.calories - targetCals) ? curr : prev
      );
    };

    const desayuno = pickClosestFood('Desayuno', targetDesayuno);
    const almuerzo = pickClosestFood('Platos Preparados', targetAlmuerzo);
    const cena = pickClosestFood('Carnes, Aves y Pescados', targetCena);
    const snack = pickClosestFood('Frutas', targetSnack);

    const totalPlanCals = desayuno.calories + almuerzo.calories + cena.calories + snack.calories;

    return {
      totalCalories: totalPlanCals,
      meals: [
        { type: 'Desayuno', item: desayuno },
        { type: 'Almuerzo', item: almuerzo },
        { type: 'Cena', item: cena },
        { type: 'Snack', item: snack }
      ]
    };
  }
}

window.RecommendationSystem = RecommendationSystem;
