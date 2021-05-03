const path = require('path');
const shell = require('shelljs');
const { app, BrowserWindow, ipcMain, Menu, Notification } = require('electron');
const { spawnSync } = require('child_process');
const fs = require('fs-extra');

const ETC_PATH = path.resolve(__dirname, 'etc');
const TMP_PATH = path.resolve(__dirname, 'var/tmp');
const PID_PATH = path.resolve(__dirname, 'var/pid');
const LOG_PATH = path.resolve(__dirname, 'var/log');
const CLIENT_PATH = path.resolve(__dirname, 'client');

const PID_FILE_PATH = {
  GUNICORN: `${PID_PATH}/gunicorn.pid`,
  // CELERY: `${PID_PATH}/celery.pid`,
};

const CONF_FILE_PATH = {
  REDIS: `${ETC_PATH}/redis.conf`,
};

const LOG_FILE_PATH = {
  GUNICORN: {
    DEFAULT: `${LOG_PATH}/gunicorn.log`,
    ACCESS: `${LOG_PATH}/access.log`,
  }
};

const REDIS_SOCK_FILE_PATH = `${TMP_PATH}/nm.redis.sock`;
const DJANGO_MODULE_NAME = 'nm';
const CELERY_NODE_NAME = {
  DEFAULT: 'default',
};

const HTTP_RESPONSE_TIMEOUT = 3600;

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
  console.log('before-quit 111');

  // 나중엔 각 pid 파일에서 pid 를 가져와서, pgid 를 죽이는 기능으로 대체해야한다.
  // 또, 프로세스가 죽는 속도 문제도 개선해야한다
  // 지금은 프로세스 죽는 속도가 느려서 문제가있을 수도있을듯하다.
  // 비동기 호출로 바꾸는것도 방법중 하나일듯하다.


  // 임시 코드
  getPidsByName('redis').forEach((value) => {
    console.log('redis', killBy(value));
  });

  getPidsByName('celery').forEach((value) => {
    console.log('celery', killBy(value));
  });

  getPidsByName('gunicorn').forEach((value) => {
    console.log('gunicorn', killBy(value));
  });

  execSync({ cmd: `rm -f ${PID_PATH}/*` });
});

app.on('will-quit', () => {
  // console.log('will-quit');
})

app.on('quit', () => {
  console.log('quit');
});

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

function commandWithRun(value, hasDelay = false, delayTime = 1) {
  if (hasDelay) {
    return `${PREFIX_COMMAND} sleep ${delayTime} && ${value}`;
  } else {
    return `${PREFIX_COMMAND} ${value}`;
  }
}

// shell.exec 를 한다는 의미는 부모 프로세스에서 별도의 자식 프로세스를 만들어, 관련 command 를 실행한다는의미이고, 이렇게 명령 수행을위해 생성된 자식 프로세스는 명령 수행 후, 자동으로 소멸된다
// ps -e 라는 커맨드만 입력해도 항상 명령 수행을 위한, 프로세스가 생겼다, 소멸되는것을 볼 수 있다.
// 또 shell.exec(cd ${path}) 라는 명령을 수행해도, exec 에서 수행되는 커맨드는 별도의 셀에서 실행되므로, 해당 명령은 해당 프로세스에서만 영행을 미치고 종료됩니다.
// https://www.javaer101.com/ko/article/2661918.html
// 그래서 여기를 보면(https://nodejs.org/api/child_process.html#child_process_child_process_exec_command_options_callback) cwd 라는 옵션이 있음
function execSync({ cmd, hasDelay, delayTime, silent = true }) {
  const result = shell.exec(commandWithRun(cmd, hasDelay, delayTime), { silent });
  const { stdout } = result;

  return {
    ...result,
    stdout: stdout.replace(/\n$/g, ''),
  }
}

function exec({ cmd, hasDelay, delayTime, silent = true }) {
  return shell.exec(commandWithRun(cmd, hasDelay, delayTime), { silent, async: true });
}

const SIGNAL = {
  HUP: 1,
  INT: 2,
  QUIT: 3,
  KILL: 9,
  TERM: 15,
  STOP: 17,
  CONT: 19,
};

function killBy(pid, signal = SIGNAL.TERM) {
  const cmd = `kill -${signal} ${pid}`;

  return execSync({ cmd }).code;
}

function getPgIdOf(pid) {
  const cmd = `ps -o pgid ${pid} | awk  '{ print $1 }' | tail -1`;
  const result = execSync({ cmd, hasDelay: true });

  if (result.code === 0) {
    return parseInt(result.stdout);
  }
  return null;
}

