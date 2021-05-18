const { app, BrowserWindow, screen } = require('electron');
// require('electron-reload')(__dirname);

global.sharedObject = {cliArgs: process.argv};

const createWindow = () => {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;

    window = new BrowserWindow({
        width: width / 1.25,
        height: height / 1.25,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation:false,
            enableRemoteModule: true
        }
    });

    window.loadFile('public/index.html');
};

let window = null;
process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';
app.whenReady().then(createWindow)
app.on('window-all-closed', () => app.quit());