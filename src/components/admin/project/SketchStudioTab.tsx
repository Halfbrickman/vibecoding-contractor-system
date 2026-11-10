"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Ruler,
  Pencil,
  Square,
  Maximize2,
  Minimize2,
  Save,
  Undo2,
  Redo2,
  Trash2,
  Grid,
  Image as ImageIcon,
  Type,
  Download,
  Plus,
  Compass,
  Sparkles,
  Layers,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Check,
  X,
  HelpCircle,
  FileEdit,
  ArrowUpRight,
  Move,
  RotateCw,
} from "lucide-react";
import { toast } from "sonner";

export type ToolType =
  | "WALL"
  | "RULER"
  | "DOOR"
  | "WINDOW"
  | "ARROW"
  | "FREEHAND"
  | "TEXT"
  | "ERASER";

export interface SketchElement {
  id: string;
  type: ToolType;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  points?: { x: number; y: number }[]; // for FREEHAND
  text?: string; // for TEXT
  color?: string;
  strokeWidth?: number;
  rotation?: number; // for TEXT: 0, 90, 180, 270
}

interface ProjectSketchRecord {
  id: string;
  title: string;
  roomName?: string | null;
  imageUrl: string;
  sketchData?: string | null;
  scaleMeters: number;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface SketchStudioTabProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  project: any;
  onRefresh: () => void;
}

const DEFAULT_GRID_SIZE = 40; // 40px per grid (misal 1 meter)

