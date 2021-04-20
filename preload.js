// In renderer process (web page).
const { ipcRenderer, nativeImage } = require('electron');

// prints "pong"
console.log(ipcRenderer.sendSync('synchronous-message', 'ping'));

ipcRenderer.on('asynchronous-reply', (event, list) => {
  const el = document.querySelector('.package-list');
  el.innerHTML += JSON.stringify(list, null, 2);
  // console.log(list);
  // resultEl.innerText = 'OK!!';
});

ipcRenderer.on('exec-test', (event, payload) => {
  const resultEl = document.querySelector('.result');

  resultEl.innerHTML = payload;
});

ipcRenderer.on('start-play-book-reply', (event, payload) => {
  // console.log(payload);
  const resultEl = document.querySelector('.result');
  let json;

  try {
    const messageList = JSON.parse(payload);
    // console.log(payload.replace('\\"', '"'));
    // console.log(2222, json);
    resultEl.innerHTML += messageList.join('\n');
  } catch (e) {
    console.log(e);

  }
});

ipcRenderer.on('install-packages', (event, payload) => {
  const el = document.querySelector('.install-packages');

  el.innerHTML += payload
});

ipcRenderer.on('start-server', (event, payload) => {
  const el = document.querySelector('.start-server-result');

  console.log(payload);
  el.innerHTML += payload
});

ipcRenderer.on('run-task', (event, payload) => {
  const el = document.querySelector('.start-run-task-result');

  el.innerHTML = payload
});


function showNotification() {
  const myNotification = new Notification('Title', {
    body: 'Notification from the Renderer process'
  })

  // ok 버튼
  myNotification.onclick = () => {
    console.log('Notification clicked')
  }
}


document.addEventListener('DOMContentLoaded', function () {
  const buttonEl = document.querySelector('.btn');

  buttonEl.addEventListener('click', (event) => {
    event.preventDefault();

    ipcRenderer.send('asynchronous-message', 'ping');
  });

  const notiEl = document.querySelector('.noti');

  notiEl.addEventListener('click', (event) => {
    showNotification();
  });

  const menuEl = document.querySelector('.menu');

  menuEl.addEventListener('click', (event) => {
    ipcRenderer.send('show-context-menu');
  });

  const installPackages = document.querySelector('.btn-install-packages');

  installPackages.addEventListener('click', (event) => {
    ipcRenderer.send('install-packages');
  });

  const startServer = document.querySelector('.btn-start-server');

  startServer.addEventListener('click', (event) => {
    ipcRenderer.send('start-server');
  });

  const stopServer = document.querySelector('.btn-stop-server');

  stopServer.addEventListener('click', (event) => {
    ipcRenderer.send('stop-server');
  });

  const startRun = document.querySelector('.btn-run-task');

  startRun.addEventListener('click', (event) => {
    ipcRenderer.send('run-task');
  });
});

ipcRenderer.on('openImage', (e, filePath) => {
  const imgEl = document.querySelector('.img');

  const image = nativeImage.createFromPath(filePath);

  console.log(image.toDataURL());

  imgEl.src = image.toDataURL();

  console.log(imgEl.src);
});


