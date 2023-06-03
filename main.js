// Create a WebSocket connection for chat messages
const socket = new WebSocket('wss://your-websocket-server');

// Get local video and display it
navigator.mediaDevices.getUserMedia({ video: true, audio: true })
  .then(stream => {
    const localVideo = document.getElementById('localVideo');
    localVideo.srcObject = stream;
  });

// Set up RTCPeerConnection for video/audio streaming
const configuration = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };
const pc = new RTCPeerConnection(configuration);

pc.onicecandidate = event => {
  if (event.candidate) {
    socket.send(JSON.stringify({ type: 'iceCandidate', candidate: event.candidate }));
  }
};

pc.ontrack = event => {
  const remoteVideo = document.getElementById('remoteVideo');
  remoteVideo.srcObject = event.streams[0];
};

// Send and receive chat messages
const chatInput = document.getElementById('chatInput');
const sendButton = document.getElementById('sendButton');
const chatList = document.getElementById('chatList');

sendButton.addEventListener('click', () => {
  const message = chatInput.value;
  socket.send(JSON.stringify({ type: 'chatMessage', message }));
  addChatMessage('You', message);
  chatInput.value = '';
});

socket.onmessage = event => {
  const data = JSON.parse(event.data);
  switch (data.type) {
    case 'chatMessage':
      addChatMessage('Remote', data.message);
      break;
    case 'iceCandidate':
      pc.addIceCandidate(new RTCIceCandidate(data.candidate));
      break;
  }
};

function addChatMessage(sender, message) {
  const li = document.createElement('li');
  li.textContent = `${sender}: ${message}`;
  chatList.appendChild(li);
}

// Video recording
let recordedChunks = [];

function startRecording() {
  recordedChunks = [];
  const stream = document.getElementById('remoteVideo').srcObject;
  const mediaRecorder = new MediaRecorder(stream);

  mediaRecorder.ondataavailable = event => {
    if (event.data.size > 0) {
      recordedChunks.push(event.data);
    }
  };

  mediaRecorder.onstop = () => {
    const blob = new Blob(recordedChunks);
    const videoURL = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = videoURL;
    a.download = 'recorded-video.webm';
    a.click();
  };

  mediaRecorder.start();
}

function stopRecording() {
  mediaRecorder.stop();
}
