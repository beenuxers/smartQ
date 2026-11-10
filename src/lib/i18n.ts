import type { LocaleCode } from "./product";

export type Messages = {
  brand: string;
  tagline: string;
  heroSupport: string;
  ctaStart: string;
  ctaSignIn: string;
  joinTitle: string;
  guestName: string;
  partySize: string;
  phone: string;
  notes: string;
  joinQueue: string;
  yourNumber: string;
  position: string;
  waiting: string;
  notified: string;
  tableReady: string;
  seated: string;
  noShow: string;
  hostDashboard: string;
  notify: string;
  markSeated: string;
  markNoShow: string;
  analytics: string;
  seatings: string;
  avgWait: string;
  noShows: string;
  joins: string;
  pricing: string;
  outlets: string;
  settings: string;
  signOut: string;
  qrCode: string;
  downloadQr: string;
  sessionHours: string;
  lunch: string;
  dinner: string;
  allDay: string;
  emptyQueue: string;
  upgrade: string;
  plan: string;
  whatsappLeft: string;
  seatingsLeft: string;
  waitlist: string;
  billing: string;
  save: string;
  saved: string;
  marketLanguage: string;
  billingCurrency: string;
  uiLanguage: string;
  notifyAgain: string;
  cancel: string;
  restore: string;
  cancelled: string;
  tabWaiting: string;
  tabCalled: string;
  tabDone: string;
  emptyCalled: string;
  emptyDone: string;
  waitMins: string;
  addWalkIn: string;
  viewEdit: string;
  close: string;
  notifyOk: string;
  notifySkipped: string;
  notifyFailed: string;
  actionFailed: string;
  queueFinished: string;
  queueDayCutoff: string;
  queueDayCutoffHint: string;
  reportDay: string;
  reportWeek: string;
  reportMonth: string;
  cancels: string;
  notifiedCount: string;
  last7QueueDays: string;
  reportRangeNote: string;
};

const en: Messages = {
  brand: "SmartQ",
  tagline: "Tables ready on WhatsApp",
  heroSupport:
    "QR waitlist for cafes and restaurants in Singapore, Indonesia, and Malaysia. Guests never need an app.",
  ctaStart: "Start free",
  ctaSignIn: "Sign in",
  joinTitle: "Join the waitlist",
  guestName: "Name",
  partySize: "Party size",
  phone: "WhatsApp number",
  notes: "Notes (optional)",
  joinQueue: "Join queue",
  yourNumber: "Your number",
  position: "Parties ahead",
  waiting: "Waiting",
  notified: "Notified",
  tableReady: "Your table is ready!",
  seated: "Seated",
  noShow: "No-show",
  hostDashboard: "Host dashboard",
  notify: "Notify",
  markSeated: "Seated",
  markNoShow: "No-show",
  analytics: "Today",
  seatings: "Seatings",
  avgWait: "Avg wait",
  noShows: "No-shows",
  joins: "Joins",
  pricing: "Pricing",
  outlets: "Outlets",
  settings: "Settings",
  signOut: "Sign out",
  qrCode: "Guest QR",
  downloadQr: "Download QR",
  sessionHours: "Session",
  lunch: "Lunch",
  dinner: "Dinner",
  allDay: "All day",
  emptyQueue: "No parties waiting",
  upgrade: "Upgrade plan",
  plan: "Plan",
  whatsappLeft: "WhatsApp left",
  seatingsLeft: "Seatings left",
  waitlist: "Waitlist",
  billing: "Billing",
  save: "Save",
  saved: "Saved",
  marketLanguage: "Market & language",
  billingCurrency: "Billing currency",
  uiLanguage: "UI language",
  notifyAgain: "Notify again",
  cancel: "Cancel",
  restore: "Restore to waiting",
  cancelled: "Cancelled",
  tabWaiting: "Waiting",
  tabCalled: "Called",
  tabDone: "Done today",
  emptyCalled: "No parties called",
  emptyDone: "No completed parties today",
  waitMins: "wait",
  addWalkIn: "Add walk-in",
  viewEdit: "View / edit",
  close: "Close",
  notifyOk: "WhatsApp sent",
  notifySkipped: "Notified in queue (WhatsApp quota skipped)",
  notifyFailed: "Queue updated; WhatsApp failed",
  actionFailed: "Action failed",
  queueFinished: "You're all set — thanks for visiting!",
  queueDayCutoff: "Queue day reset time",
  queueDayCutoffHint: "Queue numbers restart at this local time each day",
  reportDay: "Day",
  reportWeek: "Week",
  reportMonth: "Month",
  cancels: "Cancels",
  notifiedCount: "Notified",
  last7QueueDays: "Last 7 queue days",
  reportRangeNote:
    "Day uses your queue reset cutoff. Week and month use the calendar in the outlet timezone.",
};

