export function getData(key) {
  return JSON.parse(localStorage.getItem(key)) || [];
}

export function setData(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error("Storage error:", e);
    if (e.name === 'QuotaExceededError' || e.message?.includes('quota')) {
      const quotaError = new Error("STORAGE_FULL");
      throw quotaError;
    }
    throw e;
  }
}

export function clearAllData() {
  localStorage.clear();
}
