const DEFAULT_API_URL = 'https://collabcode-gateway.onrender.com';
const DEFAULT_COLLAB_URL = 'https://collabcode-collaboration.onrender.com';

function toWebsocketUrl(url: string): string {
  if (url.startsWith('https://')) {
    return url.replace('https://', 'wss://');
  }

  if (url.startsWith('http://')) {
    return url.replace('http://', 'ws://');
  }

  return url;
}

export const env = {
  apiUrl: import.meta.env.VITE_API_URL ?? import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_URL,
  collaborationWsUrl: toWebsocketUrl(import.meta.env.VITE_COLLAB_WS_URL ?? DEFAULT_COLLAB_URL)
};
