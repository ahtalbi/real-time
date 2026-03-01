let tabs = new Set();

onconnect = (e) => {
  const port = e.ports[0];
  tabs.add(port);

  port.onmessage = (msg) => {
    if (msg.data.type === "disconnect") {
      tabs.delete(port);
      port.close();
      console.log(tabs.size);
      
      if (tabs.size === 0) {
        console.log("no tabs left");
      }
      return;
    }
    tabs.forEach((tab) => {
      tab.postMessage(msg.data);w
    });
  };

  port.onclose = () => {
    tabs.delete(port);
  }
};
