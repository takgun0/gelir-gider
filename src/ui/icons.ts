// Kategori ikon kataloğu (Gereksinimler §5.4, Tasarım §6.4). Her ikon ayrı import edilir.
// "repeat" ve "sticky-note" katalogda yok; yalnızca durum ikonu olarak kullanılır.
import type { LucideIcon } from 'lucide-react';
import { Apple } from 'lucide-react';
import { Banknote } from 'lucide-react';
import { Bike } from 'lucide-react';
import { BookOpen } from 'lucide-react';
import { Briefcase } from 'lucide-react';
import { Bus } from 'lucide-react';
import { Car } from 'lucide-react';
import { Coffee } from 'lucide-react';
import { Coins } from 'lucide-react';
import { CreditCard } from 'lucide-react';
import { Droplet } from 'lucide-react';
import { Dumbbell } from 'lucide-react';
import { Ellipsis } from 'lucide-react';
import { Film } from 'lucide-react';
import { Fuel } from 'lucide-react';
import { Gamepad2 } from 'lucide-react';
import { Gift } from 'lucide-react';
import { GraduationCap } from 'lucide-react';
import { HeartPulse } from 'lucide-react';
import { House } from 'lucide-react';
import { Landmark } from 'lucide-react';
import { Laptop } from 'lucide-react';
import { Lightbulb } from 'lucide-react';
import { MonitorPlay } from 'lucide-react';
import { Music } from 'lucide-react';
import { Package } from 'lucide-react';
import { PawPrint } from 'lucide-react';
import { Pencil } from 'lucide-react';
import { PiggyBank } from 'lucide-react';
import { Pill } from 'lucide-react';
import { Pizza } from 'lucide-react';
import { Plane } from 'lucide-react';
import { Receipt } from 'lucide-react';
import { Scissors } from 'lucide-react';
import { Shirt } from 'lucide-react';
import { ShoppingBag } from 'lucide-react';
import { ShoppingCart } from 'lucide-react';
import { Smartphone } from 'lucide-react';
import { Sofa } from 'lucide-react';
import { SquareParking } from 'lucide-react';
import { Stethoscope } from 'lucide-react';
import { Store } from 'lucide-react';
import { Tag } from 'lucide-react';
import { Ticket } from 'lucide-react';
import { Utensils } from 'lucide-react';
import { Wallet } from 'lucide-react';
import { Wifi } from 'lucide-react';
import { Wine } from 'lucide-react';
import { includesTr } from '../domain/text';
import type { IconKey } from '../domain/types';

export const ICON_GROUPS = ['Alışveriş', 'Ev', 'Ulaşım', 'Yemek', 'Sağlık', 'Eğlence', 'Finans', 'Eğitim', 'Diğer'] as const;
export type IconGroup = (typeof ICON_GROUPS)[number];

export interface IconEntry {
  key: IconKey;
  component: LucideIcon;
  group: IconGroup;
  /** Ekran okuyucu ve arama için ad */
  label: string;
  keywords: readonly string[];
}

const e = (key: IconKey, component: LucideIcon, group: IconGroup, label: string, ...keywords: string[]): IconEntry => ({
  key,
  component,
  group,
  label,
  keywords,
});

