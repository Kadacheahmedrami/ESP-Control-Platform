const socket = new WebSocket('ws://192.168.1.106:81/ws');

socket.onopen = () => {
  console.log('WebSocket connection established');
  

  // Request a temperature update every 5 seconds.
  setInterval(() => {
    // Send a JSON message requesting a temperature update.
    const request = {
      deviceId: 'humidity1',
      sensor: 'humidity'
    };
    socket.send(JSON.stringify(request));
  }, 5000);
};

socket.onmessage = (event) => {
  console.log('Message from server:', event.data);
  try {
    const data = JSON.parse(event.data);
    
    // Check if the received message is a sensor update for temperature.
    if (data.sensor === 'humidity' && data.deviceId === 'humidity1') {
      console.log('Current humidity:', data.value);
    } else {
      console.log('Received data:', data);
    }
  } catch (e) {
    console.error('Error parsing message:', e);
  }
};

socket.onclose = () => {
  console.log('WebSocket connection closed');
};

socket.onerror = (error) => {
  console.error('WebSocket error:', error);
};
