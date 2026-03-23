const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('ownAI', {
  platform: process.platform,
});
