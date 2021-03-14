// In renderer process (web page).
const { ipcRenderer } = require('electron');

// prints "pong"
console.log(ipcRenderer.sendSync('synchronous-message', 'ping'));

ipcRenderer.on('asynchronous-reply', (event, list) => {
  const el = document.querySelector('.package-list');

  console.log(list);

  el.innerHTML = JSON.stringify(list, null, 2);
});

document.addEventListener('DOMContentLoaded', function () {
  console.log(21312312);
  const buttonEl = document.querySelector('.btn');
  buttonEl.addEventListener('click', (event) => {
    console.log(2312);
    event.preventDefault();

    ipcRenderer.send('asynchronous-message', 'ping');
  });
});
