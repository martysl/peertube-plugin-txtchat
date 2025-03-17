
class LiveChatClient {
  private ws: WebSocket;
  private chatContainer: HTMLElement;
  private messageList: HTMLElement;
  private messageInput: HTMLInputElement;
  private sendButton: HTMLButtonElement;
 
  constructor(videoId: string) {
    this.createChatInterface();
    this.connectWebSocket(videoId);
  }
 
  private createChatInterface() {
    // Create chat container
    this.chatContainer = document.createElement('div');
    this.chatContainer.id = 'live-chat-container';
    this.chatContainer.style.cssText = `
      position: absolute;
      right: 0;
      top: 0;
      width: 300px;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.8);
      color: white;
      display: flex;
      flex-direction: column;
    `;
 
    // Create message list
    this.messageList = document.createElement('div');
    this.messageList.id = 'live-chat-messages';
    this.messageList.style.cssText = `
      flex-grow: 1;
      overflow-y: auto;
      padding: 10px;
    `;
 
    // Create input container
    const inputContainer = document.createElement('div');
    inputContainer.style.cssText = `
      display: flex;
      padding: 10px;
    `;
 
    // Create message input
    this.messageInput = document.createElement('input');
    this.messageInput.type = 'text';
    this.messageInput.placeholder = 'Type your message...';
    this.messageInput.style.cssText = `
      flex-grow: 1;
      padding: 5px;
    `;
 
    // Create send button
    this.sendButton = document.createElement('button');
    this.sendButton.textContent = 'Send';
    this.sendButton.style.cssText = `
      margin-left: 5px;
      padding: 5px 10px;
    `;
 
    // Assemble the chat interface
    inputContainer.appendChild(this.messageInput);
    inputContainer.appendChild(this.sendButton);
    this.chatContainer.appendChild(this.messageList);
    this.chatContainer.appendChild(inputContainer);
 
    // Add the chat container to the page
    const videoWrapper = document.querySelector('.video-wrapper');
    if (videoWrapper) {
      videoWrapper.appendChild(this.chatContainer);
    }
 
    // Add event listeners
    this.sendButton.addEventListener('click', () => this.sendMessage());
    this.messageInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.sendMessage();
      }
    });
  }
 
  private connectWebSocket(videoId: string) {
    this.ws = new WebSocket('ws://localhost:3000');
 
    this.ws.onopen = () => {
      this.ws.send(JSON.stringify({ type: 'join', videoId }));
    };
 
    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'history') {
        data.messages.forEach((message: string) => this.addMessageToChat(message));
      } else if (data.type === 'message') {
        this.addMessageToChat(`${data.username}: ${data.content}`);
      }
    };
  }
 
  private sendMessage() {
    const message = this.messageInput.value.trim();
    if (message) {
      const username = 'User'; // You should replace this with the actual username
      this.ws.send(JSON.stringify({ type: 'message', username, content: message }));
      this.addMessageToChat(`${username}: ${message}`);
      this.messageInput.value = '';
    }
  }
 
  private addMessageToChat(message: string) {
    const messageElement = document.createElement('div');
    messageElement.textContent = message;
    this.messageList.appendChild(messageElement);
    this.messageList.scrollTop = this.messageList.scrollHeight;
  }
}
 
// Initialize the chat when the page loads
window.addEventListener('load', () => {
  const videoElement = document.querySelector('video');
  if (videoElement) {
    const videoId = videoElement.dataset.videoId;
    if (videoId) {
      new LiveChatClient(videoId);
    }
  }
});
