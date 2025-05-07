// Mock for expo-file-system
module.exports = {
  documentDirectory: 'file:///mock/document/directory/',
  cacheDirectory: 'file:///mock/cache/directory/',
  bundleDirectory: 'file:///mock/bundle/directory/',
  downloadAsync: jest.fn().mockResolvedValue({ uri: 'file:///mock/downloaded/file' }),
  deleteAsync: jest.fn().mockResolvedValue(true),
  getInfoAsync: jest.fn().mockResolvedValue({ exists: true, uri: 'file:///mock/file/info' }),
  readAsStringAsync: jest.fn().mockResolvedValue('mock file content'),
  writeAsStringAsync: jest.fn().mockResolvedValue(undefined),
  makeDirectoryAsync: jest.fn().mockResolvedValue(undefined),
  moveAsync: jest.fn().mockResolvedValue(undefined),
  copyAsync: jest.fn().mockResolvedValue(undefined),
  readDirectoryAsync: jest.fn().mockResolvedValue(['file1', 'file2']),
  createDownloadResumable: jest.fn().mockImplementation(() => ({
    downloadAsync: jest.fn().mockResolvedValue({ uri: 'file:///mock/downloaded/file' }),
    pauseAsync: jest.fn().mockResolvedValue({}),
    resumeAsync: jest.fn().mockResolvedValue({ uri: 'file:///mock/downloaded/file' }),
    savable: jest.fn()
  }))
}; 