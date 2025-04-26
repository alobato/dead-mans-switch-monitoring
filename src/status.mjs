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
  const content = JSON.stringify({
    timestamp: new Date().toISOString(),
    data: req.body,
  });
  const folderPath = path.join(process.env.DOWNLOADS_PATH);

  try {
    await fsp.mkdir(folderPath, { recursive: true });
    await fsp.writeFile(path.join(folderPath, `${fileName}.json`), content);
    console.log(`Status recebido de: ${fileName}`);
    return res.status(200).send('Status recebido');
  } catch (error) {
    console.error('Erro ao salvar status:', error);
    return res.status(500).send('Erro interno');
  }
});

app.listen(port, () => console.log(`Servidor escutando na porta ${port}`));
