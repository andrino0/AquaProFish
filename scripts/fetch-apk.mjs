import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const apkUrl = 'https://github.com/andrino0/AquaProFish/releases/download/apk-latest/AquaProFish.apk';
const destination = resolve('public/download/AquaProFish.apk');

console.log('Baixando o APK oficial do AquaProFish...');
const response = await fetch(apkUrl, { redirect: 'follow' });

if (!response.ok) {
  throw new Error(`Falha ao baixar o APK: HTTP ${response.status}`);
}

const contentType = response.headers.get('content-type') || '';
if (contentType.includes('text/html')) {
  throw new Error('O endereço retornou uma página HTML em vez do arquivo APK.');
}

const apk = Buffer.from(await response.arrayBuffer());
if (apk.length < 1_000_000) {
  throw new Error(`Arquivo APK inesperadamente pequeno: ${apk.length} bytes`);
}

await mkdir(dirname(destination), { recursive: true });
await writeFile(destination, apk);
console.log(`APK preparado para publicação: ${destination} (${apk.length} bytes)`);
