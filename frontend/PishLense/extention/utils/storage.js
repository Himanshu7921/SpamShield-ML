// utils/storage.js
// Centralized localStorage helper for PhishLens

const STORAGE_KEY = "phishlens_scans";

/**
 * Get all stored scans
 */
export function getAllScans() {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

/**
 * Save all scans
 */
export function saveAllScans(scans) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(scans));
}

/**
 * Add a new scan to storage
 */
export function addScan(scan) {
  const scans = getAllScans();
  scans.unshift(scan);
  saveAllScans(scans);
}

/**
 * Clear all scan data
 */
export function clearScans() {
  localStorage.removeItem(STORAGE_KEY);
}
