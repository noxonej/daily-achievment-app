import type { LucideIcon } from 'lucide-react';
import {
  Activity, Archive, Award, Backpack, Banknote, Bath, Bed, BedDouble, Bell, BookOpen, Brush, Bus, Cake, Calculator,
  Calendar, CalendarDays, Car, ChartColumn, Check, ChefHat, CircleCheck, CircleDashed, Clapperboard, ClipboardList,
  Cloud, CloudSun, Coffee, Compass, CookingPot, Crown, CupSoda, Diamond, Dices, Dog, Download, Droplet, Dumbbell,
  Feather, FileText, Flame, Flower2, FolderOpen, Footprints, Fuel, Gamepad2, Gem, Gift, Glasses, Globe,
  GraduationCap, Guitar, Hand, HandHeart, Handshake, HardHat, Hourglass, House, Landmark, Laptop, Library, LifeBuoy,
  Lightbulb, Lock, Mail, Mailbox, Map, Medal, MessageCircle, MessageSquare, Moon, Motorbike, Mountain, Music,
  Newspaper, Notebook, NotebookPen, Orbit, Paintbrush, Palette, PartyPopper, Pencil, PenLine, Phone, PhoneOff, Pill,
  Plane, RefreshCw, Repeat, Ribbon, Rocket, Salad, Settings, Shield, ShieldHalf, Shirt, ShoppingBag, ShoppingBasket,
  ShowerHead, Smartphone, Smile, Soup, Sparkle, Sparkles, Speech, SprayCan, Sprout, Star, StickyNote, Sun, Sunrise,
  Sword, Swords, Target, TrendingUp, TriangleAlert, Trophy, Upload, User, Utensils, UtensilsCrossed, Wallet, Wand,
  WandSparkles, Watch, Wind, Wrench, X, Zap,
  ArrowLeft, Timer, Play, Pause, RotateCcw, Frown, Annoyed, Meh, Laugh, Share, SquarePlus, Undo2, Info, EllipsisVertical, ShieldCheck, Sunset,
  Scissors, LockOpen, Shirt as ShirtIcon,
  ChevronRight, SkipForward, Bitcoin, Receipt, PiggyBank, CalendarClock, CircleDollarSign, Search, Pin, PinOff, Trash2, Plus, Volume2, Vibrate, Languages, Clock, SunMoon, Database, BookHeart,
  Cross, Shuffle, ChevronDown, TreePalm, Heart, MountainSnow, BellRing, Brain, Quote,
} from 'lucide-react';

/**
 * The app (and everything users have already saved) identifies icons by the emoji they were created with.
 * Every emoji is drawn as a matching line icon instead, so saved quests, goals and categories keep working.
 */
