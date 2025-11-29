const { contextBridge,ipcRenderer } = require('electron')

/**
 * 通过 contextBridge 向渲染进程暴露少量安全 API。
 * 目前先暴露一个简单的 ping，用来确认 preload 正常工作。
 */
contextBridge.exposeInMainWorld('electronAPI', {                                                            
    ping() {                                                                                                  
      console.log('[preload] ping from renderer')                                                             
    },                                                                                                        
    minimize() {                                                                                              
      ipcRenderer.send('window-minimize')                                                                     
    },                                                                                                        
    toggleMaximize() {                                                                                        
      ipcRenderer.send('window-toggle-maximize')                                                              
    },                                                                                                        
    close() {                                                                                                 
      ipcRenderer.send('window-close')                                                                        
    }                                                                                                         
  }) 