export default function SketchStudioTab({
  project,
  onRefresh,
}: SketchStudioTabProps) {
  const [sketches, setSketches] = useState<ProjectSketchRecord[]>(
    project.sketches || []
  );

  // Studio Mode: Apakah sedang membuka editor canvas
  const [isStudioOpen, setIsStudioOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentSketchId, setCurrentSketchId] = useState<string | null>(null);

  // Meta Info Sketsa yang sedang diedit
  const [sketchTitle, setSketchTitle] = useState("Denah Sketsa Lapangan");
  const [sketchRoom, setSketchRoom] = useState("Lantai 1");
  const [sketchNotes, setSketchNotes] = useState("");
  const [scaleMeters, setScaleMeters] = useState(1.0); // 1 grid = 1.0 meter

  // Canvas Tools State
  const [activeTool, setActiveTool] = useState<ToolType>("WALL");
  const [activeColor, setActiveColor] = useState("#0f172a"); // slate-900
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [penThickness, setPenThickness] = useState<number>(1.5); // 1.5 (Tipis), 3 (Sedang), 5 (Tebal)
  const [textFontSize, setTextFontSize] = useState<number>(14); // 11, 14, 18
  const [draggingTextId, setDraggingTextId] = useState<string | null>(null);
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [showDimensions, setShowDimensions] = useState(true);
  const [palmRejection, setPalmRejection] = useState(false); // Pen only

  // Zoom & Pan State
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [panMode, setPanMode] = useState(false); // PAN tool aktif

  // Elements & History
  const [elements, setElements] = useState<SketchElement[]>([]);
  const [history, setHistory] = useState<SketchElement[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentElement, setCurrentElement] = useState<SketchElement | null>(null);

  // Background Image (Foto Lapangan)
  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null);
  const [bgOpacity, setBgOpacity] = useState(0.5);

  // Saving state
  const [saving, setSaving] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  // References
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sinkronkan sketches jika prop project berubah
  useEffect(() => {
    if (project.sketches) {
      setSketches(project.sketches);
    }
  }, [project.sketches]);

  // Push State to History
  const pushToHistory = useCallback((newElements: SketchElement[]) => {
    setHistory((prev) => {
      const next = prev.slice(0, historyIndex + 1);
      return [...next, newElements];
    });
    setHistoryIndex((prev) => prev + 1);
  }, [historyIndex]);

  const handleUndo = () => {
    if (historyIndex > 0) {
      const nextIdx = historyIndex - 1;
      setHistoryIndex(nextIdx);
      setElements(history[nextIdx]);
    } else if (historyIndex === 0) {
      setHistoryIndex(-1);
      setElements([]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIdx = historyIndex + 1;
      setHistoryIndex(nextIdx);
      setElements(history[nextIdx]);
    }
  };

  // Mulai Studio Baru
  const handleOpenNewSketch = () => {
    setCurrentSketchId(null);
    setSketchTitle(`Sketsa Survei #${sketches.length + 1}`);
    setSketchRoom("Lantai 1");
    setSketchNotes("");
    setScaleMeters(1.0);
    setElements([]);
    setHistory([]);
    setHistoryIndex(-1);
    setBgImage(null);
    setZoomLevel(1.0);
    setPanOffset({ x: 0, y: 0 });
    setIsStudioOpen(true);
  };

  // Buka Studio dari Sketsa Lama (Edit)
  const handleEditSketch = (sketch: ProjectSketchRecord) => {
    setCurrentSketchId(sketch.id);
    setSketchTitle(sketch.title || "Sketsa Lapangan");
    setSketchRoom(sketch.roomName || "Lantai 1");
    setSketchNotes(sketch.notes || "");
    setScaleMeters(sketch.scaleMeters || 1.0);
    setBgImage(null);

    let parsedElements: SketchElement[] = [];
    if (sketch.sketchData) {
      try {
        parsedElements = JSON.parse(sketch.sketchData);
      } catch (err) {
        console.warn("Gagal mem-parse vector sketchData:", err);
      }
    }
    setElements(parsedElements);
    setHistory([parsedElements]);
    setHistoryIndex(0);
    setZoomLevel(1.0);
    setPanOffset({ x: 0, y: 0 });
    setIsStudioOpen(true);
  };

  // Hapus Sketsa
  const handleDeleteSketch = async (sketchId: string) => {
    if (!confirm("Hapus sketsa denah ini dari proyek?")) return;
    try {
      const res = await fetch(
        `/api/projects/${project.id}/extras?target=sketch&id=${sketchId}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        toast.success("Sketsa berhasil dihapus.");
        setSketches((prev) => prev.filter((s) => s.id !== sketchId));
        onRefresh();
      } else {
        toast.error("Gagal menghapus sketsa.");
      }
    } catch {
      toast.error("Terjadi kesalahan jaringan.");
    }
  };

  // Upload Foto Lapangan sebagai Background
  const handleUploadBgImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      setBgImage(img);
      toast.success("Foto lapangan dimuat sebagai latar belakang!");
    };
    img.src = url;
  };

  // Snap Coordinate to Grid
  const snap = useCallback(
    (val: number, step = DEFAULT_GRID_SIZE / 2) => {
      if (!snapToGrid) return val;
      return Math.round(val / step) * step;
    },
    [snapToGrid]
  );

  // Orthogonal Snapping (90° & 45°)
  const snapAngle = useCallback(
    (x1: number, y1: number, x2: number, y2: number) => {
      const dx = x2 - x1;
      const dy = y2 - y1;
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);
      const dist = Math.hypot(dx, dy);

      // Snap to 0, 90, 180, -90 (Tegak lurus sempurna) jika dalam toleransi 12 derajat
      const absAngle = Math.abs(angle);
      if (absAngle < 12 || absAngle > 168) {
        return { x: x2, y: y1 }; // Horizontal
      }
      if (Math.abs(absAngle - 90) < 12) {
        return { x: x1, y: y2 }; // Vertikal
      }
      // Snap to 45 degree
      if (Math.abs(absAngle - 45) < 8 || Math.abs(absAngle - 135) < 8) {
        const signX = dx >= 0 ? 1 : -1;
        const signY = dy >= 0 ? 1 : -1;
        const diag = (Math.abs(dx) + Math.abs(dy)) / 2;
        return { x: x1 + signX * diag, y: y1 + signY * diag };
      }

      return { x: x2, y: y2 };
    },
    []
  );

  // Redraw Canvas Utama
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Bersihkan canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Fill background (di luar transform zoom/pan)
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Terapkan transformasi Zoom & Pan
    ctx.save();
    ctx.translate(panOffset.x, panOffset.y);
    ctx.scale(zoomLevel, zoomLevel);

    // 1. Gambar Background Foto Lapangan (jika ada)
    if (bgImage) {
      ctx.save();
      ctx.globalAlpha = bgOpacity;
      // Gambar proporsional di tengah
      const canvasW = canvas.width / zoomLevel;
      const canvasH = canvas.height / zoomLevel;
      const ratio = Math.min(
        canvasW / bgImage.width,
        canvasH / bgImage.height
      );
      const w = bgImage.width * ratio;
      const h = bgImage.height * ratio;
      const x = (canvasW - w) / 2;
      const y = (canvasH - h) / 2;
      ctx.drawImage(bgImage, x, y, w, h);
      ctx.restore();
    }

    // 2. Gambar Grid Milimeter / Kotak Arsitek
    if (showGrid) {
      ctx.save();
      const step = DEFAULT_GRID_SIZE;
      const subStep = step / 2; // Kotak kecil 0.5m

      // Hitung batas grid yang terlihat berdasarkan zoom/pan
      const visibleStartX = -panOffset.x / zoomLevel;
      const visibleStartY = -panOffset.y / zoomLevel;
      const visibleEndX = visibleStartX + canvas.width / zoomLevel;
      const visibleEndY = visibleStartY + canvas.height / zoomLevel;

      const gridStartX = Math.floor(visibleStartX / subStep) * subStep;
      const gridStartY = Math.floor(visibleStartY / subStep) * subStep;
      const gridEndX = Math.ceil(visibleEndX / subStep) * subStep;
      const gridEndY = Math.ceil(visibleEndY / subStep) * subStep;

      // Sub-grid tipis
      ctx.beginPath();
      ctx.strokeStyle = "#f1f5f9"; // slate-100
      ctx.lineWidth = 1 / zoomLevel;
      for (let x = gridStartX; x <= gridEndX; x += subStep) {
        ctx.moveTo(x, gridStartY);
        ctx.lineTo(x, gridEndY);
      }
      for (let y = gridStartY; y <= gridEndY; y += subStep) {
        ctx.moveTo(gridStartX, y);
        ctx.lineTo(gridEndX, y);
      }
      ctx.stroke();

      // Main grid (tiap 1 meter)
      const mainStartX = Math.floor(visibleStartX / step) * step;
      const mainStartY = Math.floor(visibleStartY / step) * step;
      const mainEndX = Math.ceil(visibleEndX / step) * step;
      const mainEndY = Math.ceil(visibleEndY / step) * step;

      ctx.beginPath();
      ctx.strokeStyle = "#e2e8f0"; // slate-200
      ctx.lineWidth = 1.2 / zoomLevel;
      for (let x = mainStartX; x <= mainEndX; x += step) {
        ctx.moveTo(x, mainStartY);
        ctx.lineTo(x, mainEndY);
      }
      for (let y = mainStartY; y <= mainEndY; y += step) {
        ctx.moveTo(mainStartX, y);
        ctx.lineTo(mainEndX, y);
      }
      ctx.stroke();

      // Major grid (tiap 5 meter) - lebih kontras
      const majorStep = step * 5;
      const majorStartX = Math.floor(visibleStartX / majorStep) * majorStep;
      const majorStartY = Math.floor(visibleStartY / majorStep) * majorStep;
      const majorEndX = Math.ceil(visibleEndX / majorStep) * majorStep;
      const majorEndY = Math.ceil(visibleEndY / majorStep) * majorStep;

      ctx.beginPath();
      ctx.strokeStyle = "#cbd5e1"; // slate-300
      ctx.lineWidth = 1.5 / zoomLevel;
      for (let x = majorStartX; x <= majorEndX; x += majorStep) {
        ctx.moveTo(x, majorStartY);
        ctx.lineTo(x, majorEndY);
      }
      for (let y = majorStartY; y <= majorEndY; y += majorStep) {
        ctx.moveTo(majorStartX, y);
        ctx.lineTo(majorEndX, y);
      }
      ctx.stroke();
      ctx.restore();
    }

    // Helper untuk render satu element
    const renderElement = (el: SketchElement, isPreview = false) => {
      ctx.save();
      const color = el.color || "#0f172a";
      const width = el.strokeWidth || 4;

      if (isPreview) {
        ctx.setLineDash([6, 6]);
      }

      // --- WALL (Dinding Arsitektur) ---
      if (el.type === "WALL") {
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.lineCap = "square";
        ctx.beginPath();
        ctx.moveTo(el.x1, el.y1);
        ctx.lineTo(el.x2, el.y2);
        ctx.stroke();

        // Titik ujung dinding (Architectural Cross-ticks)
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(el.x1, el.y1, width / 1.5, 0, Math.PI * 2);
        ctx.arc(el.x2, el.y2, width / 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Label Ukuran Dimensi Otomatis
        if (showDimensions) {
          const distPx = Math.hypot(el.x2 - el.x1, el.y2 - el.y1);
          if (distPx > 25) {
            const meters = (distPx / DEFAULT_GRID_SIZE) * scaleMeters;
            const midX = (el.x1 + el.x2) / 2;
            const midY = (el.y1 + el.y2) / 2;

            ctx.save();
            ctx.setLineDash([]);
            const labelText = `${meters.toFixed(2)} m`;
            ctx.font = "bold 11px system-ui, sans-serif";
            const textWidth = ctx.measureText(labelText).width;

            // Background pill putih dengan border
            ctx.fillStyle = "#ffffff";
            ctx.shadowColor = "rgba(0,0,0,0.15)";
            ctx.shadowBlur = 4;
            ctx.fillRect(midX - textWidth / 2 - 5, midY - 9, textWidth + 10, 18);
            ctx.strokeStyle = "#94a3b8";
            ctx.lineWidth = 1;
            ctx.strokeRect(midX - textWidth / 2 - 5, midY - 9, textWidth + 10, 18);

            // Teks meteran
            ctx.fillStyle = "#0f172a";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(labelText, midX, midY);
            ctx.restore();
          }
        }
      }

      // --- RULER (Garis Ukur Dimensi Khusus) ---
      else if (el.type === "RULER") {
        ctx.strokeStyle = el.color || "#d97706"; // amber-600
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(el.x1, el.y1);
        ctx.lineTo(el.x2, el.y2);
        ctx.stroke();

        // Panah / Garis Ticks di Ujung
        const angle = Math.atan2(el.y2 - el.y1, el.x2 - el.x1);
        const tickLen = 8;
        ctx.beginPath();
        // Ujung 1
        ctx.moveTo(
          el.x1 - tickLen * Math.cos(angle - Math.PI / 2),
          el.y1 - tickLen * Math.sin(angle - Math.PI / 2)
        );
        ctx.lineTo(
          el.x1 + tickLen * Math.cos(angle - Math.PI / 2),
          el.y1 + tickLen * Math.sin(angle - Math.PI / 2)
        );
        // Ujung 2
        ctx.moveTo(
          el.x2 - tickLen * Math.cos(angle - Math.PI / 2),
          el.y2 - tickLen * Math.sin(angle - Math.PI / 2)
        );
        ctx.lineTo(
          el.x2 + tickLen * Math.cos(angle - Math.PI / 2),
          el.y2 + tickLen * Math.sin(angle - Math.PI / 2)
        );
        ctx.stroke();

        // Label Dimensi
        const distPx = Math.hypot(el.x2 - el.x1, el.y2 - el.y1);
        const meters = (distPx / DEFAULT_GRID_SIZE) * scaleMeters;
        const midX = (el.x1 + el.x2) / 2;
        const midY = (el.y1 + el.y2) / 2;

        ctx.save();
        ctx.setLineDash([]);
        const labelText = `| ${meters.toFixed(2)} m |`;
        ctx.font = "bold 12px monospace";
        const textWidth = ctx.measureText(labelText).width;
        ctx.fillStyle = "#fef3c7"; // amber-100
        ctx.fillRect(midX - textWidth / 2 - 4, midY - 9, textWidth + 8, 18);
        ctx.fillStyle = "#92400e"; // amber-900
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(labelText, midX, midY);
        ctx.restore();
      }

      // --- DOOR (Bukaan Pintu) ---
      else if (el.type === "DOOR") {
        // MASKING DINDING: Garis putih tebal (10px) agar memotong dinding di bawahnya
        ctx.save();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 10;
        ctx.lineCap = "square";
        ctx.beginPath();
        ctx.moveTo(el.x1, el.y1);
        ctx.lineTo(el.x2, el.y2);
        ctx.stroke();
        ctx.restore();

        ctx.strokeStyle = "#475569";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(el.x1, el.y1);
        ctx.lineTo(el.x2, el.y2);
        ctx.stroke();

        // Busur Ayunan Pintu (90 Deg Swing Arc)
        const radius = Math.hypot(el.x2 - el.x1, el.y2 - el.y1);
        const startAngle = Math.atan2(el.y2 - el.y1, el.x2 - el.x1);
        ctx.save();
        ctx.setLineDash([3, 3]);
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = "#94a3b8";
        ctx.beginPath();
        ctx.arc(el.x1, el.y1, radius, startAngle, startAngle + Math.PI / 2);
        ctx.stroke();
        ctx.restore();
      }

      // --- WINDOW (Jendela Dobel Garis) ---
      else if (el.type === "WINDOW") {
        const dx = el.x2 - el.x1;
        const dy = el.y2 - el.y1;
        const angle = Math.atan2(dy, dx);
        const offset = 4;

        // MASKING DINDING: Garis putih tebal (12px) agar memotong dinding di bawahnya
        ctx.save();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 12;
        ctx.lineCap = "square";
        ctx.beginPath();
        ctx.moveTo(el.x1, el.y1);
        ctx.lineTo(el.x2, el.y2);
        ctx.stroke();
        ctx.restore();

        ctx.strokeStyle = "#0284c7"; // sky-600
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        // Garis 1
        ctx.moveTo(
          el.x1 + offset * Math.cos(angle + Math.PI / 2),
          el.y1 + offset * Math.sin(angle + Math.PI / 2)
        );
        ctx.lineTo(
          el.x2 + offset * Math.cos(angle + Math.PI / 2),
          el.y2 + offset * Math.sin(angle + Math.PI / 2)
        );
        // Garis 2
        ctx.moveTo(
          el.x1 - offset * Math.cos(angle + Math.PI / 2),
          el.y1 - offset * Math.sin(angle + Math.PI / 2)
        );
        ctx.lineTo(
          el.x2 - offset * Math.cos(angle + Math.PI / 2),
          el.y2 - offset * Math.sin(angle + Math.PI / 2)
        );
        ctx.stroke();

        // Garis penutup ujung
        ctx.beginPath();
        ctx.moveTo(
          el.x1 + offset * Math.cos(angle + Math.PI / 2),
          el.y1 + offset * Math.sin(angle + Math.PI / 2)
        );
        ctx.lineTo(
          el.x1 - offset * Math.cos(angle + Math.PI / 2),
          el.y1 - offset * Math.sin(angle + Math.PI / 2)
        );
        ctx.moveTo(
          el.x2 + offset * Math.cos(angle + Math.PI / 2),
          el.y2 + offset * Math.sin(angle + Math.PI / 2)
        );
        ctx.lineTo(
          el.x2 - offset * Math.cos(angle + Math.PI / 2),
          el.y2 - offset * Math.sin(angle + Math.PI / 2)
        );
        ctx.stroke();
      }

      // --- ARROW (Garis Penunjuk / Pointer Panah) ---
      else if (el.type === "ARROW") {
        const arrowColor = el.color || "#ef4444";
        const lineW = el.strokeWidth || 2.5;
        ctx.strokeStyle = arrowColor;
        ctx.fillStyle = arrowColor;
        ctx.lineWidth = lineW;
        ctx.lineCap = "round";

        // Garis utama
        ctx.beginPath();
        ctx.moveTo(el.x1, el.y1);
        ctx.lineTo(el.x2, el.y2);
        ctx.stroke();

        // Kepala Panah (Segitiga di ujung x2, y2)
        const angle = Math.atan2(el.y2 - el.y1, el.x2 - el.x1);
        const headLen = Math.max(12, lineW * 4);
        ctx.save();
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(el.x2, el.y2);
        ctx.lineTo(
          el.x2 - headLen * Math.cos(angle - Math.PI / 6),
          el.y2 - headLen * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
          el.x2 - headLen * Math.cos(angle + Math.PI / 6),
          el.y2 - headLen * Math.sin(angle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fill();

        // Titik pangkal kecil
        ctx.beginPath();
        ctx.arc(el.x1, el.y1, lineW * 1.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // --- FREEHAND (Coretan Bebas / Stylus Pen) ---
      else if (el.type === "FREEHAND" && el.points && el.points.length > 1) {
        ctx.strokeStyle = el.color || "#ef4444";
        ctx.lineWidth = el.strokeWidth || 1.5;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();
        ctx.moveTo(el.points[0].x, el.points[0].y);
        for (let i = 1; i < el.points.length; i++) {
          ctx.lineTo(el.points[i].x, el.points[i].y);
        }
        ctx.stroke();
      }

      // --- TEXT (Catatan Nama Ruangan + Support Rotasi) ---
      else if (el.type === "TEXT" && el.text) {
        const fSize = el.strokeWidth || 14;
        ctx.font = `bold ${fSize}px system-ui, sans-serif`;
        const textWidth = ctx.measureText(el.text).width;
        const boxHeight = fSize + 8;
        const rotDeg = el.rotation || 0;
        const isSelected =
          draggingTextId === el.id || selectedTextId === el.id;

        ctx.save();
        ctx.translate(el.x1, el.y1);
        if (rotDeg) {
          ctx.rotate((rotDeg * Math.PI) / 180);
        }

        ctx.fillStyle = "rgba(255, 255, 255, 0.92)";
        ctx.fillRect(-6, -boxHeight / 2, textWidth + 12, boxHeight);
        ctx.strokeStyle = isSelected ? "#f59e0b" : "#cbd5e1";
        ctx.lineWidth = isSelected ? 2 : 1;
        ctx.strokeRect(-6, -boxHeight / 2, textWidth + 12, boxHeight);
        ctx.fillStyle = el.color || "#0f172a";
        ctx.textBaseline = "middle";
        ctx.fillText(el.text, 0, 0);
        ctx.restore();
      }

      ctx.restore();
    };

    // 3. Render Seluruh Elemen yang Tersimpan
    // PASS 1: Render semua dinding (WALL) terlebih dahulu
    elements
      .filter((el) => el.type === "WALL")
      .forEach((el) => renderElement(el, false));

    // PASS 2: Render Pintu, Jendela (yang melubangi dinding), Dimensi, Panah, Stylus, dan Teks
    elements
      .filter((el) => el.type !== "WALL")
      .forEach((el) => renderElement(el, false));

    // 4. Render Elemen yang Sedang Ditarik Saat Ini (Preview)
    if (currentElement) {
      renderElement(currentElement, true);
    }

    // Tutup transformasi Zoom & Pan
    ctx.restore();
  }, [
    bgImage,
    bgOpacity,
    showGrid,
    elements,
    currentElement,
    showDimensions,
    scaleMeters,
    draggingTextId,
    selectedTextId,
    zoomLevel,
    panOffset,
  ]);

  // Efek gambar ulang setiap ada perubahan
  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  // Handle Resize Canvas ke ukuran optimal
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const rect = container.getBoundingClientRect();
      const targetWidth = Math.max(800, Math.floor(rect.width));
      const targetHeight = Math.max(500, Math.floor(rect.height || 600));

      if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        redrawCanvas();
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isStudioOpen, isFullscreen, redrawCanvas]);

  // Get Canvas Pointer Coordinates (Memperhitungkan Zoom & Pan)
  const getCoordinates = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const rawX = (e.clientX - rect.left) * scaleX;
    const rawY = (e.clientY - rect.top) * scaleY;
    return {
      x: (rawX - panOffset.x) / zoomLevel,
      y: (rawY - panOffset.y) / zoomLevel,
    };
  };

  // Helper Cek Apakah Titik Mengenai Teks (Support Rotasi 0, 90, 180, 270)
  const isPointInText = (el: SketchElement, px: number, py: number) => {
    if (el.type !== "TEXT" || !el.text) return false;
    const fSize = el.strokeWidth || 14;
    const approxW = el.text.length * (fSize * 0.7) + 18;
    const boxH = fSize + 14;
    const rot = ((el.rotation || 0) * Math.PI) / 180;
    const dx = px - el.x1;
    const dy = py - el.y1;
    // Transform titik ke koordinat lokal teks
    const localX = dx * Math.cos(-rot) - dy * Math.sin(-rot);
    const localY = dx * Math.sin(-rot) + dy * Math.cos(-rot);
    return (
      localX >= -10 &&
      localX <= approxW &&
      localY >= -boxH / 2 &&
      localY <= boxH / 2
    );
  };

  // Fungsi Putar Teks 90 Derajat
  const handleRotateSelectedText = () => {
    const targetId = selectedTextId || draggingTextId;
    if (!targetId) {
      toast.info("Sentuh/klik teks di kanvas terlebih dahulu untuk memutarnya.");
      return;
    }
    const next = elements.map((el) => {
      if (el.id !== targetId || el.type !== "TEXT") return el;
      const nextRot = ((el.rotation || 0) + 90) % 360;
      return { ...el, rotation: nextRot };
    });
    setElements(next);
    pushToHistory(next);
  };

  // Fungsi Zoom In / Out / Reset
  const handleZoom = (delta: number) => {
    setZoomLevel((prev) => {
      const next = Math.min(3.0, Math.max(0.3, Number((prev + delta).toFixed(2))));
      return next;
    });
  };

  const handleResetView = () => {
    setZoomLevel(1.0);
    setPanOffset({ x: 0, y: 0 });
  };

  // POINTER DOWN (Mulai Menggambar / Geser Kanvas / Geser Teks / Hapus)
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    // Mode Geser Kanvas (Pan Mode) atau Klik Tengah Mouse
    if (panMode || e.button === 1) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
      return;
    }

    // Palm Rejection: Jika diaktifkan, hanya respons stylus/pen atau mouse
    if (palmRejection && e.pointerType === "touch") {
      return;
    }

    const { x, y } = getCoordinates(e);

    // Deteksi apakah klik mengenai teks yang sudah ada
    const touchedText = elements.find((el) => isPointInText(el, x, y));

    // MODE ERASER: Hapus elemen terdekat (Stylus, Teks, Dinding, Panah, Pintu, dll)
    if (activeTool === "ERASER") {
      const clickRadius = 22 / zoomLevel;
      const filtered = elements.filter((el) => {
        // A. Cek FREEHAND (Coretan Stylus): Cek ke SETIAP titik di sepanjang coretan
        if (el.type === "FREEHAND" && el.points && el.points.length > 0) {
          const touches = el.points.some(
            (p) => Math.hypot(p.x - x, p.y - y) <= clickRadius
          );
          return !touches;
        }

        // B. Cek TEXT: Cek apakah klik berada di dalam kotak teks
        if (el.type === "TEXT" && el.text) {
          return !isPointInText(el, x, y);
        }

        // C. Cek WALL, RULER, DOOR, WINDOW, ARROW: Jarak ke titik ujung, tengah, atau segmen garis
        const d1 = Math.hypot(el.x1 - x, el.y1 - y);
        const d2 = Math.hypot(el.x2 - x, el.y2 - y);
        const midX = (el.x1 + el.x2) / 2;
        const midY = (el.y1 + el.y2) / 2;
        const dMid = Math.hypot(midX - x, midY - y);

        const lineLen = Math.hypot(el.x2 - el.x1, el.y2 - el.y1);
        let distToLine = clickRadius + 1;
        if (lineLen > 0) {
          const t = Math.max(
            0,
            Math.min(
              1,
              ((x - el.x1) * (el.x2 - el.x1) + (y - el.y1) * (el.y2 - el.y1)) /
                (lineLen * lineLen)
            )
          );
          const projX = el.x1 + t * (el.x2 - el.x1);
          const projY = el.y1 + t * (el.y2 - el.y1);
          distToLine = Math.hypot(projX - x, projY - y);
        }

        return (
          d1 > clickRadius &&
          d2 > clickRadius &&
          dMid > clickRadius &&
          distToLine > clickRadius
        );
      });

      if (filtered.length !== elements.length) {
        setElements(filtered);
        pushToHistory(filtered);
      }
      return;
    }

    // Jika menyentuh teks (dan bukan penghapus): Pilih & Masuk mode geser teks (DRAG & MOVE)
    if (touchedText) {
      setSelectedTextId(touchedText.id);
      setDraggingTextId(touchedText.id);
      setDragOffset({ x: x - touchedText.x1, y: y - touchedText.y1 });
      setIsDrawing(false);
      return;
    } else {
      setSelectedTextId(null);
    }

    // MODE TEXT: Tambah teks baru saat klik area kosong
    if (activeTool === "TEXT") {
      const text = prompt("Masukkan Catatan / Nama Ruangan:", "Kamar Utama");
      if (text && text.trim()) {
        const newId = `el-${Date.now()}`;
        const newTextEl: SketchElement = {
          id: newId,
          type: "TEXT",
          x1: x,
          y1: y,
          x2: x,
          y2: y,
          text: text.trim(),
          color: activeColor,
          strokeWidth: textFontSize, // Ukuran font disimpan di strokeWidth (11, 14, 18)
          rotation: 0,
        };
        const next = [...elements, newTextEl];
        setElements(next);
        setSelectedTextId(newId);
        pushToHistory(next);
      }
      return;
    }

    // MODE FREEHAND: Menggunakan penThickness yang dipilih
    if (activeTool === "FREEHAND") {
      setIsDrawing(true);
      setCurrentElement({
        id: `el-${Date.now()}`,
        type: "FREEHAND",
        x1: x,
        y1: y,
        x2: x,
        y2: y,
        points: [{ x, y }],
        color: activeColor,
        strokeWidth: penThickness,
      });
      return;
    }

    // MODE WALL, RULER, DOOR, WINDOW, ARROW
    const snappedX = snap(x);
    const snappedY = snap(y);

    setIsDrawing(true);
    setCurrentElement({
      id: `el-${Date.now()}`,
      type: activeTool,
      x1: snappedX,
      y1: snappedY,
      x2: snappedX,
      y2: snappedY,
      color: activeColor,
      strokeWidth: activeTool === "ARROW" ? 2.5 : strokeWidth,
    });
  };

  // POINTER MOVE (Sedang Menggeser Kanvas / Garis / Teks)
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isPanning) {
      const canvas = canvasRef.current;
      const scaleX = canvas ? canvas.width / canvas.getBoundingClientRect().width : 1;
      const scaleY = canvas ? canvas.height / canvas.getBoundingClientRect().height : 1;
      setPanOffset({
        x: (e.clientX - panStart.x) * scaleX,
        y: (e.clientY - panStart.y) * scaleY,
      });
      return;
    }

    if (palmRejection && e.pointerType === "touch") return;

    const { x, y } = getCoordinates(e);

    // Jika sedang menggeser teks (DRAG TEXT)
    if (draggingTextId) {
      setElements((prev) =>
        prev.map((el) => {
          if (el.id !== draggingTextId) return el;
          const newX = snap(x - dragOffset.x, 10);
          const newY = snap(y - dragOffset.y, 10);
          return { ...el, x1: newX, y1: newY, x2: newX, y2: newY };
        })
      );
      return;
    }

    if (!isDrawing || !currentElement) return;

    if (currentElement.type === "FREEHAND") {
      setCurrentElement((prev) => {
        if (!prev) return null;
        const nextPoints = [...(prev.points || []), { x, y }];
        return { ...prev, points: nextPoints, x2: x, y2: y };
      });
      return;
    }

    // Mode Wall / Ruler / Arrow: Gunakan snap grid dan snap orthogonal
    let targetX = snap(x);
    let targetY = snap(y);

    if (
      currentElement.type === "WALL" ||
      currentElement.type === "RULER" ||
      currentElement.type === "ARROW"
    ) {
      const snapped = snapAngle(
        currentElement.x1,
        currentElement.y1,
        targetX,
        targetY
      );
      targetX = snapped.x;
      targetY = snapped.y;
    }

    setCurrentElement((prev) => {
      if (!prev) return null;
      return { ...prev, x2: targetX, y2: targetY };
    });
  };

  // POINTER UP (Selesai Menggambar / Selesai Geser Kanvas / Teks)
  const handlePointerUp = () => {
    if (isPanning) {
      setIsPanning(false);
      return;
    }

    if (draggingTextId) {
      setDraggingTextId(null);
      pushToHistory(elements);
      return;
    }

    if (!isDrawing || !currentElement) return;
    setIsDrawing(false);

    // Jangan simpan garis yang terlalu pendek (kecuali sengaja titik)
    const dist = Math.hypot(
      currentElement.x2 - currentElement.x1,
      currentElement.y2 - currentElement.y1
    );

    if (currentElement.type !== "FREEHAND" && dist < 10) {
      setCurrentElement(null);
      return;
    }

    const nextElements = [...elements, currentElement];
    setElements(nextElements);
    pushToHistory(nextElements);
    setCurrentElement(null);
  };

  // SIMPAN SKETSA KE SERVER & PROYEK
  const handleSaveSketch = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (elements.length === 0 && !bgImage) {
      toast.error("Kanvas masih kosong. Buat sketsa terlebih dahulu.");
      return;
    }

    setSaving(true);
    try {
      // 1. Export Canvas ke Blob Image (WebP)
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/webp", 0.9)
      );

      if (!blob) {
        throw new Error("Gagal merender gambar kanvas.");
      }

      const file = new File(
        [blob],
        `${sketchTitle.replace(/[^a-zA-Z0-9_-]/g, "_")}-${Date.now()}.webp`,
        { type: "image/webp" }
      );

      // 2. Upload file ke storage server
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "sketches");

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) {
        throw new Error(uploadData.error || "Gagal mengunggah gambar sketsa");
      }

      const imageUrl = uploadData.fileUrl as string;

      // 3. Simpan / Update ke Database Proyek
      const action = currentSketchId ? "UPDATE_SKETCH" : "ADD_SKETCH";
      const payload: Record<string, unknown> = {
        action,
        title: sketchTitle || "Sketsa Lapangan",
        roomName: sketchRoom || "Lantai 1",
        notes: sketchNotes,
        scaleMeters: scaleMeters,
        imageUrl,
        sketchData: elements, // Vector elements JSON
      };

      if (currentSketchId) {
        payload.sketchId = currentSketchId;
      }

      const saveRes = await fetch(`/api/projects/${project.id}/extras`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!saveRes.ok) {
        const err = await saveRes.json();
        throw new Error(err.error || "Gagal menyimpan sketsa ke database");
      }

      toast.success("Sketsa denah berhasil disimpan ke proyek!");
      setIsStudioOpen(false);
      onRefresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  // DOWNLOAD GAMBAR SECARA LOKAL
  const handleDownloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement("a");
    a.download = `${sketchTitle || "sketsa-denah"}.png`;
    a.href = canvas.toDataURL("image/png");
    a.click();
    toast.success("Gambar denah berhasil diunduh ke perangkat!");
  };

  return (
    <div className="space-y-6">
      {/* ========================================================
          1. HEADER & TOMBOL UTAMA TAB SKETSA
          ======================================================== */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              <Ruler className="w-4 h-4 text-amber-600" />
            </div>
            <h2 className="text-base font-extrabold text-slate-900">
              Sketsa & Survei Lapangan (Studio CAD Ringan)
            </h2>
          </div>
          <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
            Gambar denah kasar, tarik garis dinding berskala meter, dan catat
            ukuran langsung di lapangan via tablet / stylus. Otomatis sinkron ke
            komputer drafter & arsip proyek.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setShowHelpModal(true)}
            className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold flex items-center gap-1.5 transition"
          >
            <HelpCircle className="w-4 h-4 text-slate-400" />
            <span>Petunjuk Tablet</span>
          </button>

          <button
            type="button"
            onClick={handleOpenNewSketch}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-2 shadow-sm transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Mulai Gambar Sketsa Baru</span>
          </button>
        </div>
      </div>

      {/* ========================================================
          2. DAFTAR SKETSA YANG TERSIMPAN DALAM PROYEK INI
          ======================================================== */}
      {sketches.length === 0 ? (
        <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center space-y-3">
          <div className="w-12 h-12 bg-white rounded-2xl mx-auto flex items-center justify-center text-slate-400 shadow-sm border border-slate-100">
            <Ruler className="w-6 h-6 text-amber-500" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">
            Belum Ada Sketsa Survei Lapangan
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Buka studio kanvas untuk mulai menggambar denah ruangan dengan
            penggaris otomatis berskala meter atau coret langsung di atas foto
            lokasi.
          </p>
          <button
            type="button"
            onClick={handleOpenNewSketch}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition shadow"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>Buka Kanvas Sketsa</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sketches.map((sketch) => (
            <div
              key={sketch.id}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow transition group flex flex-col"
            >
              <div className="relative aspect-[4/3] bg-slate-100 border-b border-slate-100 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={sketch.imageUrl}
                  alt={sketch.title}
                  className="w-full h-full object-contain p-2 group-hover:scale-105 transition duration-300"
                />
                {sketch.roomName && (
                  <span className="absolute top-2.5 left-2.5 bg-slate-900/80 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-lg">
                    {sketch.roomName}
                  </span>
                )}
                <span className="absolute bottom-2.5 right-2.5 bg-white/90 backdrop-blur-sm text-slate-700 text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-slate-200">
                  1 Grid = {sketch.scaleMeters || 1.0}m
                </span>
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 mb-1 line-clamp-1">
                    {sketch.title}
                  </h3>
                  {sketch.notes ? (
                    <p className="text-xs text-slate-500 line-clamp-2 mb-2">
                      {sketch.notes}
                    </p>
                  ) : (
                    <p className="text-[11px] text-slate-400 mb-2">
                      Dibuat pada:{" "}
                      {new Date(sketch.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleEditSketch(sketch)}
                    className="flex-1 py-2 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold flex items-center justify-center gap-1.5 transition"
                  >
                    <FileEdit className="w-3.5 h-3.5" />
                    <span>Lanjutkan Edit</span>
                  </button>

                  <a
                    href={sketch.imageUrl}
                    target="_blank"
                    download
                    className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
                    title="Buka Gambar Asli"
                  >
                    <Download className="w-4 h-4" />
                  </a>

                  <button
                    type="button"
                    onClick={() => handleDeleteSketch(sketch.id)}
                    className="p-2 rounded-xl border border-rose-100 text-rose-600 hover:bg-rose-50 transition"
                    title="Hapus Sketsa"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================
          3. MODAL STUDIO KANVAS ARSITEK (EDITOR PENUH)
          ======================================================== */}
      {isStudioOpen && (
        <div
          className={`fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex flex-col ${
            isFullscreen ? "p-0" : "p-2 sm:p-5"
          }`}
        >
          <div
            className={`bg-white w-full h-full flex flex-col overflow-hidden shadow-2xl ${
              isFullscreen ? "rounded-none" : "rounded-2xl"
            }`}
          >
            {/* Topbar Studio */}
            <div className="bg-slate-900 text-white px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-bold text-xs">
                  📐
                </div>
                <div>
                  <input
                    type="text"
                    value={sketchTitle}
                    onChange={(e) => setSketchTitle(e.target.value)}
                    placeholder="Judul Sketsa"
                    className="bg-transparent border-b border-slate-700 hover:border-amber-400 focus:border-amber-400 text-white text-xs font-bold px-1 py-0.5 outline-none"
                  />
                  <div className="flex items-center gap-2 text-[10px] text-slate-400">
                    <span>Ruangan:</span>
                    <input
                      type="text"
                      value={sketchRoom}
                      onChange={(e) => setSketchRoom(e.target.value)}
                      placeholder="Area / Ruangan"
                      className="bg-transparent border-b border-slate-700 hover:border-amber-400 text-amber-300 font-semibold px-1 outline-none w-28"
                    />
                  </div>
                </div>
              </div>

              {/* Tombol Aksi Kanan */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadImage}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1 transition"
                  title="Unduh PNG"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Unduh</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                  title={isFullscreen ? "Keluar Layar Penuh" : "Layar Penuh"}
                >
                  {isFullscreen ? (
                    <Minimize2 className="w-4 h-4" />
                  ) : (
                    <Maximize2 className="w-4 h-4" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleSaveSketch}
                  disabled={saving}
                  className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow transition disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{saving ? "Menyimpan..." : "Simpan Sketsa"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsStudioOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition ml-1"
                  title="Tutup Studio"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Toolbar Studio (Tools Bar) */}
            <div className="bg-slate-100 border-b border-slate-200 px-3 py-2 flex flex-wrap items-center justify-between gap-2 shrink-0 select-none">
              {/* Grup Tools Gambar */}
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTool("WALL");
                    setPanMode(false);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                    activeTool === "WALL" && !panMode
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                  title="Tarik Dinding Lurus (Snap 90° & Ada Ukuran Meter)"
                >
                  <Square className="w-3.5 h-3.5 text-amber-400" />
                  <span>Dinding (Wall)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTool("RULER");
                    setPanMode(false);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                    activeTool === "RULER" && !panMode
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                  title="Garis Ukur Dimensi Ruangan"
                >
                  <Ruler className="w-3.5 h-3.5 text-sky-400" />
                  <span>Penggaris Dimensi</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTool("DOOR");
                    setPanMode(false);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                    activeTool === "DOOR" && !panMode
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                  title="Bukaan Pintu Khas Arsitek"
                >
                  <Compass className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Pintu</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTool("WINDOW");
                    setPanMode(false);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                    activeTool === "WINDOW" && !panMode
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                  title="Bukaan Jendela Dobel Kaca"
                >
                  <Layers className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Jendela</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTool("ARROW");
                    setPanMode(false);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                    activeTool === "ARROW" && !panMode
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                  title="Garis Panah Penunjuk Area / Catatan"
                >
                  <ArrowUpRight className="w-3.5 h-3.5 text-orange-400" />
                  <span>Panah</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTool("FREEHAND");
                    setPanMode(false);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                    activeTool === "FREEHAND" && !panMode
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                  title="Coretan Bebas Stylus / Jari"
                >
                  <Pencil className="w-3.5 h-3.5 text-rose-400" />
                  <span>Coret Stylus</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTool("TEXT");
                    setPanMode(false);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                    activeTool === "TEXT" && !panMode
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                  title="Ketik Catatan / Nama Ruangan"
                >
                  <Type className="w-3.5 h-3.5" />
                  <span>Teks</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTool("ERASER");
                    setPanMode(false);
                  }}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition ${
                    activeTool === "ERASER" && !panMode
                      ? "bg-rose-600 text-white shadow-sm"
                      : "text-rose-600 hover:bg-rose-50"
                  }`}
                  title="Klik Elemen untuk Menghapus"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus</span>
                </button>
              </div>

              {/* Pilihan Warna, Tebal Garis & Ukuran Teks */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200">
                  {["#0f172a", "#ef4444", "#0284c7", "#16a34a", "#eab308"].map(
                    (c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setActiveColor(c)}
                        style={{ backgroundColor: c }}
                        className={`w-5 h-5 rounded-full transition ${
                          activeColor === c
                            ? "ring-2 ring-offset-2 ring-slate-900 scale-110"
                            : "opacity-80 hover:opacity-100"
                        }`}
                      />
                    )
                  )}
                </div>

                {/* 3 Opsi Ketebalan Coret Stylus */}
                <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 text-xs">
                  <span className="text-[10px] text-slate-400 font-bold px-1 hidden sm:inline">
                    Stylus:
                  </span>
                  <button
                    type="button"
                    onClick={() => setPenThickness(1.5)}
                    className={`px-2 py-0.5 rounded-lg font-bold text-[11px] transition ${
                      penThickness === 1.5
                        ? "bg-slate-900 text-white"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                    title="Garis Tipis (1.5px - Pas untuk Catatan Tangan)"
                  >
                    Tipis
                  </button>
                  <button
                    type="button"
                    onClick={() => setPenThickness(3)}
                    className={`px-2 py-0.5 rounded-lg font-bold text-[11px] transition ${
                      penThickness === 3
                        ? "bg-slate-900 text-white"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                    title="Garis Sedang (3px)"
                  >
                    Sedang
                  </button>
                  <button
                    type="button"
                    onClick={() => setPenThickness(5)}
                    className={`px-2 py-0.5 rounded-lg font-bold text-[11px] transition ${
                      penThickness === 5
                        ? "bg-slate-900 text-white"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                    title="Garis Tebal (5px)"
                  >
                    Tebal
                  </button>
                </div>

                {/* Ukuran Teks & Putar 90 Derajat (Tampil saat mode TEXT aktif atau ada teks terpilih) */}
                {(activeTool === "TEXT" || selectedTextId) && (
                  <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 text-xs animate-in fade-in">
                    <span className="text-[10px] text-slate-400 font-bold px-1">
                      Font:
                    </span>
                    <button
                      type="button"
                      onClick={() => setTextFontSize(11)}
                      className={`px-2 py-0.5 rounded-lg font-bold text-[11px] transition ${
                        textFontSize === 11
                          ? "bg-amber-500 text-slate-950 font-extrabold"
                          : "text-slate-600 hover:bg-slate-100"
                      }`}
                      title="Font Kecil (11px)"
                    >
                      S
                    </button>
                    <button
                      type="button"
                      onClick={() => setTextFontSize(14)}
                      className={`px-2 py-0.5 rounded-lg font-bold text-[11px] transition ${
                        textFontSize === 14
                          ? "bg-amber-500 text-slate-950 font-extrabold"
                          : "text-slate-600 hover:bg-slate-100"
                      }`}
                      title="Font Normal (14px)"
                    >
                      M
                    </button>
                    <button
                      type="button"
                      onClick={() => setTextFontSize(18)}
                      className={`px-2 py-0.5 rounded-lg font-bold text-[11px] transition ${
                        textFontSize === 18
                          ? "bg-amber-500 text-slate-950 font-extrabold"
                          : "text-slate-600 hover:bg-slate-100"
                      }`}
                      title="Font Besar (18px)"
                    >
                      L
                    </button>

                    <button
                      type="button"
                      onClick={handleRotateSelectedText}
                      className="ml-1 px-2 py-0.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-[11px] flex items-center gap-1 transition"
                      title="Putar Teks 90 Derajat (Klik teks dulu lalu klik tombol ini)"
                    >
                      <RotateCw className="w-3 h-3" />
                      <span>Putar 90°</span>
                    </button>
                  </div>
                )}

                {/* Zoom & Pan (Geser Kanvas Luas) */}
                <div className="flex items-center gap-0.5 bg-white p-1 rounded-xl border border-slate-200 text-xs">
                  <button
                    type="button"
                    onClick={() => setPanMode(!panMode)}
                    className={`px-2 py-1 rounded-lg font-bold text-[11px] flex items-center gap-1 transition ${
                      panMode
                        ? "bg-amber-500 text-slate-950 shadow-sm"
                        : "text-slate-700 hover:bg-slate-100"
                    }`}
                    title="Mode Geser Kanvas (Pan) untuk melihat area denah yang luas"
                  >
                    <Move className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Geser</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleZoom(-0.2)}
                    className="p-1 rounded-lg text-slate-700 hover:bg-slate-100"
                    title="Perkecil Kanvas (Zoom Out)"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleResetView}
                    className="px-1.5 py-0.5 rounded text-[11px] font-mono font-bold text-slate-700 hover:bg-slate-100"
                    title="Reset Zoom ke 100%"
                  >
                    {Math.round(zoomLevel * 100)}%
                  </button>
                  <button
                    type="button"
                    onClick={() => handleZoom(0.2)}
                    className="p-1 rounded-lg text-slate-700 hover:bg-slate-100"
                    title="Perbesar Kanvas (Zoom In)"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                  {(zoomLevel !== 1 || panOffset.x !== 0 || panOffset.y !== 0) && (
                    <button
                      type="button"
                      onClick={handleResetView}
                      className="p-1 rounded-lg text-amber-600 hover:bg-amber-50"
                      title="Kembalikan Posisi Tengah (Reset View)"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Undo / Redo */}
                <div className="flex items-center gap-0.5 bg-white p-1 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={handleUndo}
                    disabled={historyIndex < 0}
                    className="p-1 rounded-lg text-slate-700 hover:bg-slate-100 disabled:opacity-30"
                    title="Undo (Ctrl+Z)"
                  >
                    <Undo2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleRedo}
                    disabled={historyIndex >= history.length - 1}
                    className="p-1 rounded-lg text-slate-700 hover:bg-slate-100 disabled:opacity-30"
                    title="Redo (Ctrl+Y)"
                  >
                    <Redo2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Opsi Grid, Skala & Palm Rejection */}
              <div className="flex items-center gap-2">
                {/* Skala Meter */}
                <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-xl border border-slate-200 text-xs">
                  <span className="text-slate-500 font-semibold text-[11px]">
                    1 Kotak =
                  </span>
                  <select
                    value={scaleMeters}
                    onChange={(e) => setScaleMeters(Number(e.target.value))}
                    className="font-bold text-slate-800 bg-transparent outline-none cursor-pointer"
                  >
                    <option value={0.5}>0.5 Meter</option>
                    <option value={1.0}>1.0 Meter</option>
                    <option value={2.0}>2.0 Meter</option>
                  </select>
                </div>

                {/* Toggle Dimensi Meteran */}
                <button
                  type="button"
                  onClick={() => setShowDimensions(!showDimensions)}
                  className={`px-2.5 py-1 rounded-xl border text-xs font-semibold flex items-center gap-1 transition ${
                    showDimensions
                      ? "bg-amber-50 text-amber-900 border-amber-300"
                      : "bg-white text-slate-500 border-slate-200"
                  }`}
                  title="Tampilkan / Sembunyikan Angka Ukuran Meter di Garis"
                >
                  <Ruler className="w-3.5 h-3.5" />
                  <span>Ukuran</span>
                </button>

                {/* Toggle Grid */}
                <button
                  type="button"
                  onClick={() => setShowGrid(!showGrid)}
                  className={`px-2.5 py-1 rounded-xl border text-xs font-semibold flex items-center gap-1 transition ${
                    showGrid
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white text-slate-500 border-slate-200"
                  }`}
                  title="Tampilkan Kotak-kotak Grid Arsitek"
                >
                  <Grid className="w-3.5 h-3.5" />
                  <span>Grid</span>
                </button>

                {/* Palm Rejection Toggle (Khusus Stylus Pen) */}
                <button
                  type="button"
                  onClick={() => {
                    const next = !palmRejection;
                    setPalmRejection(next);
                    toast.info(
                      next
                        ? "Palm Rejection AKTIF: Hanya mata pena stylus yang diterima kanvas!"
                        : "Mode Sentuh Biasa: Jari & stylus aktif bersamaan."
                    );
                  }}
                  className={`px-2.5 py-1 rounded-xl border text-xs font-semibold flex items-center gap-1 transition ${
                    palmRejection
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                      : "bg-white text-slate-600 border-slate-200"
                  }`}
                  title="Hanya respons stylus pen, sentuhan telapak tangan diabaikan"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Stylus Only ({palmRejection ? "ON" : "OFF"})</span>
                </button>

                {/* Tombol Muat Foto Lapangan */}
                <label className="cursor-pointer px-2.5 py-1 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1 transition">
                  <ImageIcon className="w-3.5 h-3.5 text-amber-600" />
                  <span>{bgImage ? "Ganti Foto" : "Muat Foto"}</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleUploadBgImage}
                    className="hidden"
                  />
                </label>

                {bgImage && (
                  <button
                    type="button"
                    onClick={() => setBgImage(null)}
                    className="p-1 text-slate-400 hover:text-rose-600"
                    title="Hapus Foto Latar"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* AREA CANVAS DRAWING */}
            <div
              ref={containerRef}
              className="flex-1 bg-slate-200 relative overflow-hidden flex items-center justify-center p-2"
            >
              <canvas
                ref={canvasRef}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                onWheel={(e) => {
                  e.preventDefault();
                  handleZoom(e.deltaY < 0 ? 0.1 : -0.1);
                }}
                className={`bg-white shadow-xl rounded-xl touch-none ${
                  panMode ? "cursor-grab active:cursor-grabbing" : "cursor-crosshair"
                }`}
                style={{
                  touchAction: "none", // Cegah scrolling browser saat stylus/jari menggambar
                }}
              />

              {/* Status Bar / Helper di Pojok Bawah Canvas */}
              <div className="absolute bottom-4 left-6 bg-slate-900/80 backdrop-blur-sm text-white px-3 py-1.5 rounded-xl text-[11px] flex items-center gap-3 shadow pointer-events-none">
                <span className="flex items-center gap-1 text-amber-400 font-bold">
                  Tool: {panMode ? "GESER KANVAS (PAN)" : activeTool}
                </span>
                <span className="text-slate-400">•</span>
                <span>
                  Zoom: <strong>{Math.round(zoomLevel * 100)}%</strong>
                </span>
                <span className="text-slate-400">•</span>
                <span>
                  1 Kotak Grid = <strong>{scaleMeters} Meter</strong>
                </span>
                <span className="text-slate-400">•</span>
                <span className="text-slate-300">
                  Total Elemen: <strong>{elements.length}</strong>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          4. MODAL PETUNJUK PENGGUNAAN PADA TABLET
          ======================================================== */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-amber-500" />
                <span>Panduan Menggambar di Tablet / Lapangan</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900">
                <strong>💡 Tarik Garis Dinding Otomatis Lurus:</strong>
                <p className="mt-1">
                  Pilih tool <strong>Dinding (Wall)</strong> lalu tarik garis.
                  Sistem otomatis mengunci sudut 90° atau 45° dan langsung
                  memunculkan angka panjang dalam meter (misal:{" "}
                  <code>3.50 m</code>).
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <strong>✍️ Fitur Palm Rejection (Khusus Tablet):</strong>
                <p className="mt-1">
                  Jika bapak memakai tablet dengan stylus (S-Pen / Apple
                  Pencil), nyalakan tombol{" "}
                  <strong>&quot;Stylus Only (ON)&quot;</strong> di toolbar. Layar
                  akan otomatis mengabaikan telapak tangan yang menempel di layar
                  sehingga coretan tetap bersih.
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <strong>📸 Menggambar di Atas Foto Lokasi:</strong>
                <p className="mt-1">
                  Klik tombol <strong>&quot;Muat Foto&quot;</strong> di toolbar,
                  lalu jepret foto ruangan atau tembok klien. Foto langsung
                  menjadi background dan bapak bisa mencoret ukuran di atasnya.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs"
              >
                Mengerti, Tutup Panduan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
