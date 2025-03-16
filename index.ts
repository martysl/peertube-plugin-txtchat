import fs from 'fs';
import path from 'path';
import { PluginContext, registerPlugin } from 'peertube-plugin';

const CHAT_DIR = path.join(__dirname, 'chat_logs');
const CLEANUP_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours

if (!fs.existsSync(CHAT_DIR)) {
  fs.mkdirSync(CHAT_DIR, { recursive: true });
}

function getChatFile(videoId: string) {
  return path.join(CHAT_DIR, `${videoId}.txt`);
}

async function handleChatMessage(videoId: string, username: string, message: string) {
  const logFile = getChatFile(videoId);
  const logMessage = `${new Date().toISOString()} | ${username}: ${message}\n`;
  fs.appendFileSync(logFile, logMessage);
}

async function getChatHistory(videoId: string): Promise<string[]> {
  const logFile = getChatFile(videoId);
  if (!fs.existsSync(logFile)) return [];
  return fs.readFileSync(logFile, 'utf8').split('\n').filter(Boolean);
}

function cleanupOldChats() {
  const now = Date.now();
  fs.readdir(CHAT_DIR, (err, files) => {
    if (err) return;
    files.forEach(file => {
      const filePath = path.join(CHAT_DIR, file);
      fs.stat(filePath, (err, stats) => {
        if (err) return;
        if (now - stats.mtimeMs > CLEANUP_INTERVAL) {
          fs.unlink(filePath, () => {});
        }
      });
    });
  });
}

setInterval(cleanupOldChats, CLEANUP_INTERVAL);

export function register(context: PluginContext) {
  context.expressRouter.post('/chat/:videoId', async (req, res) => {
    const { videoId } = req.params;
    const { username, message } = req.body;
    if (!username || !message) return res.status(400).send('Invalid request');
    await handleChatMessage(videoId, username, message);
    res.sendStatus(200);
  });

  context.expressRouter.get('/chat/:videoId', async (req, res) => {
    const { videoId } = req.params;
    const history = await getChatHistory(videoId);
    res.json(history);
  });

  context.hook('filter:player.video.availableActions', (actions, { video }) => {
    actions.push({
      label: 'Open Chat',
      icon: 'fa-comments',
      action: `window.showChat('${video.id}')`
    });
    return actions;
  });

  context.hook('action:api.video.watch', async ({ video, dom }) => {
    const chatContainer = document.createElement('div');
    chatContainer.id = 'peertube-live-chat';
    chatContainer.style.position = 'absolute';
    chatContainer.style.right = '10px';
    chatContainer.style.top = '10px';
    chatContainer.style.width = '300px';
    chatContainer.style.height = '500px';
    chatContainer.style.overflowY = 'scroll';
    chatContainer.style.backgroundColor = 'white';
    chatContainer.style.border = '1px solid black';
    chatContainer.style.padding = '10px';

    dom.appendChild(chatContainer);

    fetch(`/chat/${video.id}`).then(response => response.json()).then(messages => {
      messages.forEach(msg => {
        const p = document.createElement('p');
        p.textContent = msg;
        chatContainer.appendChild(p);
      });
    });
  });
} 

registerPlugin({ register });
