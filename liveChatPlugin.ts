 
import * as fs from 'fs';
import * as path from 'path';
 
class LiveChatPlugin {
  private chatFile: string;
  private cleanupInterval: NodeJS.Timeout;
 
  constructor(videoId: string) {
    this.chatFile = path.join(__dirname, `chat_${videoId}.txt`);
    this.cleanupInterval = setInterval(() => this.cleanupChatHistory(), 24 * 60 * 60 * 1000);
  }
 
  public addMessage(username: string, message: string): void {
    const timestamp = new Date().toISOString();
    const chatEntry = `${timestamp} - ${username}: ${message}\n`;
 
    fs.appendFileSync(this.chatFile, chatEntry);
  }
 
  public getMessages(): string[] {
    if (!fs.existsSync(this.chatFile)) {
      return [];
    }
 
    const content = fs.readFileSync(this.chatFile, 'utf-8');
    return content.split('\n').filter(line => line.trim() !== '');
  }
 
  private cleanupChatHistory(): void {
    if (fs.existsSync(this.chatFile)) {
      fs.unlinkSync(this.chatFile);
    }
  }
 
  public dispose(): void {
    clearInterval(this.cleanupInterval);
  }
}
 
export default LiveChatPlugin;
 
 
