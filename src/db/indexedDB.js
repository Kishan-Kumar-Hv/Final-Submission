import { API_BASE } from "../utils/apiBase.js";

const DB_NAME = "RaithaReach";
const DB_VER = 10;
const VALID_STORES = new Set(["users", "crops", "jobs", "requirements", "exports"]);

function assertStore(store) {
  if (!VALID_STORES.has(store)) {
    throw new Error(`Unsupported store "${store}"`);
  }
}

function openLocalDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VER);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      ["users", "crops", "jobs", "requirements", "exports"].forEach((store) => {
        if (!db.objectStoreNames.contains(store)) {
          db.createObjectStore(store, { keyPath: "id" });
        }
      });
    };
    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => reject(event);
  });
}

async function localDbGetAll(store) {
  const db = await openLocalDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readonly");
    const request = tx.objectStore(store).getAll();
    request.onsuccess = (event) => resolve(event.target.result || []);
    request.onerror = (event) => reject(event);
  });
}

async function localDbPut(store, obj) {
  const db = await openLocalDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    tx.objectStore(store).put(obj);
    tx.oncomplete = () => resolve(obj);
    tx.onerror = (event) => reject(event);
  });
}

async function localDbDelete(store, id) {
  const db = await openLocalDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    tx.objectStore(store).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = (event) => reject(event);
  });
}

async function localDbClear(store) {
  const db = await openLocalDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    tx.objectStore(store).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = (event) => reject(event);
  });
}

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export async function dbGetAll(store) {
  assertStore(store);
  try {
    const data = await apiRequest(`/${store}`);
    return Array.isArray(data) ? data : [];
  } catch (_) {
    return localDbGetAll(store);
  }
}

export async function dbPut(store, obj) {
  assertStore(store);
  try {
    await apiRequest(`/${store}/${obj.id}`, {
      method: "PUT",
      body: JSON.stringify(obj),
    });
    return obj;
  } catch (_) {
    return localDbPut(store, obj);
  }
}

export async function dbDelete(store, id) {
  assertStore(store);
  try {
    await apiRequest(`/${store}/${id}`, { method: "DELETE" });
    return;
  } catch (_) {
    return localDbDelete(store, id);
  }
}

export async function dbClear(store) {
  assertStore(store);
  try {
    await apiRequest(`/${store}`, { method: "DELETE" });
    return;
  } catch (_) {
    return localDbClear(store);
  }
}
