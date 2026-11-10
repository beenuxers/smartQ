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
  tabDining: string;
  tabDone: string;
  emptyCalled: string;
  emptyDining: string;
  emptyDone: string;
  seatToTable: string;
  finishDining: string;
  noFreeTables: string;
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
  team: string;
  inviteStaff: string;
  removeStaff: string;
  email: string;
  password: string;
  staffPasswordHint: string;
  role: string;
  ownerRole: string;
  staffRole: string;
  staffSeats: string;
  addOutlet: string;
  outletName: string;
  planLimitReached: string;
  nearLimit: string;
  staffSettingsNote: string;
  floor: string;
  tableFree: string;
  tableOccupied: string;
  tableDirty: string;
  clearTable: string;
  markReady: string;
  seatWalkIn: string;
  tableSeats: string;
  emptyFloor: string;
  manageTables: string;
  assignTable: string;
  seatWithoutTable: string;
  preferredFit: string;
  tablesTitle: string;
  addTable: string;
  tableName: string;
  floorUpgradeHint: string;
  floorIncluded: string;
  floorBillingNote: string;
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
  tabDining: "Dining",
  tabDone: "Done today",
  emptyCalled: "No parties called",
  emptyDining: "No parties dining",
  emptyDone: "No completed parties today",
  seatToTable: "Seat to table",
  finishDining: "Finish dining",
  noFreeTables: "No free tables — add tables in Settings, or use Seated.",
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
  team: "Team",
  inviteStaff: "Invite staff",
  removeStaff: "Remove",
  email: "Email",
  password: "Temporary password",
  staffPasswordHint:
    "Required for new accounts. Existing SmartQ users are added with their current password.",
  role: "Role",
  ownerRole: "Owner",
  staffRole: "Staff",
  staffSeats: "Staff seats",
  addOutlet: "Add outlet",
  outletName: "Outlet name",
  planLimitReached: "Plan limit reached.",
  nearLimit: "Near limit",
  staffSettingsNote:
    "Outlet hours can be edited. Team, billing, and market settings are owner-only.",
  floor: "Floor",
  tableFree: "Free",
  tableOccupied: "Occupied",
  tableDirty: "Dirty",
  clearTable: "Clear",
  markReady: "Ready",
  seatWalkIn: "Seat walk-in",
  tableSeats: "Seats",
  emptyFloor: "No tables yet — add them in Settings.",
  manageTables: "Manage tables",
  assignTable: "Assign table",
  seatWithoutTable: "Seat without table",
  preferredFit: "Best fit",
  tablesTitle: "Tables",
  addTable: "Add table",
  tableName: "Table name",
  floorUpgradeHint: "Table floor is included on Starter and Growth.",
  floorIncluded: "Table floor included",
  floorBillingNote: "Upgrade to Starter or Growth to unlock the table floor.",
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
  tabDining: "Sedang makan",
  tabDone: "Selesai hari ini",
  emptyCalled: "Tiada tetamu dipanggil",
  emptyDining: "Tiada tetamu sedang makan",
  emptyDone: "Tiada tetamu selesai hari ini",
  seatToTable: "Duduk ke meja",
  finishDining: "Tamat makan",
  noFreeTables: "Tiada meja kosong — tambah meja dalam Tetapan, atau guna Duduk.",
  waitMins: "tunggu",
  addWalkIn: "Tambah walk-in",
  viewEdit: "Lihat / edit",
  close: "Tutup",
  notifyOk: "WhatsApp dihantar",
  notifySkipped: "Dikemas kini (kuota WhatsApp dilangkau)",
  notifyFailed: "Dikemas kini; WhatsApp gagal",
  actionFailed: "Tindakan gagal",
  queueFinished: "Selesai — terima kasih!",
  team: "Pasukan",
  inviteStaff: "Jemput staf",
  removeStaff: "Buang",
  email: "E-mel",
  password: "Kata laluan sementara",
  staffPasswordHint:
    "Diperlukan untuk akaun baharu. Pengguna SmartQ sedia ada dikekalkan kata laluan mereka.",
  role: "Peranan",
  ownerRole: "Pemilik",
  staffRole: "Staf",
  staffSeats: "Kerusi staf",
  addOutlet: "Tambah cawangan",
  outletName: "Nama cawangan",
  planLimitReached: "Had pelan dicapai.",
  nearLimit: "Hampir had",
  staffSettingsNote:
    "Waktu sesi boleh diedit. Pasukan, bil, dan pasaran hanya untuk pemilik.",
  floor: "Lantai",
  tableFree: "Kosong",
  tableOccupied: "Diduduki",
  tableDirty: "Kotor",
  clearTable: "Kosongkan",
  markReady: "Sedia",
  seatWalkIn: "Duduk walk-in",
  tableSeats: "Tempat duduk",
  emptyFloor: "Belum ada meja — tambah dalam Tetapan.",
  manageTables: "Urus meja",
  assignTable: "Tugaskan meja",
  seatWithoutTable: "Duduk tanpa meja",
  preferredFit: "Paling sesuai",
  tablesTitle: "Meja",
  addTable: "Tambah meja",
  tableName: "Nama meja",
  floorUpgradeHint: "Lantai meja disertakan pada Starter dan Growth.",
  floorIncluded: "Lantai meja disertakan",
  floorBillingNote: "Naik taraf ke Starter atau Growth untuk lantai meja.",
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
  tabDining: "Sedang makan",
  tabDone: "Selesai hari ini",
  emptyCalled: "Tidak ada tamu dipanggil",
  emptyDining: "Tidak ada tamu sedang makan",
  emptyDone: "Tidak ada tamu selesai hari ini",
  seatToTable: "Duduk ke meja",
  finishDining: "Selesai makan",
  noFreeTables: "Tidak ada meja kosong — tambah meja di Pengaturan, atau pakai Duduk.",
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
  team: "Tim",
  inviteStaff: "Undang staf",
  removeStaff: "Hapus",
  email: "Email",
  password: "Kata sandi sementara",
  staffPasswordHint:
    "Wajib untuk akun baru. Pengguna SmartQ yang sudah ada tetap memakai kata sandi mereka.",
  role: "Peran",
  ownerRole: "Pemilik",
  staffRole: "Staf",
  staffSeats: "Kursi staf",
  addOutlet: "Tambah outlet",
  outletName: "Nama outlet",
  planLimitReached: "Batas paket tercapai.",
  nearLimit: "Mendekati batas",
  staffSettingsNote:
    "Jam sesi bisa diedit. Tim, tagihan, dan pasar hanya untuk pemilik.",
  floor: "Lantai",
  tableFree: "Kosong",
  tableOccupied: "Terisi",
  tableDirty: "Kotor",
  clearTable: "Kosongkan",
  markReady: "Siap",
  seatWalkIn: "Duduk walk-in",
  tableSeats: "Kursi",
  emptyFloor: "Belum ada meja — tambah di Pengaturan.",
  manageTables: "Kelola meja",
  assignTable: "Tugaskan meja",
  seatWithoutTable: "Duduk tanpa meja",
  preferredFit: "Paling cocok",
  tablesTitle: "Meja",
  addTable: "Tambah meja",
  tableName: "Nama meja",
  floorUpgradeHint: "Lantai meja termasuk di Starter dan Growth.",
  floorIncluded: "Lantai meja termasuk",
  floorBillingNote: "Upgrade ke Starter atau Growth untuk lantai meja.",
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
