import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import express from 'express';

const app = express();
const port = process.env.PORT || 8000;
const fsp = fs.promises;

app.use(express.json());

// 🔒 Middleware de autenticação simples
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (token !== process.env.AUTH_TOKEN) {
    return res.status(401).send('Unauthorized');
  }
  next();
};

// 📨 Recebe status dos servidores
app.post('/status/:uid', authenticate, async (req, res) => {
  const fileName = req.params.uid;
  const now = new Date();
  const timestamp = now.toISOString();

  const folderPath = path.join(process.env.DOWNLOADS_PATH);
  const logsFolder = path.join(process.env.LOGS_PATH, timestamp.slice(0, 10));

  const content = JSON.stringify({
    timestamp,
    data: req.body,
  });

  try {
    await fsp.mkdir(folderPath, { recursive: true });
    await fsp.mkdir(logsFolder, { recursive: true });

    await fsp.writeFile(path.join(folderPath, `${fileName}.json`), content);
    await fsp.writeFile(path.join(logsFolder, `${fileName}__${timestamp.slice(11, 19).replace(/:/g, '-')}.json`), content);

    console.log(`Status recebido de: ${fileName}`);
    return res.status(200).send('Status recebido');
  } catch (error) {
    console.error('Erro ao salvar status:', error);
    return res.status(500).send('Erro interno');
  }
});

// 📅 Lista todos os dias disponíveis
app.get('/logs', authenticate, async (req, res) => {
  const logsRoot = path.join(process.env.LOGS_PATH);

  try {
    const dates = await fsp.readdir(logsRoot);
    const filteredDates = dates.filter(date => !date.startsWith('.'));
    res.json(filteredDates);
  } catch (err) {
    console.error('Erro lendo pastas de logs:', err);
    res.status(500).send('Erro ao listar datas de logs');
  }
});

// 📄 Lê logs de um servidor em um dia específico
app.get('/logs/:date/:server', authenticate, async (req, res) => {
  const { date, server } = req.params;
  const logsFolder = path.join(process.env.LOGS_PATH, date);

  try {
    const files = await fsp.readdir(logsFolder);
    const serverFiles = files.filter(f => f.startsWith(server));

    const logs = await Promise.all(
      serverFiles.map(async (file) => {
        const content = await fsp.readFile(path.join(logsFolder, file), 'utf-8');
        return JSON.parse(content);
      })
    );

    res.json(logs);
  } catch (err) {
    console.error('Erro lendo logs:', err);
    res.status(500).send('Erro ao ler logs');
  }
});

app.listen(port, () => console.log(`Servidor escutando na porta ${port}`));