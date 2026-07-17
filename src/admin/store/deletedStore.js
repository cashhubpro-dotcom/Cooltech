// deletedStore.js — lightweight in-memory trash bin
// Call addToDeleted() from any page's handleDelete before removing the item.

let _deleted = [];
const _listeners = new Set();

export function addToDeleted(item) {
  // item = { id, name, module, by, date }
  _deleted = [
    { ...item, date: item.date ?? new Date().toISOString().slice(0, 10) },
    ..._deleted,
  ];
  _listeners.forEach(fn => fn([..._deleted]));
}

export function removeFromDeleted(id) {
  _deleted = _deleted.filter(x => x.id !== id);
  _listeners.forEach(fn => fn([..._deleted]));
}

export function getDeleted() {
  return [..._deleted];
}

export function subscribeDeleted(fn) {
  _listeners.add(fn);
  return () => _listeners.delete(fn);
}