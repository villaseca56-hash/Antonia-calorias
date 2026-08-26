/**
 * Contador de Calorías Antonia - App Entrypoint
 * Bootstraps IndexedDB, Camera, AI Recognizer, PWA Service Worker & Event Handlers
 */

document.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 Launching Contador de Calorías Antonia (Bitepal Manhwa Edition)...');

  try {
    // 1. Initialize IndexedDB
    await window.foodDB.init();

    // 2. Initialize Core Modules
    window.appCamera = new CameraSystem('cameraVideo', 'cameraCanvas');
    window.appRecognizer = new CalorieRecognizer(window.foodDB);
    window.appAnalytics = new AnalyticsEngine(window.foodDB);
    window.appRecommendations = new RecommendationSystem(window.foodDB, window.appAnalytics);
    window.appUI = new UIController();

    // 3. Initialize UI
    window.appUI.init();

    // 4. Bind AI Camera Trigger Events
    const btnCapture = document.getElementById('btnCaptureScan');
    const filePicker = document.getElementById('cameraFileInput');

    if (btnCapture) {
      btnCapture.addEventListener('click', async () => {
        const canvas = window.appCamera.captureFrame();
        if (canvas) {
          await processImageScan(canvas);
        }
      });
    }

    if (filePicker) {
      filePicker.addEventListener('change', async (e) => {
        if (e.target.files.length > 0) {
          const canvas = await window.appCamera.handleFileUpload(e.target.files[0]);
          await processImageScan(canvas);
        }
      });
    }

    // 5. Register Service Worker for PWA Offline Capability
    if ('serviceWorker' in navigator) {
      try {
        const reg = await navigator.serviceWorker.register('sw.js');
        console.log('PWA ServiceWorker registered with scope:', reg.scope);
      } catch (swErr) {
        console.warn('ServiceWorker registration failed:', swErr);
      }
    }

  } catch (err) {
    console.error('Fatal initialization error:', err);
  }
});

async function processImageScan(canvas) {
  const resultContainer = document.getElementById('scanResultOverlay');
  if (resultContainer) {
    resultContainer.innerHTML = `<div style="text-align:center; padding:20px; font-weight:bold; color:var(--color-mauve);">Analizando imagen con Antonia AI... 🔍</div>`;
    resultContainer.style.display = 'block';
  }

  const match = await window.appRecognizer.analyzeFrame(canvas);

  if (match && resultContainer) {
    resultContainer.innerHTML = `
      <div class="comic-card" style="margin-top: 16px; background: #FFF;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <h3 style="color:var(--color-ink);">${match.food.name}</h3>
          <span class="badge-kawaii" style="background:var(--color-pastel-mint); border:1px solid #2B283A; padding:4px 8px; border-radius:12px; font-size:0.8rem; font-weight:bold;">
            ${match.confidence}% confianza (±15%)
          </span>
        </div>

        <div style="font-size: 1.8rem; font-weight: 900; color: var(--color-primary-pink); margin: 10px 0;">
          ${match.estimatedCalories} kcal
        </div>

        <p style="font-size: 0.88rem; color: var(--color-ink-muted);">
          Rango estimado (±15%): ${match.minCalories} - ${match.maxCalories} kcal<br>
          Porción base: ${match.portion} (P: ${match.protein}g | C: ${match.carbs}g | G: ${match.fat}g)
        </p>

        <div style="margin-top: 16px; display: flex; gap: 10px;">
          <button class="btn-kawaii" style="flex: 1;" onclick="window.appUI.openLogModalForFood(${match.food.id})">
            + Registrar esta comida
          </button>
        </div>
      </div>
    `;
  }
}
