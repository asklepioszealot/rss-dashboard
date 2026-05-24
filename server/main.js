// Standalone runner — `npm run dev` veya `npm start` ile çalışır.
// Electron entegrasyonu için server/index.js'ten startServer'ı kullanın.
import { startServer } from './index.js';

const PORT = process.env.PORT || 3001;
startServer(PORT);
