const path = require('path');
const shell = require('shelljs');
const { app, BrowserWindow, ipcMain, Menu, Notification } = require('electron');

// const process = require('process');

// 관련 이슈
// https://github.com/shelljs/shelljs/issues/704
shell.config.execPath = shell.which('node').toString();

// console.log(path.resolve('/'));
const ansiblePath = path.resolve('ansible');

let win;

function createWindow () {
  win = new BrowserWindow({
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

// 메인 프로세스에서는 오른쪽 상단 영역에 알림 노티로 표시된다(OS 수준)
function showNotification () {
  const notification = {
    title: 'Basic Notification',
    body: 'Notification from the Main process'
  }
  new Notification(notification).show()
}

const isMac = process.platform === 'darwin';

const template = [
  // { role: 'appMenu' }
  ...(isMac ? [{
    label: app.name,
    submenu: [
      { role: 'about' },
      // 메뉴 사이를 UI 로 분리하는 기능
      { type: 'separator' },
      { role: 'services' },
      {
        type: 'checkbox',
        label: 'checkboxMenu',
        checked: false,
        click: (item) => {
          if (item.checked) {
            console.log(1);
          } else {
            console.log(2);
          }
        }
      },
      {
        type: 'radio',
        label: 'radioMenu',
        checked: false,
      },
      // { type: 'separator' },
      // { role: 'hide' },
      // { role: 'hideothers' },
      // { role: 'unhide' },
      // { type: 'separator' },
      // { role: 'quit' }
    ]
  }] : []),
  // { role: 'fileMenu' }
  {
    label: 'File',
    submenu: [
      isMac ? { role: 'close' } : { role: 'quit' }
    ]
  },
  // { role: 'editMenu' }
  {
    label: 'Edit',
    submenu: [
      { role: 'undo' },
      { role: 'redo' },
      { type: 'separator' },
      { role: 'cut' },
      { role: 'copy' },
      { role: 'paste' },
      ...(isMac ? [
        { role: 'pasteAndMatchStyle' },
        { role: 'delete' },
        { role: 'selectAll' },
        { type: 'separator' },
        {
          label: 'Speech',
          submenu: [
            { role: 'startSpeaking' },
            { role: 'stopSpeaking' }
          ]
        }
      ] : [
        { role: 'delete' },
        { type: 'separator' },
        { role: 'selectAll' }
      ])
    ]
  },
  // { role: 'viewMenu' }
  {
    label: 'View',
    submenu: [
      { role: 'reload' },
      { role: 'forceReload' },
      { role: 'toggleDevTools' },
      { type: 'separator' },
      { role: 'resetZoom' },
      { role: 'zoomIn' },
      { role: 'zoomOut' },
      { type: 'separator' },
      { role: 'togglefullscreen' }
    ]
  },
  // { role: 'windowMenu' }
  {
    label: 'Window',
    submenu: [
      { role: 'minimize' },
      { role: 'zoom' },
      ...(isMac ? [
        { type: 'separator' },
        { role: 'front' },
        { type: 'separator' },
        { role: 'window' }
      ] : [
        { role: 'close' }
      ])
    ]
  },
  {
    role: 'help',
    submenu: [
      {
        label: 'Learn More',
        click: async () => {
          const { shell } = require('electron')
          await shell.openExternal('https://electronjs.org')
        }
      }
    ]
  }
]

const menu = Menu.buildFromTemplate(template)
Menu.setApplicationMenu(menu)


// returns Promise
app.whenReady().then(createWindow);

app.on('will-finish-launching', () => {
  console.log('will-finish-launching');
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('ready', async () => {
  console.log('ready');
  console.log(process.getCPUUsage());
  console.log(process.execPath);
  console.log(process.version);
  console.log(process.versions);
  console.log(process.windowsStore);
  console.log(process.pid);
  console.log(await process.getProcessMemoryInfo());
  // On macOS -> '10.13.6'
  // On Windows -> '10.0.17763'
  // On Linux -> '4.15.0-45-generic'
  console.log(await process.getSystemVersion());
  console.log(process.isMainFrame);

  showNotification();

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
app.on('open-file', (e, args) => {
  console.log('open-file');
  // console.log(win.webContents.send);
  // console.log(win.webContents.postMessage);
  // win.webContents.postMessage('open-image', [e, args])
  console.log(args);
  win.webContents.send('openImage', args);
  // webContents.postMessage('open-file', { message: 'hello' }, [port1])
})

// attempting to re-launch the application when it's already running, or clicking on the application's dock or taskbar icon.
// focus 를 잃었다가, 다시 focus 를 받아도 activate 이벤트가 발생한다.
app.on('activate', () => {
  console.log('activate');
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

// 추가된 문서 클릭 시, open-file 이벤트가 실행된다.
app.addRecentDocument('/Users/user/common-error.png');

let installConda;
let updateConda;
let startCondaEnv;
const condaEnvName = 'pyenv38';
let installCondaPackages;
const condaPath = 'conda';
const environmentFilePath = 'misc/conda_environment.yml';
let exportEnvFile;

ipcMain.on('install-packages', (event, arg) => {
  shell.rm('-rf', 'conda');

  // conda install
  installConda = shell.exec(`bash ./misc/miniconda_osx.sh -b -p ${condaPath}`, { silent: false, async: true });

  installConda.on('close', (installCondaCode) => {
    console.log('installConda CLOSE', installCondaCode);

    // environmentFilePath 파일이 없을때만 생성해야한다.
    const { code: exportEnvFileCode } = shell.exec(`conda env export -n ${condaEnvName} > ${environmentFilePath}`, { silent: false });

    if (exportEnvFileCode === 0) {
      console.log('exportEnvFileCode CLOSE', exportEnvFileCode);

      // 만들어진 파일로 가상 환경을 생성한다.
      const {code: installCondaPackagesCode} = shell.exec(`conda env create -f misc/conda_environment.yml -n ${condaEnvName}`, { silent: false });

      console.log('installCondaPackagesCode CLOSE', installCondaPackagesCode);

      if (installCondaPackagesCode === 0) {
        const {code: startCondaEnvCode} = shell.exec(`source conda/bin/activate ${condaEnvName}`, { silent: false });

        console.log('startCondaEnvCode CLOSE', startCondaEnvCode);

        if (startCondaEnvCode === 0) {
          console.log('startCondaEnv CLOSE', startCondaEnvCode);
          event.reply('install-packages', `COMPLETED INSTALL PACKAGES ${startCondaEnvCode}`);
          // event.reply('install-packages', code);
        }
      }
    }
  });
});


let startRedis;
let checkRedisStart;
let startCelery;

ipcMain.on('start-server', (event, arg) => {
  shell.cd('./ansible');

  startRedis = shell.exec(`python --version && ansible --version && redis-server`, { silent: false, async: true });
  checkRedisStart = shell.exec(`redis-cli`, { silent: true, async: true });
  startCelery = shell.exec(`celery -A celery_test worker --loglevel=info`, { silent: true, async: true });

  startRedis.stdout.on('data', (data) => {
    event.reply('start-server', data);
  });

  checkRedisStart.stdout.on('data', (data) => {
    event.reply('start-server', data);
  });

  startCelery.stdout.on('data', (data) => {
    event.reply('start-server', data);
  });

  shell.cd('..');
});

ipcMain.on('stop-server', (event, arg) => {
  startRedis.kill('SIGINT');
  checkRedisStart.kill('SIGINT');
  startCelery.kill('SIGINT');

  console.log(startRedis);
  console.log(checkRedisStart);
  console.log(startCelery);
});


ipcMain.on('run-task', (event, arg) => {
  shell.cd('./ansible');

  const runTask = shell.exec(`python3 ./run.py`, { silent: true, async: true, encoding: 'utf-8' });

  runTask.stdout.on('data', (data) => {
    // \n 제어문자가 포함되어있다(print는 기본적으로 출력하는 값 끝에 \n을 붙입니다)
    // https://dojang.io/mod/page/view.php?id=1224
    data = data.replace(/[\r\n]/g, '');

    if (data === 'True') {
      console.log(data);
      event.reply('run-task', 'OK');
    }
  });

  runTask.stderr.on('data', (data) => {
    event.reply('run-task', data);
  });

  runTask.on('close', (code) => {
    // event.reply('run-task', 'OK');
  });

  shell.cd('..');
});

ipcMain.on('asynchronous-message', (event, arg) => {
  const listChild = shell.exec('npm list --json --depth 1', { silent: true, async: true });
  // const playChild = shell.exec('ansible-playbook ./ansible/playbooks/test.yaml -i ./ansible/hosts.ini', { silent: true, async: true });
  // const playChild = shell.exec(`python3 ${ansiblePath}/run.py`, { silent: true, async: true });
  const playChild = shell.exec(`python3 ${ansiblePath}/exec_test.py`, { silent: true, async: true });

  listChild.stdout.on('data', (data) => {
    event.reply('asynchronous-reply', data);
  });

  playChild.stdout.on('data', (data) => {
    console.log('exec-test', data);
    // event.reply('start-play-book-reply', data);
    event.reply('exec-test', data);
  });

  playChild.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`);
  });
});

ipcMain.on('synchronous-message', (event, arg) => {
  // console.log('synchronous-message', arg) // prints "ping"
  event.returnValue = 'pong2'
})

// main
ipcMain.on('show-context-menu', (event) => {
  const template = [
    {
      label: 'Menu Item 1',
      click: () => { event.sender.send('context-menu-command', 'menu-item-1') }
    },
    { type: 'separator' },
    { label: 'Menu Item 2', type: 'checkbox', checked: true }
  ]
  const menu = Menu.buildFromTemplate(template);

  menu.popup({
    window: win,
    // x: 100,
    // y: 100,
    // positioningItem: 0,
    // callback: () => {},
  });
})

