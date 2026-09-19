/**
 * crop.ts — Image Crop Controller
 *
 * Two modes:
 *  - "rect"    : drag to draw a rectangle (default)
 *  - "polygon" : tap/click to add corner points, close shape to confirm
 *
 * Usage:
 *   const crop = new CropController(container, imageDataUrl, onConfirm, onSkip);
 *   crop.show();
 *
 * onConfirm receives a cropped image as a data URL string.
 */

export type CropMode = "rect" | "polygon";

export class CropController {
  private container: HTMLElement;
  private srcDataUrl: string;
  private onConfirm: (croppedDataUrl: string) => void;
  private onSkip: () => void;

  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private img: HTMLImageElement | null = null;

  private mode: CropMode = "rect";

  // Rect mode state
  private rectStart: { x: number; y: number } | null = null;
  private rectCurrent: { x: number; y: number } | null = null;
  private isDragging = false;

  // Polygon mode state
  private polyPoints: { x: number; y: number }[] = [];
  private polyClosed = false;

  // Scale factors (canvas CSS px vs image px)
  private scaleX = 1;
  private scaleY = 1;

  constructor(
    container: HTMLElement,
    srcDataUrl: string,
    onConfirm: (croppedDataUrl: string) => void,
    onSkip: () => void,
  ) {
    this.container = container;
    this.srcDataUrl = srcDataUrl;
    this.onConfirm = onConfirm;
    this.onSkip = onSkip;
  }

  // ─── Public API ───────────────────────────────────────────────────────────

  public show(): void {
    this.buildUI();
  }

  public destroy(): void {
    this.container.innerHTML = "";
    this.container.style.display = "none";
  }

  // ─── UI Construction ──────────────────────────────────────────────────────

  private buildUI(): void {
    this.container.innerHTML = "";
    this.container.style.display = "flex";

    // Mode buttons row
    const modeRow = document.createElement("div");
    modeRow.className = "crop-mode-row";

    const btnRect = document.createElement("button");
    btnRect.className = "crop-mode-btn active";
    btnRect.textContent = "Rectangle";
    btnRect.onclick = () => this.switchMode("rect", btnRect, btnPoly);

    const btnPoly = document.createElement("button");
    btnPoly.className = "crop-mode-btn";
    btnPoly.textContent = "Polygon (Tap Points)";
    btnPoly.onclick = () => this.switchMode("polygon", btnRect, btnPoly);

    modeRow.append(btnRect, btnPoly);

    // Hint text
    const hint = document.createElement("p");
    hint.className = "crop-hint";
    hint.id = "crop-hint-text";
    hint.textContent = "Drag to select the area you want.";

    // Canvas wrapper
    const wrapper = document.createElement("div");
    wrapper.className = "crop-canvas-wrapper";

    const canvas = document.createElement("canvas");
    canvas.className = "crop-canvas";
    canvas.id = "crop-canvas";
    wrapper.appendChild(canvas);
    this.canvas = canvas;

    // Action row
    const actionRow = document.createElement("div");
    actionRow.className = "crop-action-row";

    const btnUndo = document.createElement("button");
    btnUndo.className = "crop-action-btn secondary";
    btnUndo.id = "crop-undo-btn";
    btnUndo.textContent = "↩ Undo Point";
    btnUndo.style.display = "none";
    btnUndo.onclick = () => this.undoPolyPoint();

    const btnSkip = document.createElement("button");
    btnSkip.className = "crop-action-btn secondary";
    btnSkip.textContent = "Skip Crop";
    btnSkip.onclick = () => {
      this.destroy();
      this.onSkip();
    };

    const btnConfirm = document.createElement("button");
    btnConfirm.className = "crop-action-btn primary";
    btnConfirm.id = "crop-confirm-btn";
    btnConfirm.textContent = "✓ Confirm Crop";
    btnConfirm.onclick = () => this.confirmCrop();

    actionRow.append(btnUndo, btnSkip, btnConfirm);

    this.container.append(modeRow, hint, wrapper, actionRow);

    // Load image onto canvas
    this.loadImage();
  }

  private loadImage(): void {
    const img = new Image();
    img.onload = () => {
      this.img = img;
      this.setupCanvas(img);
    };
    img.src = this.srcDataUrl;
  }

  private setupCanvas(img: HTMLImageElement): void {
    const canvas = this.canvas!;
    const wrapper = canvas.parentElement!;

    const maxW = wrapper.clientWidth || window.innerWidth - 32;
    const maxH = Math.min(window.innerHeight * 0.55, 500);

    const ratio = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight, 1);
    const dispW = Math.round(img.naturalWidth * ratio);
    const dispH = Math.round(img.naturalHeight * ratio);

    canvas.width = dispW;
    canvas.height = dispH;
    canvas.style.width = dispW + "px";
    canvas.style.height = dispH + "px";

