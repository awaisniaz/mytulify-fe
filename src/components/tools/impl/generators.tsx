"use client";

import * as React from "react";
import QRCode from "qrcode";
import JsBarcode from "jsbarcode";
import { Input, Select, Button } from "@/components/ui/primitives";
import { Field, Notice } from "@/components/tools/shared";
import { download } from "@/lib/utils";

type QrBranding = {
  logoDataUrl?: string;
  footerTitle: string;
  footerSubtitle: string;
  logoScale: number;
};

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function hasBranding(b: QrBranding | null): b is QrBranding {
  return !!b && !!(b.logoDataUrl || b.footerTitle.trim() || b.footerSubtitle.trim());
}

async function buildQrImage(
  payload: string,
  fg: string,
  bg: string,
  branding: QrBranding | null,
): Promise<string> {
  const custom = hasBranding(branding);
  const qrSize = custom ? 360 : 320;
  const qrDataUrl = await QRCode.toDataURL(payload, {
    width: qrSize,
    margin: 2,
    errorCorrectionLevel: custom ? "H" : "M",
    color: { dark: fg, light: bg },
  });

  if (!custom || !branding) return qrDataUrl;

  const footerTitle = branding.footerTitle.trim();
  const footerSubtitle = branding.footerSubtitle.trim();
  const footerH = footerTitle || footerSubtitle ? 52 : 0;
  const pad = 20;
  const width = qrSize + pad * 2;
  const height = qrSize + pad * 2 + footerH;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return qrDataUrl;

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  const qr = await loadImage(qrDataUrl);
  ctx.drawImage(qr, pad, pad, qrSize, qrSize);

  if (branding.logoDataUrl) {
    const logo = await loadImage(branding.logoDataUrl);
    const logoSize = Math.round(qrSize * branding.logoScale);
    const logoX = width / 2 - logoSize / 2;
    const logoY = pad + qrSize / 2 - logoSize / 2;
    const logoPad = 6;

    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.roundRect(logoX - logoPad, logoY - logoPad, logoSize + logoPad * 2, logoSize + logoPad * 2, 10);
    ctx.fill();

    ctx.save();
    ctx.beginPath();
    ctx.roundRect(logoX, logoY, logoSize, logoSize, 8);
    ctx.clip();
    const scale = Math.max(logoSize / logo.width, logoSize / logo.height);
    const drawW = logo.width * scale;
    const drawH = logo.height * scale;
    ctx.drawImage(logo, logoX + (logoSize - drawW) / 2, logoY + (logoSize - drawH) / 2, drawW, drawH);
    ctx.restore();
  }

  if (footerH) {
    const footerY = pad + qrSize + 10;
    ctx.textAlign = "center";
    if (footerTitle) {
      ctx.fillStyle = fg;
      ctx.font = "600 13px system-ui, sans-serif";
      ctx.fillText(footerTitle, width / 2, footerY + 16);
    }
    if (footerSubtitle) {
      ctx.fillStyle = "#64748b";
      ctx.font = "11px system-ui, sans-serif";
      ctx.fillText(footerSubtitle, width / 2, footerY + (footerTitle ? 34 : 20));
    }
  }

  return canvas.toDataURL("image/png");
}

