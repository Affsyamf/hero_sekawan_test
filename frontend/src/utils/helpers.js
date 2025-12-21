/**
 * Format angka menjadi format mata uang Rupiah (IDR)
 * @param {number} amount - Jumlah yang akan diformat
 * @param {boolean} includeSymbol - Tampilkan simbol Rp atau tidak (default: true)
 * @returns {string} Format: Rp 1.234.567 atau 1.234.567
 */
export const formatCurrency = (amount, includeSymbol = true) => {
  if (amount === null || amount === undefined)
    return includeSymbol ? "Rp 0" : "0";

  const formatted = new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

  return includeSymbol ? `Rp ${formatted}` : formatted;
};

/**
 * Format angka dengan pemisah ribuan
 * @param {number} number - Angka yang akan diformat
 * @returns {string} Format: 23.780
 */
export const formatNumber = (number) => {
  if (number === null || number === undefined) return "0";

  return new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(number);
};

/**
 * Format angka dengan desimal
 * @param {number} number - Angka yang akan diformat
 * @param {number} decimals - Jumlah digit desimal (default: 2)
 * @returns {string} Format: 23.780,50
 */
export const formatDecimal = (number, decimals = 2) => {
  if (number === null || number === undefined) return "0";

  return new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(number);
};

/**
 * Format tanggal menjadi format Indonesia
 * @param {string|Date} date - Tanggal yang akan diformat
 * @param {string} format - Format output ('long', 'short', 'medium')
 * @returns {string} Format: 01 January 2024
 */
export const formatDate = (date, format = "long") => {
  if (!date) return "";

  const d = new Date(date);

  if (isNaN(d.getTime())) return "";

  const options = {
    long: { day: "2-digit", month: "long", year: "numeric" },
    medium: { day: "2-digit", month: "short", year: "numeric" },
    short: { day: "2-digit", month: "2-digit", year: "numeric" },
  };

  return new Intl.DateTimeFormat("id-ID", options[format]).format(d);
};

/**
 * Format tanggal dan waktu
 * @param {string|Date} date - Tanggal yang akan diformat
 * @returns {string} Format: 01 January 2024, 14:30
 */
export const formatDateTime = (date) => {
  if (!date) return "";

  const d = new Date(date);

  if (isNaN(d.getTime())) return "";

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
};

/**
 * Format waktu saja
 * @param {string|Date} date - Tanggal yang akan diformat
 * @returns {string} Format: 14:30
 */
export const formatTime = (date) => {
  if (!date) return "";

  const d = new Date(date);

  if (isNaN(d.getTime())) return "";

  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
};

/**
 * Potong teks dengan ellipsis
 * @param {string} text - Teks yang akan dipotong
 * @param {number} maxLength - Panjang maksimal
 * @returns {string} Teks yang sudah dipotong
 */
export const truncateText = (text, maxLength = 50) => {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
};

/**
 * Kapitalisasi huruf pertama
 * @param {string} text - Teks yang akan dikapitalisasi
 * @returns {string} Teks dengan huruf pertama kapital
 */