    this.scaleX = img.naturalWidth / dispW;
    this.scaleY = img.naturalHeight / dispH;

    this.ctx = canvas.getContext("2d")!;
    this.redraw();

    this.bindEvents(canvas);
  }

  // ─── Event Binding ────────────────────────────────────────────────────────

  private bindEvents(canvas: HTMLCanvasElement): void {
    // Mouse
    canvas.addEventListener("mousedown", (e) => this.onPointerDown(e.offsetX, e.offsetY));
    canvas.addEventListener("mousemove", (e) => this.onPointerMove(e.offsetX, e.offsetY));
    canvas.addEventListener("mouseup", () => this.onPointerUp());

    // Touch
    canvas.addEventListener("touchstart", (e) => {
      e.preventDefault();
      const pt = this.getTouchPos(e);
      this.onPointerDown(pt.x, pt.y);
    }, { passive: false });
    canvas.addEventListener("touchmove", (e) => {
      e.preventDefault();
      const pt = this.getTouchPos(e);
      this.onPointerMove(pt.x, pt.y);
    }, { passive: false });
    canvas.addEventListener("touchend", (e) => {
      e.preventDefault();
      this.onPointerUp();
    }, { passive: false });
  }

  private getTouchPos(e: TouchEvent): { x: number; y: number } {
    const rect = this.canvas!.getBoundingClientRect();
    const touch = e.touches[0] || e.changedTouches[0];
    return {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top,
    };
  }

  // ─── Pointer Handlers ─────────────────────────────────────────────────────

  private onPointerDown(x: number, y: number): void {
    if (this.mode === "rect") {
      this.isDragging = true;
      this.rectStart = { x, y };
      this.rectCurrent = { x, y };
    } else {
      // Polygon: check if user clicked near first point to close
      if (this.polyPoints.length >= 3) {
        const first = this.polyPoints[0];
        const dist = Math.hypot(x - first.x, y - first.y);
        if (dist < 18) {
          this.polyClosed = true;
          this.redraw();
          return;
        }
      }
      if (!this.polyClosed) {
        this.polyPoints.push({ x, y });
        this.updateUndoBtn();
        this.redraw();
      }
    }
  }

  private onPointerMove(x: number, y: number): void {
    if (this.mode === "rect" && this.isDragging) {
      this.rectCurrent = { x, y };
      this.redraw();
    }
  }

  private onPointerUp(): void {
    if (this.mode === "rect") {
      this.isDragging = false;
    }
  }

  // ─── Mode Switching ───────────────────────────────────────────────────────

  private switchMode(mode: CropMode, btnRect: HTMLButtonElement, btnPoly: HTMLButtonElement): void {
    this.mode = mode;
    this.rectStart = null;
    this.rectCurrent = null;
    this.polyPoints = [];
    this.polyClosed = false;
    this.isDragging = false;

    btnRect.classList.toggle("active", mode === "rect");
    btnPoly.classList.toggle("active", mode === "polygon");

    const hint = document.getElementById("crop-hint-text");
    if (hint) {
      hint.textContent =
        mode === "rect"
          ? "Drag to select the area you want."
          : "Tap around the area to add points. Tap near the first point to close.";
    }

    this.updateUndoBtn();
    this.redraw();
  }

  private undoPolyPoint(): void {
    if (this.polyClosed) {
      this.polyClosed = false;
    } else {
      this.polyPoints.pop();
    }
    this.updateUndoBtn();
    this.redraw();
  }

  private updateUndoBtn(): void {
    const btn = document.getElementById("crop-undo-btn") as HTMLButtonElement | null;
    if (btn) {
      btn.style.display = this.mode === "polygon" && this.polyPoints.length > 0 ? "" : "none";
    }
  }

  // ─── Draw ─────────────────────────────────────────────────────────────────

  private redraw(): void {
    const ctx = this.ctx;
    const canvas = this.canvas;
    const img = this.img;
    if (!ctx || !canvas || !img) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    if (this.mode === "rect") {
      this.drawRectOverlay(ctx);
    } else {
      this.drawPolyOverlay(ctx);
    }
  }

  private drawRectOverlay(ctx: CanvasRenderingContext2D): void {
    if (!this.rectStart || !this.rectCurrent) return;

    const x = Math.min(this.rectStart.x, this.rectCurrent.x);
    const y = Math.min(this.rectStart.y, this.rectCurrent.y);
    const w = Math.abs(this.rectCurrent.x - this.rectStart.x);
    const h = Math.abs(this.rectCurrent.y - this.rectStart.y);

    // Dim outside
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillRect(0, 0, this.canvas!.width, this.canvas!.height);

    // Clear crop area
    ctx.clearRect(x, y, w, h);
    ctx.drawImage(this.img!, x, y, w * this.scaleX, h * this.scaleY, x, y, w, h);

    // Border
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);

    // Handles
    const handles = [
      [x, y], [x + w, y], [x, y + h], [x + w, y + h],
      [x + w / 2, y], [x + w / 2, y + h], [x, y + h / 2], [x + w, y + h / 2],
    ];
    ctx.fillStyle = "#38bdf8";
    handles.forEach(([hx, hy]) => {
      ctx.beginPath();
      ctx.arc(hx, hy, 5, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  private drawPolyOverlay(ctx: CanvasRenderingContext2D): void {
    if (this.polyPoints.length === 0) return;

    ctx.save();

    if (this.polyClosed) {
      // Dim outside polygon
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      ctx.fillRect(0, 0, this.canvas!.width, this.canvas!.height);

      // Cut out inside
      ctx.globalCompositeOperation = "destination-out";
      ctx.beginPath();
      ctx.moveTo(this.polyPoints[0].x, this.polyPoints[0].y);
      this.polyPoints.slice(1).forEach((p) => ctx.lineTo(p.x, p.y));
      ctx.closePath();
      ctx.fill();

      ctx.globalCompositeOperation = "source-over";

      // Redraw image inside polygon
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(this.polyPoints[0].x, this.polyPoints[0].y);
      this.polyPoints.slice(1).forEach((p) => ctx.lineTo(p.x, p.y));
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(this.img!, 0, 0, this.canvas!.width, this.canvas!.height);
      ctx.restore();
    }

    // Draw polygon outline
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 2;
    ctx.setLineDash(this.polyClosed ? [] : [6, 3]);
    ctx.beginPath();
    ctx.moveTo(this.polyPoints[0].x, this.polyPoints[0].y);
    this.polyPoints.slice(1).forEach((p) => ctx.lineTo(p.x, p.y));
    if (this.polyClosed) ctx.closePath();
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw point handles
    this.polyPoints.forEach((p, i) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, i === 0 ? 8 : 5, 0, Math.PI * 2);
      ctx.fillStyle = i === 0 ? "#f59e0b" : "#38bdf8";
      ctx.fill();
    });

    ctx.restore();
  }

  // ─── Crop Extraction ──────────────────────────────────────────────────────

  private confirmCrop(): void {
    const img = this.img;
    if (!img) return;

    if (this.mode === "rect") {
      if (!this.rectStart || !this.rectCurrent) {
        // Nothing drawn — treat as skip
        this.destroy();
        this.onSkip();
        return;
      }

      const x = Math.round(Math.min(this.rectStart.x, this.rectCurrent.x) * this.scaleX);
      const y = Math.round(Math.min(this.rectStart.y, this.rectCurrent.y) * this.scaleY);
      const w = Math.round(Math.abs(this.rectCurrent.x - this.rectStart.x) * this.scaleX);
      const h = Math.round(Math.abs(this.rectCurrent.y - this.rectStart.y) * this.scaleY);

      if (w < 10 || h < 10) {
        this.destroy();
        this.onSkip();
        return;
      }

      const out = document.createElement("canvas");
      out.width = w;
      out.height = h;
      out.getContext("2d")!.drawImage(img, x, y, w, h, 0, 0, w, h);
      this.destroy();
      this.onConfirm(out.toDataURL("image/jpeg", 0.92));
    } else {
      // Polygon crop
      if (this.polyPoints.length < 3) {
        this.destroy();
        this.onSkip();
        return;
      }

      // Compute bounding box of polygon (in image coords)
      const ptsImg = this.polyPoints.map((p) => ({
        x: p.x * this.scaleX,
        y: p.y * this.scaleY,
      }));
      const minX = Math.max(0, Math.floor(Math.min(...ptsImg.map((p) => p.x))));
      const minY = Math.max(0, Math.floor(Math.min(...ptsImg.map((p) => p.y))));
      const maxX = Math.min(img.naturalWidth, Math.ceil(Math.max(...ptsImg.map((p) => p.x))));
      const maxY = Math.min(img.naturalHeight, Math.ceil(Math.max(...ptsImg.map((p) => p.y))));
      const bw = maxX - minX;
      const bh = maxY - minY;

      const out = document.createElement("canvas");
      out.width = bw;
      out.height = bh;
      const octx = out.getContext("2d")!;

      // White background (for clean OCR)
      octx.fillStyle = "#ffffff";
      octx.fillRect(0, 0, bw, bh);

      // Clip to polygon
      octx.save();
      octx.beginPath();
      octx.moveTo(ptsImg[0].x - minX, ptsImg[0].y - minY);
      ptsImg.slice(1).forEach((p) => octx.lineTo(p.x - minX, p.y - minY));
      octx.closePath();
      octx.clip();
      octx.drawImage(img, minX, minY, bw, bh, 0, 0, bw, bh);
      octx.restore();

      this.destroy();
      this.onConfirm(out.toDataURL("image/jpeg", 0.92));
    }
  }
}
