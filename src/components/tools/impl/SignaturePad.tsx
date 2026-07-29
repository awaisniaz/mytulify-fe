"use client";

import * as React from "react";
import { Button } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

export const SIGNATURE_CHECKER_BG =
  "bg-[length:12px_12px] bg-[position:0_0,0_6px,6px_-6px,-6px_0px] bg-white [background-image:linear-gradient(45deg,#e2e8f0_25%,transparent_25%),linear-gradient(-45deg,#e2e8f0_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#e2e8f0_75%),linear-gradient(-45deg,transparent_75%,#e2e8f0_75%)]";

export function SignaturePad({
  value,
  onChange,
  className,
  transparent = false,
}: {
  value?: string;
  onChange: (dataUrl: string) => void;
  className?: string;
  /** PNG export keeps alpha — no white fill behind strokes */
  transparent?: boolean;
}) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const drawing = React.useRef(false);

  const resetCanvas = React.useCallback(
    (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
      if (transparent) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      } else {
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      ctx.strokeStyle = "#111";
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    },
    [transparent],
  );

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    resetCanvas(ctx, canvas);
    if (value) {
      const img = new window.Image();
      img.onload = () => ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      img.src = value;
    }
  }, [value, resetCanvas]);

  const pos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const pt = "touches" in e ? e.touches[0] : e;
    return {
      x: ((pt.clientX - rect.left) / rect.width) * canvas.width,
      y: ((pt.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const start = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    drawing.current = true;
    const ctx = canvasRef.current!.getContext("2d")!;
    ctx.strokeStyle = "#111";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    const p = pos(e);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  };

  const move = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing.current) return;
    e.preventDefault();
    const ctx = canvasRef.current!.getContext("2d")!;
    const p = pos(e);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  };

  const end = () => {
    if (!drawing.current) return;
    drawing.current = false;
    const canvas = canvasRef.current;
    if (canvas) onChange(canvas.toDataURL("image/png"));
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    resetCanvas(ctx, canvas);
    onChange("");
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className={cn("overflow-hidden rounded-lg border border-border", transparent && SIGNATURE_CHECKER_BG)}>
        <canvas
          ref={canvasRef}
          width={400}
          height={120}
          className={cn("w-full touch-none", !transparent && "bg-white")}
          onMouseDown={start}
          onMouseMove={move}
          onMouseUp={end}
          onMouseLeave={end}
          onTouchStart={start}
          onTouchMove={move}
          onTouchEnd={end}
        />
      </div>
      <Button type="button" variant="secondary" size="sm" onClick={clear}>
        Clear signature
      </Button>
    </div>
  );
}
