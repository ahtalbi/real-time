let tabs = new Set();

onconnect = (e) => {
  const port = e.ports[0];
  tabs.add(port);

  port.onmessage = (msg) => {
    tabs.forEach((tab) => {
      tab.postMessage(msg.data);
    });
  };
};
