import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';

const fsp = fs.promises;
const limitInMs = 5 * 60 * 1000; // 5 minutos sem comunicação

(async () => {
  try {
    const files = await fsp.readdir(process.env.DOWNLOADS_PATH);

    const checks = files
      .filter(file => file.endsWith('.json') && file.startsWith('monitoring__'))
      .map(async (file) => {
        const filePath = path.join(process.env.DOWNLOADS_PATH, file);
        const stats = await fsp.stat(filePath);
        const fileAge = Date.now() - stats.mtime.getTime();
        const serverName = file.replace('.json', '');

        if (fileAge > limitInMs) {
          console.log(`Servidor sem comunicação: ${serverName}`);
          const url = `https://ntfy.sh/${serverName}`;
          await fetch(url, {
            method: 'POST',
            headers: {
              'Title': `Falta de Comunicação: ${serverName}`,
              'Priority': '5',
            },
            body: `O servidor ${serverName} não enviou status nos últimos 5 minutos.`,
          });
        }
      });

    await Promise.all(checks);
    process.exit();
  } catch (error) {
    console.error('Erro na verificação de comunicação:', error);
    process.exit(1);
  }
})();
