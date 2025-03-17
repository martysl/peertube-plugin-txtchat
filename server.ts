 
import * as http from 'http';
import * as WebSocket from 'ws';
import LiveChatPlugin from './liveChatPlugin';
 
const server = http.createServer();
const wss = new WebSocket.Server({ server });
 
const chatPlugins: Map<string, LiveChatPlugin> = new Map();
 
wss.on('connection', (ws: WebSocket) => {
  let videoId: string;
 
  ws.on('message', (message: string) => {
    const data = JSON.parse(message);
 
    if (data.type === 'join') {
      videoId = data.videoId;
      if (!chatPlugins.has(videoId)) {
        chatPlugins.set(videoId, new LiveChatPlugin(videoId));
      }
 
      const messages = chatPlugins.get(videoId)!.getMessages();
      ws.send(JSON.stringify({ type: 'history', messages }));
    } else if (data.type === 'message') {
      const plugin = chatPlugins.get(videoId);
      if (plugin) {
        plugin.addMessage(data.username, data.content);
        wss.clients.forEach((client) => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
          }
        });
      }
    }
  });
 
  ws.on('close', () => {
    if (videoId && chatPlugins.has(videoId)) {
      const clientCount = Array.from(wss.clients).filter((client) => client.readyState === WebSocket.OPEN).length;
      if (clientCount === 0) {
        chatPlugins.get(videoId)!.dispose();
        chatPlugins.delete(videoId);
      }
    }
  });
});
 
const port = 3000;
server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
 
 
