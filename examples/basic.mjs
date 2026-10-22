import { TjkClient } from '../dist/index.js';

const client = new TjkClient({ authKey: process.env.TJK_AUTH_KEY });
const { data, updateTime } = await client.getProgram({ date: new Date() });
console.log({ updateTime, raceCount: data.length, data });