const EMOJI_ICONS: Record<string, LucideIcon> = {
  '🎯': Target, '✕': X, '🔥': Flame, '🏆': Trophy, '✨': Sparkles, '📚': Library, '🗓': CalendarDays, '🚗': Car,
  '✓': Check, '📝': NotebookPen, '📅': Calendar, '✅': CircleCheck, '🧘': Flower2, '💪': Dumbbell, '💻': Laptop,
  '💰': Wallet, '💸': Banknote, '✎': Pencil, '💎': Gem, '⚡': Zap, '🎉': PartyPopper, '📖': BookOpen,
  '🏃': Footprints, '🧹': Brush, '🎨': Palette, '🗡': Sword, '🔔': Bell, '🌱': Sprout, '🛡': Shield,
  '📱': Smartphone, '🎓': GraduationCap, '🎮': Gamepad2, '🛍': ShoppingBag, '⭐': Star, '⚔': Swords, '🧭': Compass,
  '📓': Notebook, '🌅': Sunrise, '🎲': Dices, '💧': Droplet, '🙏': HandHeart, '🥗': Salad, '☎': Phone, '🚀': Rocket,
  '🎵': Music, '📊': ChartColumn, '✍': PenLine, '🔄': RefreshCw, '🏔': Mountain, '⏳': Hourglass, '🛟': LifeBuoy,
  '✈': Plane, '🎸': Guitar, '🍔': Utensils, '🚌': Bus, '🎁': Gift, '🏋': Dumbbell, '🗺': Map, '📦': Archive,
  '👑': Crown, '🌙': Moon, '📰': Newspaper, '🤸': Activity, '😴': BedDouble, '🗣': Speech, '🍱': UtensilsCrossed,
  '💬': MessageCircle, '🌟': Sparkle, '🍳': CookingPot, '🪄': WandSparkles, '☁': Cloud, '📋': ClipboardList,
  '☀': Sun, '🎖': Medal, '⚙': Settings, '🌍': Globe, '🔒': Lock, '⚠': TriangleAlert, '🏍': Motorbike, '🏠': House,
  '👟': Footprints, '⌚': Watch, '💍': Gem, '☕': Coffee, '⛽': Fuel, '🎬': Clapperboard, '👕': Shirt, '💊': Pill,
  '🐶': Dog, '🧮': Calculator, '⬇': Download, '⬆': Upload, '🏅': Award, '🧢': HardHat, '👒': Sun, '🎩': Wand,
  '🪖': ShieldHalf, '😇': CircleDashed, '🕶': Glasses, '🧣': Ribbon, '🎒': Backpack, '🦋': Feather, '🧽': SprayCan,
  '🪜': TrendingUp, '🥦': Salad, '🛏': Bed, '📧': Mail, '💵': Banknote, '💡': Lightbulb, '💌': Mail,
  '🗨': MessageSquare, '🏦': Landmark, '📄': FileText, '🖌': Paintbrush, '🍽': Utensils, '🧺': ShoppingBasket,
  '📴': PhoneOff, '📔': Notebook, '🍜': Soup, '🚶': Footprints, '🗄': Archive, '😊': Smile, '📵': PhoneOff,
  '✏': Pencil, '✉': Mail, '🚿': ShowerHead, '🗂': FolderOpen, '🌬': Wind, '🔮': Sparkle, '👨‍🍳': ChefHat,
  '👨': User, '🔧': Wrench, '💠': Diamond, '🌠': Sparkles, '☄': Orbit, '🎂': Cake, '🍲': CookingPot,
  '📮': Mailbox, '🧼': Bath, '🥤': CupSoda, '🗒': StickyNote, '🤝': Handshake, '🥾': Footprints, '🌤': CloudSun,
  '🙌': Hand, '🔁': Repeat,
  // UI-only ids (not used as saved data)
  '⬅': ArrowLeft, '⏱': Timer, '▶': Play, '⏸': Pause, '↺': RotateCcw, '↩': Undo2, 'ℹ': Info, '⋮': EllipsisVertical,
  '😞': Frown, '😕': Annoyed, '😐': Meh, '🙂': Smile, '😄': Laugh, '📤': Share, '➕': SquarePlus, '🔐': ShieldCheck,
  '🌇': Sunset, '✂': Scissors, '🔓': LockOpen, '👚': ShirtIcon,
  '›': ChevronRight, '🔍': Search, '📌': Pin, '📍': PinOff, '🗑': Trash2, '＋': Plus, '🔊': Volume2, '📳': Vibrate,
  '🔤': Languages, '🕐': Clock, '🌗': SunMoon, '💾': Database, '📕': BookHeart, '⏭': SkipForward, '₿': Bitcoin, '🧾': Receipt, '🐷': PiggyBank, '🪙': CircleDollarSign, '📆': CalendarClock,
  '✝': Cross, '🔀': Shuffle, '▾': ChevronDown, '🏖': TreePalm, '💛': Heart, '🧗': MountainSnow, '🛎': BellRing, '🧠': Brain, '❝': Quote,
};

export function normalizeIconId(name: string): string {
  return name.replace(/️/g, '').trim();
}

export function resolveIcon(name: string | undefined | null): LucideIcon {
  if (!name) return Sparkles;
  const key = normalizeIconId(name);
  // Exact match first (covers multi-part emoji like 👨‍🍳), then the first character alone.
  return EMOJI_ICONS[key] ?? EMOJI_ICONS[Array.from(key)[0] ?? ''] ?? Sparkles;
}
