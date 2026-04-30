// Mock crypto for Node.js test environment
if (typeof crypto === 'undefined') {
  global.crypto = {
    randomUUID: () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  };
}