/* ------------------------------ QR generator ------------------------------- */
export function QrGenerator({ wifi }: { wifi?: boolean }) {
  const [text, setText] = React.useState("");
  const [ssid, setSsid] = React.useState("");
  const [pass, setPass] = React.useState("");
  const [enc, setEnc] = React.useState("WPA");
  const [fg, setFg] = React.useState("#000000");
  const [bg, setBg] = React.useState("#ffffff");
  const [customize, setCustomize] = React.useState(false);
  const [logoDataUrl, setLogoDataUrl] = React.useState<string>();
  const [footerTitle, setFooterTitle] = React.useState("");
  const [footerSubtitle, setFooterSubtitle] = React.useState("");
  const [logoScale, setLogoScale] = React.useState(0.2);
  const [url, setUrl] = React.useState("");

  const branding = React.useMemo<QrBranding | null>(() => {
    if (!customize) return null;
    return { logoDataUrl, footerTitle, footerSubtitle, logoScale };
  }, [customize, logoDataUrl, footerTitle, footerSubtitle, logoScale]);

  const payload = wifi ? `WIFI:T:${enc};S:${ssid};P:${pass};;` : text;

  React.useEffect(() => {
    if (!payload || (wifi && !ssid)) {
      setUrl("");
      return;
    }
    let cancelled = false;
    buildQrImage(payload, fg, bg, branding)
      .then((dataUrl) => {
        if (!cancelled) setUrl(dataUrl);
      })
      .catch(() => {
        if (!cancelled) setUrl("");
      });
    return () => {
      cancelled = true;
    };
  }, [payload, fg, bg, branding, wifi, ssid]);

  function onLogoFile(file: File | undefined) {
    if (!file) {
      setLogoDataUrl(undefined);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setLogoDataUrl(reader.result as string);
    reader.readAsDataURL(file);
  }

  const isBranded = hasBranding(branding);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="space-y-4">
        {wifi ? (
          <>
            <Field label="Network name (SSID)"><Input value={ssid} onChange={(e) => setSsid(e.target.value)} /></Field>
            <Field label="Password"><Input value={pass} onChange={(e) => setPass(e.target.value)} /></Field>
            <Field label="Encryption">
              <Select value={enc} onChange={(e) => setEnc(e.target.value)}>
                <option value="WPA">WPA/WPA2</option>
                <option value="WEP">WEP</option>
                <option value="nopass">None</option>
              </Select>
            </Field>
          </>
        ) : (
          <Field label="Text or URL"><Input value={text} onChange={(e) => setText(e.target.value)} placeholder="https://your-site.com" /></Field>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Foreground"><input type="color" value={fg} onChange={(e) => setFg(e.target.value)} className="h-11 w-full rounded-xl border border-border" /></Field>
          <Field label="Background"><input type="color" value={bg} onChange={(e) => setBg(e.target.value)} className="h-11 w-full rounded-xl border border-border" /></Field>
        </div>

        <div className="space-y-3 rounded-xl border border-border bg-surface-2 p-4">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={customize}
              onChange={(e) => setCustomize(e.target.checked)}
              className="mt-0.5"
            />
            <span className="text-sm">
              <span className="font-semibold">Add your branding</span>
              <span className="mt-0.5 block text-muted">
                Upload your logo and add your business name — stays on your PNG download.
              </span>
            </span>
          </label>

          {customize && (
            <div className="space-y-3 border-t border-border pt-3">
              <Field label="Your logo" hint="PNG, JPG or SVG — shown in the center">
                <div className="flex flex-wrap items-center gap-3">
                  <label className="cursor-pointer rounded-xl border border-dashed border-border bg-surface px-4 py-2 text-sm font-medium hover:bg-border">
                    Upload logo
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => onLogoFile(e.target.files?.[0])}
                    />
                  </label>
                  {logoDataUrl && (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={logoDataUrl} alt="Logo preview" className="h-10 w-10 rounded-lg border border-border object-cover" />
                      <Button variant="secondary" size="sm" onClick={() => setLogoDataUrl(undefined)}>Remove</Button>
                    </>
                  )}
                </div>
              </Field>
              {logoDataUrl && (
                <Field label="Logo size">
                  <input
                    type="range"
                    min={0.12}
                    max={0.28}
                    step={0.01}
                    value={logoScale}
                    onChange={(e) => setLogoScale(Number(e.target.value))}
                    className="w-full"
                  />
                  <p className="text-xs text-muted">{Math.round(logoScale * 100)}% of QR code</p>
                </Field>
              )}
              <Field label="Brand / business name">
                <Input value={footerTitle} onChange={(e) => setFooterTitle(e.target.value)} placeholder="Acme Coffee" />
              </Field>
              <Field label="Website or tagline">
                <Input value={footerSubtitle} onChange={(e) => setFooterSubtitle(e.target.value)} placeholder="acmecoffee.com" />
              </Field>
              <Notice tone="info">Logo and text are composited locally in your browser — nothing is uploaded to our servers.</Notice>
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-border bg-surface-2 p-6">
        {url ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="QR code" className={`rounded-xl bg-white p-2 ${isBranded ? "max-h-80 w-auto" : "h-56 w-56"}`} />
            <Button onClick={() => download(dataUrlToBlob(url), isBranded ? "custom-qr-code.png" : "qr-code.png")}>
              <span>Download PNG</span>
            </Button>
          </>
        ) : (
          <p className="text-sm text-muted">Enter content to generate a QR code</p>
        )}
      </div>
    </div>
  );
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [head, b64] = dataUrl.split(",");
  const mime = head.match(/:(.*?);/)?.[1] ?? "image/png";
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

/* ------------------------------ Barcode ------------------------------------ */
export function BarcodeGenerator() {
  const [text, setText] = React.useState("123456789012");
  const [format, setFormat] = React.useState("CODE128");
  const [error, setError] = React.useState("");
  const ref = React.useRef<SVGSVGElement>(null);
  React.useEffect(() => {
    if (!ref.current) return;
    try {
      JsBarcode(ref.current, text || " ", { format, width: 2, height: 90, displayValue: true });
      setError("");
    } catch {
      setError(`"${text}" is not valid for ${format}.`);
    }
  }, [text, format]);
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Content"><Input value={text} onChange={(e) => setText(e.target.value)} /></Field>
        <Field label="Format">
          <Select value={format} onChange={(e) => setFormat(e.target.value)}>
            {["CODE128", "CODE39", "EAN13", "EAN8", "UPC", "ITF14", "MSI", "pharmacode"].map((f) => <option key={f}>{f}</option>)}
          </Select>
        </Field>
      </div>
      {error && <Notice tone="error">{error}</Notice>}
      <div className="grid place-items-center rounded-2xl border border-border bg-white p-6">
        <svg ref={ref} />
      </div>
      <Button onClick={() => {
        if (!ref.current) return;
        const svg = new XMLSerializer().serializeToString(ref.current);
        download(svg, "barcode.svg", "image/svg+xml");
      }}>Download SVG</Button>
    </div>
  );
}
