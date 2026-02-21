export class DrawingEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.isDrawing = false;
    this.enabled = true;

    this.ctx.lineWidth = 3;
    this.ctx.lineCap = "round";
    this.ctx.strokeStyle = "#111";

    this.initializeCanvas();
    this.bindEvents();
  }

  initializeCanvas() {
    this.ctx.fillStyle = "#ffffff";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  bindEvents() {
    this.canvas.addEventListener("pointerdown", (event) => this.startStroke(event));
    this.canvas.addEventListener("pointermove", (event) => this.draw(event));
    this.canvas.addEventListener("pointerup", () => this.endStroke());
    this.canvas.addEventListener("pointerleave", () => this.endStroke());
  }

  setEnabled(isEnabled) {
    this.enabled = isEnabled;
    this.isDrawing = false;
  }

  getPoint(event) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;

    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
  }

  startStroke(event) {
    if (!this.enabled) return;

    this.isDrawing = true;
    const point = this.getPoint(event);
    this.ctx.beginPath();
    this.ctx.moveTo(point.x, point.y);
  }

  draw(event) {
    if (!this.enabled || !this.isDrawing) return;

    const point = this.getPoint(event);
    this.ctx.lineTo(point.x, point.y);
    this.ctx.stroke();
  }

  endStroke() {
    this.isDrawing = false;
    this.ctx.closePath();
  }

  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.initializeCanvas();
  }

  captureDataUrl() {
    return this.canvas.toDataURL("image/png");
  }
}
