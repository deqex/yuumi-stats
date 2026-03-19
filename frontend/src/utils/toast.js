const listeners = new Set();

let idCounter = 0;

function emit(toast) {
  listeners.forEach(fn => fn(toast));
}

export const toast = {
  error(message) {
    emit({ id: ++idCounter, type: 'error', message });
  },
  warn(message) {
    emit({ id: ++idCounter, type: 'warn', message });
  },
  info(message) {
    emit({ id: ++idCounter, type: 'info', message });
  },
  _subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
};
