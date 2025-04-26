import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';

const fsp = fs.promises;

const CPU_LIMIT = Number(process.env.CPU_LIMIT) || 85;
const MEMORY_LIMIT = Number(process.env.MEMORY_LIMIT) || 90;
const DISK_LIMIT = Number(process.env.DISK_LIMIT) || 80;

(async () => {
  try {
    const files = await fsp.readdir(process.env.DOWNLOADS_PATH);

    const checks = files
      .filter(file => file.endsWith('.json') && file.startsWith('monitoring__'))
      .map(async (file) => {
        const filePath = path.join(process.env.DOWNLOADS_PATH, file);
        const content = JSON.parse(await fsp.readFile(filePath, 'utf-8'));
        const { cpu, memory, disk } = content.data;
        const serverName = file.replace('.json', '');

        const alertedFile = path.join(process.env.DOWNLOADS_PATH, `${serverName}.alerted`);
        const alreadyAlerted = await fsp.access(alertedFile).then(() => true).catch(() => false);

        if (cpu > CPU_LIMIT || memory > MEMORY_LIMIT || disk > DISK_LIMIT) {
          if (!alreadyAlerted) {
            const url = `https://ntfy.sh/${serverName}`;
            let reason = [];
            if (cpu > CPU_LIMIT) reason.push(`CPU: ${cpu}%`);
            if (memory > MEMORY_LIMIT) reason.push(`Memória: ${memory}%`);
            if (disk > DISK_LIMIT) reason.push(`Disco: ${disk}%`);

            console.log(`Alerta de recursos para ${serverName}: ${reason.join(', ')}`);
            await fetch(url, {
              method: 'POST',
              headers: {
                'Title': `Alerta de Recursos: ${serverName}`,
                'Priority': '5',
              },
              body: `O servidor ${serverName} excedeu limites: ${reason.join(', ')}.`,
            });

            await fsp.writeFile(alertedFile, new Date().toISOString());
          }
        } else {
          if (alreadyAlerted) {
            const url = `https://ntfy.sh/${serverName}`;
            console.log(`Recuperação de recursos detectada para ${serverName}`);
            await fetch(url, {
              method: 'POST',
              headers: {
                'Title': `Recuperação de Recursos: ${serverName}`,
                'Priority': '3',
              },
              body: `O servidor ${serverName} voltou ao uso normal de recursos.`,
            });

            await fsp.unlink(alertedFile).catch(() => {});
          }
        }
      });

    await Promise.all(checks);
    process.exit();
  } catch (error) {
    console.error('Erro na verificação de status de recursos:', error);
    process.exit(1);
  }
})();