function getPidsByName(name) {
  const cmd = `ps -e | grep ${name} | grep -v grep | awk '{ print $1 }'`;
  const result = execSync({ cmd });

  if (result.code === 0) {
    return result.stdout.split('\n')
      .map((v) => parseInt(v));
  }
  return [];
}

function getPid(pid) {
  const cmd = `ps -p ${pid} | awk '{print $1 }' | tail -1`;
  const result = execSync({ cmd, hasDelay: true });

  if (result.code === 0) {
    return parseInt(result.stdout);
  }
  return null;
}

function isExistsPid(pid) {
  return getPid(pid) ? true : false;
}

function getPidAtFile(filePath) {
  const cmd = `cat ${filePath}`;
  const result = execSync({ cmd });

  if (result.code === 0) {
    return parseInt(result.stdout);
  }
  return null;
}

function getCPUCoreCount() {
  const cmd = "sysctl hw.ncpu | awk '{print $2}'";
  const result = execSync({ cmd });

  if (result.code === 0) {
    return parseInt(result.stdout);
  }
  return 0;
}

// function db_migration() {
//   cd ${WEBAPP_DIR}
//
//   yes | python3 manage.py makemigrations
//   python3 manage.py migrate
//
//   local result_code=$?
//     echo "DB Migration: $result_code"
//   return $result_code
// }

let installConda;
let updateConda;
let startCondaEnv;
const condaEnvName = 'pyenv39';
let installCondaPackages;
const condaPath = 'conda';
const environmentFilePath = 'misc/conda_environment.yml';
let exportEnvFile;

// install 단계에서
// migration 을 해야한다
// pipenv run python client/manage.py migrate
ipcMain.on('install-packages', (event, arg) => {
  // conda 인스톨 여부를 conda 디렉토리 여부로 알 수 있을듯하다.
  shell.rm('-rf', condaPath);

  // conda install
  // conda 설치 여부에 따라, 실행 여부를 처리하면될듯하다.
  // const { code: installCondaCode } = shell.exec(`bash ./misc/miniconda_osx.sh -b -p ${condaPath}`, { silent: false, async: true });
  const { code: installCondaCode } = shell.exec(`bash ./misc/miniconda_osx.sh -b -p ${condaPath}`, { silent: false });

  console.log('installCondaCode', installCondaCode);

  if (installCondaCode === 0) {
    // environmentFilePath 파일이 없을때만 생성해야한다.
    // 이 부분은 미리해놓고, 한번 생성한후에는 만들어진 .yml 파일을 사용하면 될듯하다
    // const {code: exportEnvFileCode} = shell.exec(`conda env export -n ${condaEnvName} > ${environmentFilePath}`, {silent: false});

    // 만들어진 파일로 가상 환경을 생성한다.
    // 생성된 의존성 관리 파일(environmentFilePath)을 통해, conda 가상 환경을 생성한다.
    // 위에서 이야기한 condaPath 존재 여부에 따라, create 를 update 로 변경하면될듯하다.

    // 예: conda env update -p ${CONDA_PREFIX} -f ${BASE_DIR}/misc/conda_environment.yml
    const {code: installCondaPackagesCode} = shell.exec(`conda env create -f ${environmentFilePath} -n ${condaEnvName}`, {silent: false});

    console.log('installCondaPackagesCode CLOSE', installCondaPackagesCode);

    if (installCondaPackagesCode === 0) {
      // conda 가상 환경을 활성화하는 이 부분은 항상 해야하는 부분이다
      // const {code: startCondaEnvCode} = shell.exec(`source conda/bin/activate ${condaEnvName}`, {silent: false});
      const {code: startCondaEnvCode} = shell.exec(`source activate ${condaEnvName}`, {silent: false});

      console.log('startCondaEnvCode CLOSE', startCondaEnvCode);

      if (startCondaEnvCode === 0) {
        console.log('startCondaEnv CLOSE', startCondaEnvCode);
        event.reply('install-packages', `COMPLETED INSTALL PACKAGES ${startCondaEnvCode}`);
        // event.reply('install-packages', code);
      }
    }
  }
});


let startDjango;
let startRedis;
let checkRedisStart;
let startCelery;
const PREFIX_COMMAND = 'pipenv run';

