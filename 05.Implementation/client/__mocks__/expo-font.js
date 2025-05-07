export const loadAsync = jest.fn();
export const isLoaded = jest.fn(() => true);
export const loadedNativeFonts = new Set();

export default {
  loadAsync,
  isLoaded,
  loadedNativeFonts,
}; 