export const capitalize = (text) => {
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

/**
 * Kapitalisasi setiap kata
 * @param {string} text - Teks yang akan dikapitalisasi
 * @returns {string} Teks dengan setiap kata dikapitalisasi
 */
export const capitalizeWords = (text) => {
  if (!text) return "";
  return text
    .split(" ")
    .map((word) => capitalize(word))
    .join(" ");
};

/**
 * Format nomor telepon Indonesia
 * @param {string} phone - Nomor telepon
 * @returns {string} Format: 0812-3456-7890
 */
export const formatPhone = (phone) => {
  if (!phone) return "";
  const cleaned = phone.replace(/\D/g, "");
  const match = cleaned.match(/^(\d{4})(\d{4})(\d+)$/);
  if (match) {
    return `${match[1]}-${match[2]}-${match[3]}`;
  }
  return phone;
};

/**
 * Validasi email
 * @param {string} email - Email yang akan divalidasi
 * @returns {boolean} True jika valid
 */
export const isValidEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

/**
 * Generate random string
 * @param {number} length - Panjang string
 * @returns {string} Random string
 */
export const generateRandomString = (length = 10) => {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Delay/Sleep function
 * @param {number} ms - Milliseconds
 * @returns {Promise}
 */
export const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Hitung persentase
 * @param {number} value - Nilai
 * @param {number} total - Total
 * @param {number} decimals - Jumlah desimal (default: 2)
 * @returns {string} Format: 75.50%
 */
export const calculatePercentage = (value, total, decimals = 2) => {
  if (total === 0) return "0%";
  const percentage = (value / total) * 100;
  return `${percentage.toFixed(decimals)}%`;
};

/**
 * Format file size
 * @param {number} bytes - Ukuran dalam bytes
 * @returns {string} Format: 1.5 MB
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
};

/**
 * Debounce function
 * @param {Function} func - Function yang akan di-debounce
 * @param {number} wait - Waktu tunggu dalam ms
 * @returns {Function}
 */
export const debounce = (func, wait = 300) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Deep clone object
 * @param {Object} obj - Object yang akan di-clone
 * @returns {Object} Cloned object
 */
export const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

/**
 * Check apakah object kosong
 * @param {Object} obj - Object yang akan dicek
 * @returns {boolean}
 */
export const isEmptyObject = (obj) => {
  return Object.keys(obj).length === 0;
};

/**
 * Remove duplicates dari array
 * @param {Array} array - Array yang akan dibersihkan
 * @returns {Array} Array tanpa duplikat
 */
export const removeDuplicates = (array) => {
  return [...new Set(array)];
};

/**
 * Sort array of objects by key
 * @param {Array} array - Array yang akan di-sort
 * @param {string} key - Key untuk sorting
 * @param {string} order - 'asc' atau 'desc' (default: 'asc')
 * @returns {Array} Sorted array
 */
export const sortByKey = (array, key, order = "asc") => {
  return array.sort((a, b) => {
    if (order === "asc") {
      return a[key] > b[key] ? 1 : -1;
    }
    return a[key] < b[key] ? 1 : -1;
  });
};

/**
 * Group array by key
 * @param {Array} array - Array yang akan di-group
 * @param {string} key - Key untuk grouping
 * @returns {Object} Grouped object
 */
export const groupBy = (array, key) => {
  return array.reduce((result, item) => {
    (result[item[key]] = result[item[key]] || []).push(item);
    return result;
  }, {});
};

/**
 * Format angka menjadi format singkat dengan suffix (K, M) - Versi IDR
 * @param {number} value - Angka yang akan diformat
 * @returns {string} Format: Rp 1,23M, Rp 5k, Rp 100
 */
export const formatCompactCurrency = (value) => {
  if (value === null || value === undefined) return "Rp 0";

  if (value >= 1000000000) return `Rp ${(value / 1000000000).toFixed(2)}M`; // Miliar
  if (value >= 1000000) return `Rp ${(value / 1000000).toFixed(2)}Jt`; // Juta
  if (value >= 1000) return `Rp ${(value / 1000).toFixed(0)}Rb`; // Ribu
  return `Rp ${value.toFixed(0)}`;
};

/**
 * Format angka menjadi format singkat dengan suffix (K, M)
 * @param {number} value - Angka yang akan diformat
 * @returns {string} Format: 1,23M, 5k, 100
 */
export const formatCompactNumber = (value) => {
  if (value === null || value === undefined) return "0";

  if (value >= 1000000000) return `${(value / 1000000000).toFixed(2)}M`; // Miliar
  if (value >= 1000000) return `${(value / 1000000).toFixed(2)}Jt`; // Juta
  if (value >= 1000) return `${(value / 1000).toFixed(0)}Rb`; // Ribu
  return `${value.toFixed(0)}`;
};
