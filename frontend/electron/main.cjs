
const { app, BrowserWindow ,ipcMain} = require('electron')
const path = require('path')

// 开发模式标记：通过 npm script 里的 ELECTRON_DEV 控制
const isDev = process.env.ELECTRON_DEV === 'true'

/**
 * 创建主窗口
 */
function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        frame: false,               // 去掉原生边框和标题栏 
        title:'ScholarWeaver',
        icon: path.join(__dirname, 'app.ico'), 
        webPreferences: {
            // 预加载脚本：用于暴露少量 API 给前端（目前只是占位）
            preload: path.join(__dirname, 'preload.cjs'),
            // 安全相关配置：不直接在渲染进程开放 Node 能力
            contextIsolation: true,
            nodeIntegration: false
        }
    })
        // ★ 拦截页面改标题，强制用我们自己的                                                                     
    win.on('page-title-updated', (event) => {                                                                 
      event.preventDefault()              // 阻止使用 document.title                                          
      win.setTitle('ScholarWeaver')       // 始终保持这个标题                                                 
    })                                                                                                        
         

    if (isDev) {
        // 开发模式：连本地 Vite dev server
        win.loadURL('http://127.0.0.1:5174/')
        win.webContents.openDevTools()
    } else {
        // 打包后：加载本地打包好的前端页面
        // __dirname 指向 electron 目录，所以 ../dist/index.html
        win.loadFile(path.join(__dirname, '../dist/index.html'))
    }
}

/**
 * 应用生命周期
 */
app.whenReady().then(() => {
      app.setName('ScholarWeaver')  
    createWindow()

    app.on('activate', () => {
        // macOS 上点击 Dock 图标时，如果没有窗口则重新创建
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow()
        }
    })
})

// 所有窗口关闭时退出（macOS 除外，遵循原生行为）
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

ipcMain.on('window-minimize', () => {                                                                       
    const win = BrowserWindow.getFocusedWindow()                                                              
    if (win) win.minimize()                                                                                   
  })                                                                                                          
                                                                                                              
  ipcMain.on('window-toggle-maximize', () => {                                                                
    const win = BrowserWindow.getFocusedWindow()                                                              
    if (!win) return                                                                                          
    if (win.isMaximized()) win.restore()                                                                      
    else win.maximize()                                                                                       
  })                                                                                                          
                                                                                                              
  ipcMain.on('window-close', () => {                                                                          
    const win = BrowserWindow.getFocusedWindow()                                                              
    if (win) win.close()                                                                                      
  })       