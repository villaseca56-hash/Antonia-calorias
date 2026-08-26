/**
 * Contador de Calorías Antonia - Integrated Camera System Module
 * Direct device camera access, frame capture, flash effect & photo file picker fallback
 */

class CameraSystem {
  constructor(videoElementId, canvasElementId) {
    this.video = document.getElementById(videoElementId);
    this.canvas = document.getElementById(canvasElementId);
    this.stream = null;
    this.active = false;
  }

  async startCamera() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.warn('getUserMedia not supported on this browser/environment');
      return false;
    }

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      if (this.video) {
        this.video.srcObject = this.stream;
        await this.video.play();
        this.active = true;
        return true;
      }
    } catch (err) {
      console.warn('Camera access denied or unavailable:', err.message);
      return false;
    }
    return false;
  }

  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    this.active = false;
  }

  captureFrame() {
    if (!this.canvas) return null;
    const ctx = this.canvas.getContext('2d');

    if (this.active && this.video && this.video.videoWidth > 0) {
      this.canvas.width = this.video.videoWidth;
      this.canvas.height = this.video.videoHeight;
      ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
    } else {
      // Fallback: Generate a sample food pattern on canvas if camera is not active
      this.canvas.width = 400;
      this.canvas.height = 400;
      this.drawFallbackFoodGraphic(ctx, 400, 400);
    }

    this.triggerShutterFlash();
    return this.canvas;
  }

  triggerShutterFlash() {
    const flashEl = document.createElement('div');
    flashEl.style.position = 'fixed';
    flashEl.style.top = '0';
    flashEl.style.left = '0';
    flashEl.style.width = '100vw';
    flashEl.style.height = '100vh';
    flashEl.style.background = '#FFFFFF';
    flashEl.style.zIndex = '99999';
    flashEl.style.opacity = '0.8';
    flashEl.style.transition = 'opacity 0.25s ease';
    document.body.appendChild(flashEl);

    setTimeout(() => {
      flashEl.style.opacity = '0';
      setTimeout(() => flashEl.remove(), 250);
    }, 50);
  }

  drawFallbackFoodGraphic(ctx, w, h) {
    // Render a appetizing pastel food bowl illustration for offline/no-camera demonstration
    ctx.fillStyle = '#FFF0F5';
    ctx.fillRect(0, 0, w, h);

    // Bowl
    ctx.fillStyle = '#E6E6FA';
    ctx.beginPath();
    ctx.arc(w / 2, h / 2 + 20, 130, 0, Math.PI);
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#2B283A';
    ctx.stroke();

    // Food items inside bowl
    // Salmon / Protein
    ctx.fillStyle = '#FF7B9C';
    ctx.beginPath(); ctx.arc(w / 2 - 40, h / 2 - 10, 40, 0, Math.PI * 2); ctx.fill();
    // Greens
    ctx.fillStyle = '#98FB98';
    ctx.beginPath(); ctx.arc(w / 2 + 30, h / 2 - 20, 45, 0, Math.PI * 2); ctx.fill();
    // Rice / Carbs
    ctx.fillStyle = '#FDFBF7';
    ctx.beginPath(); ctx.arc(w / 2, h / 2 + 30, 50, 0, Math.PI * 2); ctx.fill();
  }

  handleFileUpload(file) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        if (this.canvas) {
          this.canvas.width = img.width;
          this.canvas.height = img.height;
          const ctx = this.canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          resolve(this.canvas);
        }
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }
}

window.CameraSystem = CameraSystem;