const ms: Messages = {
  ...en,
  tagline: "Meja sedia melalui WhatsApp",
  heroSupport:
    "Senarai tunggu QR untuk kafe dan restoran di Singapura, Indonesia dan Malaysia. Pelanggan tak perlu pasang app.",
  ctaStart: "Cuba percuma",
  ctaSignIn: "Log masuk",
  joinTitle: "Sertai senarai tunggu",
  guestName: "Nama",
  partySize: "Bilangan orang",
  phone: "Nombor WhatsApp",
  notes: "Nota (pilihan)",
  joinQueue: "Sertai giliran",
  yourNumber: "Nombor anda",
  position: "Giliran di hadapan",
  waiting: "Menunggu",
  notified: "Dimaklumkan",
  tableReady: "Meja anda sudah sedia!",
  seated: "Duduk",
  noShow: "Tidak datang",
  hostDashboard: "Papan host",
  notify: "Maklumkan",
  markSeated: "Duduk",
  markNoShow: "Tidak datang",
  analytics: "Hari ini",
  seatings: "Duduk",
  avgWait: "Purata tunggu",
  noShows: "Tidak datang",
  joins: "Sertai",
  pricing: "Harga",
  outlets: "Cawangan",
  settings: "Tetapan",
  signOut: "Log keluar",
  qrCode: "QR tetamu",
  downloadQr: "Muat turun QR",
  sessionHours: "Sesi",
  lunch: "Makan tengah hari",
  dinner: "Makan malam",
  allDay: "Sepanjang hari",
  emptyQueue: "Tiada tetamu menunggu",
  upgrade: "Naik taraf",
  plan: "Pelan",
  whatsappLeft: "WhatsApp tinggal",
  seatingsLeft: "Tempat duduk tinggal",
  waitlist: "Senarai tunggu",
  billing: "Bil",
  save: "Simpan",
  saved: "Disimpan",
  marketLanguage: "Pasaran & bahasa",
  billingCurrency: "Mata wang bil",
  uiLanguage: "Bahasa UI",
  notifyAgain: "Maklumkan semula",
  cancel: "Batal",
  restore: "Kembalikan ke menunggu",
  cancelled: "Dibatalkan",
  tabWaiting: "Menunggu",
  tabCalled: "Dipanggil",
  tabDone: "Selesai hari ini",
  emptyCalled: "Tiada tetamu dipanggil",
  emptyDone: "Tiada tetamu selesai hari ini",
  waitMins: "tunggu",
  addWalkIn: "Tambah walk-in",
  viewEdit: "Lihat / edit",
  close: "Tutup",
  notifyOk: "WhatsApp dihantar",
  notifySkipped: "Dikemas kini (kuota WhatsApp dilangkau)",
  notifyFailed: "Dikemas kini; WhatsApp gagal",
  actionFailed: "Tindakan gagal",
  queueFinished: "Selesai — terima kasih!",
};

const id: Messages = {
  ...en,
  tagline: "Meja siap lewat WhatsApp",
  heroSupport:
    "Antrian QR untuk kafe dan restoran di Singapura, Indonesia, dan Malaysia. Tamu tidak perlu unduh aplikasi.",
  ctaStart: "Mulai gratis",
  ctaSignIn: "Masuk",
  joinTitle: "Gabung antrean",
  guestName: "Nama",
  partySize: "Jumlah orang",
  phone: "Nomor WhatsApp",
  notes: "Catatan (opsional)",
  joinQueue: "Masuk antrean",
  yourNumber: "Nomor Anda",
  position: "Antrean di depan",
  waiting: "Menunggu",
  notified: "Diberitahu",
  tableReady: "Meja Anda sudah siap!",
  seated: "Duduk",
  noShow: "Tidak datang",
  hostDashboard: "Dasbor host",
  notify: "Beritahu",
  markSeated: "Duduk",
  markNoShow: "Tidak datang",
  analytics: "Hari ini",
  seatings: "Duduk",
  avgWait: "Rata-rata tunggu",
  noShows: "Tidak datang",
  joins: "Gabung",
  pricing: "Harga",
  outlets: "Outlet",
  settings: "Pengaturan",
  signOut: "Keluar",
  qrCode: "QR tamu",
  downloadQr: "Unduh QR",
  sessionHours: "Sesi",
  lunch: "Siang",
  dinner: "Malam",
  allDay: "Seharian",
  emptyQueue: "Tidak ada tamu menunggu",
  upgrade: "Upgrade paket",
  plan: "Paket",
  whatsappLeft: "WhatsApp tersisa",
  seatingsLeft: "Kuota seating tersisa",
  waitlist: "Antrean",
  billing: "Tagihan",
  save: "Simpan",
  saved: "Tersimpan",
  marketLanguage: "Pasar & bahasa",
  billingCurrency: "Mata uang tagihan",
  uiLanguage: "Bahasa UI",
  notifyAgain: "Beritahu lagi",
  cancel: "Batalkan",
  restore: "Kembalikan ke menunggu",
  cancelled: "Dibatalkan",
  tabWaiting: "Menunggu",
  tabCalled: "Dipanggil",
  tabDone: "Selesai hari ini",
  emptyCalled: "Tidak ada tamu dipanggil",
  emptyDone: "Tidak ada tamu selesai hari ini",
  waitMins: "tunggu",
  addWalkIn: "Tambah walk-in",
  viewEdit: "Lihat / edit",
  close: "Tutup",
  notifyOk: "WhatsApp terkirim",
  notifySkipped: "Diperbarui (kuota WhatsApp dilewati)",
  notifyFailed: "Diperbarui; WhatsApp gagal",
  actionFailed: "Tindakan gagal",
  queueFinished: "Selesai — terima kasih!",
  queueDayCutoff: "Waktu reset nomor antrean",
  queueDayCutoffHint: "Nomor antrean mulai ulang pada jam ini setiap hari",
  reportDay: "Hari",
  reportWeek: "Minggu",
  reportMonth: "Bulan",
  cancels: "Batal",
  notifiedCount: "Diberitahu",
  last7QueueDays: "7 hari antrean terakhir",
  reportRangeNote:
    "Hari memakai waktu reset antrean. Minggu dan bulan memakai kalender zona waktu outlet.",
};

const dictionaries: Record<LocaleCode, Messages> = { en, ms, id };

export function getMessages(locale: string): Messages {
  if (locale === "ms" || locale === "id") return dictionaries[locale];
  return dictionaries.en;
}

export function resolveLocale(locale?: string | null): LocaleCode {
  if (locale === "ms" || locale === "id" || locale === "en") return locale;
  return "en";
}
