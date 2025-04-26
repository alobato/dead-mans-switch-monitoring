import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import express from 'express';

const app = express();
const port = process.env.PORT || 8000;
const fsp = fs.promises;

app.use(express.json());

app.post('/status/:uid', async (req, res) => {
  const fileName = req.params.uid;
  const token = req.headers.authorization?.split(' ')[1];

  if (token !== process.env.AUTH_TOKEN) {
    return res.status(401).send('Unauthorized');
  }

  const now = new Date();
  const timestamp = now.toISOString();
  const folderPath = path.join(process.env.DOWNLOADS_PATH);
  const logsFolder = path.join(process.env.DOWNLOADS_PATH, '..', 'logs', timestamp.slice(0,10));

  const content = JSON.stringify({
    timestamp,
    data: req.body,
  });

  try {
    await fsp.mkdir(folderPath, { recursive: true });
    await fsp.mkdir(logsFolder, { recursive: true });

    await fsp.writeFile(path.join(folderPath, `${fileName}.json`), content);
    await fsp.writeFile(path.join(logsFolder, `${fileName}__${timestamp.slice(11,19).replace(/:/g,'-')}.json`), content);

    console.log(`Status recebido de: ${fileName}`);
    return res.status(200).send('Status recebido');
  } catch (error) {
    console.error('Erro ao salvar status:', error);
    return res.status(500).send('Erro interno');
  }
});

app.listen(port, () => console.log(`Servidor escutando na porta ${port}`));
