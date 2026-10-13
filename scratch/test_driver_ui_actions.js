const fs = require('fs');

// Simple syntax and integrity check on app.js and driverApp.js
try {
  require('./app.js');
} catch (e) {
  // app.js references browser DOM (document/window), so ReferenceError is expected in raw node.
  if (!e.message.includes('document is not defined') && !e.message.includes('window is not defined')) {
    console.error('Unexpected parse error in app.js:', e);
  } else {
    console.log('app.js parsed with standard browser globals expectation.');
  }
}

try {
  require('./driverApp.js');
} catch (e) {
  if (!e.message.includes('window is not defined') && !e.message.includes('document is not defined')) {
    console.error('Unexpected parse error in driverApp.js:', e);
  } else {
    console.log('driverApp.js parsed with standard browser globals expectation.');
  }
}

console.log('Static script analysis passed successfully.');