export const ICON_CATALOG: readonly IconEntry[] = [
  e('shopping-cart', ShoppingCart, 'Alışveriş', 'Alışveriş arabası', 'market', 'süpermarket', 'bakkal', 'manav'),
  e('shopping-bag', ShoppingBag, 'Alışveriş', 'Alışveriş çantası', 'mağaza', 'çanta', 'alışveriş'),
  e('shirt', Shirt, 'Alışveriş', 'Giyim', 'kıyafet', 'giysi', 'tişört', 'moda'),
  e('gift', Gift, 'Alışveriş', 'Hediye', 'doğum günü', 'paket', 'sürpriz'),
  e('store', Store, 'Alışveriş', 'Dükkan', 'mağaza', 'çarşı', 'esnaf'),
  e('package', Package, 'Alışveriş', 'Paket', 'kargo', 'sipariş', 'internet alışverişi'),
  e('house', House, 'Ev', 'Ev', 'kira', 'konut', 'aidat', 'daire'),
  e('sofa', Sofa, 'Ev', 'Mobilya', 'koltuk', 'eşya', 'dekorasyon'),
  e('lightbulb', Lightbulb, 'Ev', 'Elektrik', 'ampul', 'fatura', 'enerji'),
  e('droplet', Droplet, 'Ev', 'Su', 'su faturası', 'damla'),
  e('wifi', Wifi, 'Ev', 'İnternet', 'wifi', 'modem', 'bağlantı'),
  e('bus', Bus, 'Ulaşım', 'Otobüs', 'toplu taşıma', 'metro', 'ulaşım kartı'),
  e('car', Car, 'Ulaşım', 'Araba', 'otomobil', 'taksi', 'araç'),
  e('fuel', Fuel, 'Ulaşım', 'Benzin', 'yakıt', 'akaryakıt', 'mazot', 'motorin'),
  e('plane', Plane, 'Ulaşım', 'Uçak', 'seyahat', 'tatil', 'uçuş', 'bilet'),
  e('bike', Bike, 'Ulaşım', 'Bisiklet', 'scooter', 'pedal'),
  e('square-parking', SquareParking, 'Ulaşım', 'Otopark', 'park', 'otopark ücreti'),
  e('utensils', Utensils, 'Yemek', 'Yemek', 'restoran', 'lokanta', 'akşam yemeği'),
  e('coffee', Coffee, 'Yemek', 'Kahve', 'kafe', 'çay', 'içecek'),
  e('pizza', Pizza, 'Yemek', 'Pizza', 'fast food', 'paket servis', 'sipariş'),
  e('apple', Apple, 'Yemek', 'Meyve', 'manav', 'sebze', 'sağlıklı'),
  e('wine', Wine, 'Yemek', 'İçki', 'şarap', 'bar', 'gece'),
  e('heart-pulse', HeartPulse, 'Sağlık', 'Sağlık', 'hastane', 'doktor', 'nabız'),
  e('pill', Pill, 'Sağlık', 'İlaç', 'eczane', 'vitamin'),
  e('stethoscope', Stethoscope, 'Sağlık', 'Muayene', 'doktor', 'klinik', 'hastane'),
  e('dumbbell', Dumbbell, 'Sağlık', 'Spor', 'spor salonu', 'fitness', 'antrenman'),
  e('ticket', Ticket, 'Eğlence', 'Bilet', 'sinema', 'konser', 'etkinlik', 'eğlence'),
  e('music', Music, 'Eğlence', 'Müzik', 'konser', 'abonelik', 'şarkı'),
  e('film', Film, 'Eğlence', 'Film', 'sinema', 'dizi'),
  e('gamepad-2', Gamepad2, 'Eğlence', 'Oyun', 'konsol', 'video oyunu'),
  e('monitor-play', MonitorPlay, 'Eğlence', 'Abonelik', 'dizi', 'yayın', 'televizyon'),
  e('smartphone', Smartphone, 'Eğlence', 'Telefon', 'mobil', 'hat', 'fatura'),
  e('banknote', Banknote, 'Finans', 'Maaş', 'nakit', 'para', 'ücret'),
  e('coins', Coins, 'Finans', 'Ek gelir', 'bozuk para', 'harçlık', 'serbest iş'),
  e('wallet', Wallet, 'Finans', 'Cüzdan', 'nakit', 'para'),
  e('piggy-bank', PiggyBank, 'Finans', 'Birikim', 'kumbara', 'tasarruf'),
  e('credit-card', CreditCard, 'Finans', 'Kredi kartı', 'kart', 'borç', 'taksit'),
  e('landmark', Landmark, 'Finans', 'Banka', 'vergi', 'devlet', 'kredi'),
  e('receipt', Receipt, 'Finans', 'Fatura', 'fiş', 'makbuz', 'ödeme'),
  e('briefcase', Briefcase, 'Finans', 'İş', 'çanta', 'serbest çalışma', 'proje'),
  e('book-open', BookOpen, 'Eğitim', 'Kitap', 'okul', 'ders', 'eğitim'),
  e('graduation-cap', GraduationCap, 'Eğitim', 'Mezuniyet', 'burs', 'üniversite', 'okul'),
  e('pencil', Pencil, 'Eğitim', 'Kırtasiye', 'kalem', 'defter', 'okul'),
  e('laptop', Laptop, 'Eğitim', 'Bilgisayar', 'kurs', 'yazılım', 'teknoloji'),
  e('tag', Tag, 'Diğer', 'Etiket', 'genel', 'diğer'),
  e('ellipsis', Ellipsis, 'Diğer', 'Diğer', 'genel', 'çeşitli'),
  e('paw-print', PawPrint, 'Diğer', 'Evcil hayvan', 'kedi', 'köpek', 'mama', 'veteriner'),
  e('scissors', Scissors, 'Diğer', 'Kuaför', 'berber', 'bakım', 'güzellik'),
];

const BY_KEY = new Map(ICON_CATALOG.map((entry) => [entry.key, entry]));

export function iconEntry(key: IconKey): IconEntry {
  return BY_KEY.get(key) ?? (BY_KEY.get('tag') as IconEntry);
}

/** Arama anahtar kelimelerde, adda ve grup adında tr-TR kurallarıyla yapılır. */
export function searchIcons(query: string): IconEntry[] {
  if (query.trim() === '') return [...ICON_CATALOG];
  return ICON_CATALOG.filter(
    (entry) =>
      includesTr(entry.group, query) || includesTr(entry.label, query) || entry.keywords.some((k) => includesTr(k, query)),
  );
}