ipcMain.on('start-server', (event, arg) => {
  // console.log(`source conda/bin/activate ${condaEnvName}`);
  // conda 의 source activate 명령이 적용되지않는 이유
  // 아래 이슈때문에 conda 를 사용할 수 없을듯하다.
  // source conda/bin/activate pyenv39 를 실행해도, conda env list 명령으로 적용 여부를 확인하면 제대로 적용되지않는것을 확인할 수 있다.(base 환경을 가리키고있다)
  // https://stackoverflow.com/questions/59836406/nodejs-run-python-script-in-conda-environment

  // conda activate 는 shell interactive mode 에서만 동작한다고한다.
  // 대신 conda run -n env pyenv39 test.py 같은 식으로 환경 설정 + 명령을 조합한 방식으로 실행 가능하지만, 여러 커멘드를 실행할때, 좋은 방법이 아닌듯하다.
  // 더 중요한건 conda run 명령의 경우, 실행 후, 아무 응답(stdout, stderr 등)도 받을 수 없다. 히 현상을 아래 이슈에선 stdout delay 이슈라고 말하는듯하다.
  // 아무 응답도 받을 수 없다라는건, 특정 커맨드의 경우, 동기식으로 선행 명령이 완료된 후, 반드시 그 다음 명령을 수행해야할때도 있는데, 그런 경우, 아무런 output 을 받을 수 없으니, 그 호출 시점을 정확히 알기 힘들다는것이다.
  // 즉 conda run 으로 해결하는 가능한 상황은 여러 명령이 순차처리될 필요가 없는 경우일것이다.
  // https://github.com/conda/conda/issues/8386
  // const createVirtualEnv = shell.exec(`bash shells/create_env.sh`, { silent: false, async: false });

  // if (createVirtualEnv.code === 0) {
  const CPU_CORE_COUNT  = getCPUCoreCount();

  // https://young-blog.tistory.com/29
  // https://stackoverflow.com/questions/15629923/nodejs-exec-does-not-work-for-cd-shell-cmd
  // exec(cd...) 가 부모 셀에 영향을 주지않는 이유
  shell.cd(CLIENT_PATH);

  const startDjangoCommand = `python manage.py collectstatic --no-input`;

  const startDjango = execSync({ cmd: startDjangoCommand, silent: false });

  if (startDjango.code === 0) {

    const startGunicornCommand = [];

    startGunicornCommand.push('gunicorn');
    // https://docs.gunicorn.org/en/stable/settings.html#reload
    startGunicornCommand.push('--reload');
    startGunicornCommand.push('-D');
    startGunicornCommand.push(`-p ${PID_FILE_PATH.GUNICORN}`);
    startGunicornCommand.push(`-w ${(CPU_CORE_COUNT * 2) + 1}`);
    startGunicornCommand.push(`-b 127.0.0.1:8080`);
    startGunicornCommand.push(`--chdir ${CLIENT_PATH}`);
    startGunicornCommand.push(`--access-logfile ${LOG_FILE_PATH.GUNICORN.ACCESS}`);
    startGunicornCommand.push(`--log-file ${LOG_FILE_PATH.GUNICORN.DEFAULT}`);
    startGunicornCommand.push(`--timeout ${HTTP_RESPONSE_TIMEOUT}`);
    startGunicornCommand.push('nm.wsgi:application');

    const startGunicorn = execSync({cmd: startGunicornCommand.join(' '), silent: false});

    if (startGunicorn.code === 0) {
      shell.cd('..');

      const startRedisServer = execSync({cmd: `redis-server ${CONF_FILE_PATH.REDIS}`, silent: false});

      // socket 파일 지정하는 부분은 나중에 다시 확인해보자
      const checkRedisStart = execSync({cmd: `redis-cli ping`});

      if (startRedisServer.code === 0 && checkRedisStart.code === 0) {

        shell.cd(CLIENT_PATH);

        // https://jiyekim.github.io/django/celery/
        // celery multi 명령어를 이용하면 worker를 background에서 실행할 수 있다
        const startCeleryCommand = [];
        startCeleryCommand.push(`celery multi start ${CELERY_NODE_NAME.DEFAULT}`);
        startCeleryCommand.push(`-A ${DJANGO_MODULE_NAME} -l info`);
        // max, min
        // https://docs.celeryproject.org/en/latest/userguide/workers.html#autoscaling
        startCeleryCommand.push('--autoscale=10,0');
        // startCeleryCommand.push(`-Q:${CELERY_NODE_NAME.DEFAULT} ${CELERY_NODE_NAME.DEFAULT}`);
        // $n 은 위에서 설정된 node name 이다.

        /**
        // 이전 프로세스 파일들을 전부 삭제해야한다.
        // 그렇지않으면, 셀러리 서버 실행 시, 오류가 발생한다.
         **/
        startCeleryCommand.push(`-E --pidfile=${PID_PATH}/celery-%n.pid`);
        startCeleryCommand.push(`--logfile=${LOG_PATH}/celery-%n%I.log`);

        console.log(startCeleryCommand.join(' '));

        const startCelery = execSync({cmd: startCeleryCommand.join(' ')});

        console.log(startCelery);

        if (startCelery.code === 0) {
          event.reply('start-server', startCelery.code);
        }
      }

      // shell.cd('..');

      // checkRedisStart.on('close', (code) => {
      //   console.log('startRedisServer', code);
      // });
      //
      //   startRedisServer.on('close', (code) => {
      //     console.log(code);
      //     if (code === 0) {
      //       const startCeleryServer = shell.exec(`${PREFIX_COMMAND} watchmedo auto-restart --directory=./ --pattern=*.py --recursive -- celery -A ${pythonPath} worker --pidfile=${PID_PATH}/celery-beat.pid --loglevel=INFO`, {
      //         silent: false,
      //         async: true
      //       });
      //
      //       if (startCeleryServer.code === 0) {
      //         event.reply('start-server', startDjangoServer, startRedisServer, checkRedisStart, startCeleryServer);
      //       }
      //     } else {
      //       console.log('error');
      //     }
      //   });
      // }
      // pid(4523)의 pgid 를 알아낸다.
      // ps -o pgid 4523 | tail -n 1

      // pgid 를 통해, 모든 자식 pid 를 제거한다.
      // kill -KILL -3405(pgid)(mac 에서도 잘된다)

      // const startDjangoServerPid = shell.exec(`${PREFIX_COMMAND} sleep 1 && ps | grep "manage.py runserver" | grep -v grep | awk '{ print $1 }'`, {silent: true}).stdout;

      // console.log(startDjangoServerPid);

      // const startRedisServer = shell.exec(`${PREFIX_COMMAND} redis-server`, { silent: true, async: true });

      // const startRedisServerPid = shell.exec(`${PREFIX_COMMAND} echo $!`, { silent: true }).stdout;

      // console.log(startRedisServerPid);


      // 리눅스에서 CPU 코어 수 가져오는 방법
      // https://nota.tistory.com/41
      // CPU_COUNT=`grep processor /proc/cpuinfo | wc -l`

      // mac 에서 CPU 코어 수 가져오는 방법
      // sysctl hw.ncpu | awk '{print $2}'

      // startDjangoServer.stdout.on('data', (data) => {
      //   console.log('startDjangoServer', data);
      // });
      //
      // startDjangoServer.on('close', (code) => {
      //   console.log('startRedisServer', code);

      // if (code === 0) {
      //   const startRedisServer = shell.exec(`${PREFIX_COMMAND} redis-server`, { silent: true, async: true });
      //   const checkRedisStart = shell.exec(`${PREFIX_COMMAND} redis-cli`, { silent: true, async: true });
      //
      //   startRedisServer.stdout.on('data', (data) => {
      //     console.log('startRedisServer', data);
      //   });
      //
      //   startRedisServer.on('close', (code) => {
      //     console.log(code);
      //     if (code === 0) {
      //       const startCeleryServer = shell.exec(`${PREFIX_COMMAND} watchmedo auto-restart --directory=./ --pattern=*.py --recursive -- celery -A ${pythonPath} worker --pidfile=${PID_PATH}/celery-beat.pid --loglevel=INFO`, {
      //         silent: false,
      //         async: true
      //       });
      //
      //       if (startCeleryServer.code === 0) {
      //         event.reply('start-server', startDjangoServer, startRedisServer, checkRedisStart, startCeleryServer);
      //       }
      //     } else {
      //       console.log('error');
      //     }
      //   });
      // }
      // });
    }
  }
});

ipcMain.on('stop-server', (event, arg) => {
  // startRedis.kill('SIGINT');
  // checkRedisStart.kill('SIGINT');
  // startCelery.kill('SIGINT');

  // console.log(startRedis);
  // console.log(checkRedisStart);
  // console.log(startCelery);
});


ipcMain.on('run-task', (event, arg) => {
  shell.cd('./ansible');

  const runTask = shell.exec(`python ./run.py`, { silent: true, async: true, encoding: 'utf-8' });

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

