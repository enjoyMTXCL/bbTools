import { createHash } from 'node:crypto'
import { DS_SALT } from './config'

function randomString(length: number) {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;
  let result = "";

  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return result;
}

function getQueryParam(data: Record<string, unknown> | undefined) {
  let arr: string[] = [];

  if (undefined === data) {
    return "";
  }

  for (const key of Object.keys(data)) {
    arr.push(`${key}=${data[key]}`);
  }

  return arr.join("&");
}

function getDS(query?: Record<string, unknown>, body = "") {
  const i = (Date.now() / 1000) | 0;
  const r = randomString(6);
  const q = getQueryParam(query);
  const c = createHash('md5')
    .update(`salt=${DS_SALT}&t=${i}&r=${r}&b=${body}&q=${q}`)
    .digest('hex');
  return `${i},${r},${c}`;
}

export default getDS;
