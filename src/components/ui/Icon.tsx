import {
  Type, Code2, ShieldCheck, FileText, Image, Palette, Calculator, Ruler,
  Search, Share2, Repeat, Wrench, Menu, X, Sun, Moon, ChevronDown, ChevronRight,
  ArrowRight, ArrowLeft, Copy, Check, Download, Upload, Trash2, RefreshCw,
  Sparkles, Zap, Lock, Globe, Heart, Star, ExternalLink,
  Shuffle, Plus, Minus, Eye, EyeOff, Clipboard, Hash, Wand2, Gauge, Layers,
  Loader2, Info, Bot, Server, Terminal, AlertTriangle, Activity, Droplet, ScanText,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  Type, Code2, ShieldCheck, FileText, Image, Palette, Calculator, Ruler,
  Search, Share2, Repeat, Wrench, Menu, X, Sun, Moon, ChevronDown, ChevronRight,
  ArrowRight, ArrowLeft, Copy, Check, Download, Upload, Trash2, RefreshCw,
  Sparkles, Zap, Lock, Globe, Heart, Star, ExternalLink,
  Shuffle, Plus, Minus, Eye, EyeOff, Clipboard, Hash, Wand2, Gauge, Layers,
  Loader2, Info, Bot, Server, Terminal, AlertTriangle, Activity, Droplet, ScanText,
};

export function Icon({
  name,
  className,
  size,
}: {
  name: string;
  className?: string;
  size?: number;
}) {
  const Cmp = ICONS[name] ?? Wrench;
  return <Cmp className={className} size={size} aria-hidden />;
}
