const path = require('path');
const shell = require('shelljs');
const { app, BrowserWindow, ipcMain } = require('electron');

shell.config.execPath = shell.which('node').toString();

console.log(path.resolve('/'));

function createWindow () {
  const win = new BrowserWindow({
    // width: 800,
    // height: 600,
    webPreferences: {
      preload: path.resolve(__dirname, 'preload.js'),
      // nodeIntegration: true,
      // contextIsolation: false,
      // enableRemoteModule: true,
    },
  })

  win.loadFile('index.html')
}

// returns Promise
app.whenReady().then(createWindow);

app.on('will-finish-launching', () => {
  console.log('will-finish-launching');
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('ready', () => {
  console.log('ready');
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// If the user pressed Cmd + Q, or the developer called app.quit(),
// Electron will first try to close all the windows and then emit the will-quit event,
// and in this case the window-all-closed event would not be emitted.
app.on('window-all-closed', () => {
  console.log('window-all-closed');
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  console.log('before-quit');
})

app.on('will-quit', () => {
  console.log('will-quit');
})

app.on('quit', () => {
  console.log('quit');
})

// open-file is also emitted when a file is dropped onto the dock and the application is not yet running
app.on('open-file', () => {
  console.log('open-file');
})

// attempting to re-launch the application when it's already running, or clicking on the application's dock or taskbar icon.
app.on('activate', () => {
  console.log('activate');
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

ipcMain.on('asynchronous-message', (event, arg) => {
  // console.log('asynchronous-message', arg) // prints "ping"
    const list = shell.exec('npm list --json --depth 1', { silent: true }).stdout;

  // child.stdout.on('data', function(data) {
  //   console.log(version);
    /* ... do something with data ... */
    event.reply('asynchronous-reply', list);
  // });

  // child.stderr.on('data', (data) => {
  //   console.error(`stderr: ${data}`);
  // });

  // child.on('close', (code) => {
  //   console.log(`child process exited with code ${code}`);
  // });
  // console.log(list);

})

ipcMain.on('synchronous-message', (event, arg) => {
  // console.log('synchronous-message', arg) // prints "ping"
  event.returnValue = 'pong2'
})
