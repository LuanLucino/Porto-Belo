

function setLocalStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function getLocalStorage(key) {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
}

function setCachedData(key, data, ttlMinutes = 15) {
    const entry = { data, expiresAt: Date.now() + ttlMinutes * 60 * 1000 };
    localStorage.setItem(key, JSON.stringify(entry));
}

function getCachedData(key) {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const entry = JSON.parse(raw);
    if (!entry?.expiresAt || Date.now() > entry.expiresAt) {
        localStorage.removeItem(key);
        return null;
    }
    return entry.data;
}

function toSiengeQuantity(nfValue, contractValue) {
    const nf = parseFloat(nfValue);
    const total = parseFloat(contractValue);
    if (!Number.isFinite(nf) || !Number.isFinite(total) || total <= 0) return 0;
    const quantity = parseFloat((nf / total).toFixed(4));
    return Number.isFinite(quantity) ? quantity : 0;
}