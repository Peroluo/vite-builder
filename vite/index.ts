import * as http from 'http';
import * as path from 'path';
import * as fs from 'fs';
import * as connect from 'connect';
import * as esbuild from 'esbuild';
import { init, parse } from 'es-module-lexer';
import MagicString from 'magic-string';
import * as compileSFC from '@vue/compiler-sfc';
import * as compileDom from '@vue/compiler-dom';
const { dependencies } = require('../package.json');

// 依赖缓存目录
const cacheDir = path.join(__dirname, '../.vite');

const middlewares = connect();

const optimizeDeps = async() => {
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  };
  const deps = Object.keys(dependencies);
  const result = await esbuild.build({
    entryPoints: deps,
    bundle: true,
    format: 'esm',
    logLevel: 'error',
    splitting: true,
    sourcemap: true,
    outdir: cacheDir,
    treeShaking: 'ignore-annotations',
    metafile: true,
  }) as any;
  const outputs = Object.keys(result?.metafile?.outputs);
  const data:any = {};
  deps.forEach((dep:any) => {
    data[dep] = `/${ outputs.find((output) => output.endsWith(`${dep}.js`))}`;
  });
  console.log('data', data);
  const dataPath = path.join(cacheDir, '_metadata.json');
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
};

const createServer = async() => {
  await optimizeDeps();
  http.createServer(middlewares).listen(3000, () => {
    console.log('simple-vite-dev-server start at localhost: 3000!');
  });
};

const indexHtmlMiddleware = (req:any, res:any, next:any) => {
  if (req.url === '/') {
    const htmlPath = path.join(__dirname, '../index.html');
    const htmlContent = fs.readFileSync(htmlPath, 'utf-8');
    res.setHeader('Content-Type', 'text/html');
    res.statusCode = 200;
    return res.end(htmlContent);
  }
  next();
};
const importAnalysis = async(code:any) => {
  await init;
  const [imports] = parse(code);
  if (!imports || !imports.length) return code;
  const metaData = require(path.join(cacheDir, '_metadata.json'));
  let transformCode = new MagicString(code);
  imports.forEach((importer:any) => {
    const { n, s, e } = importer;
    const replacePath = metaData[n] || n;
    transformCode = transformCode.overwrite(s, e, replacePath);
  });
  return transformCode.toString();
};

const transformMiddleware = async(req:any, res:any, next:any) => {
  if (req.url.endsWith('.js') || req.url.endsWith('.map')) {
    const jsPath = path.join(__dirname, '../', req.url);
    const code = fs.readFileSync(jsPath, 'utf-8');
    res.setHeader('Content-Type', 'application/javascript');
    res.statusCode = 200;
    const transformCode = req.url.endsWith('.map') ? code : await importAnalysis(code);
    return res.end(transformCode);
  }
  if (req.url.indexOf('.vue') !== -1) {
    const vuePath = path.join(__dirname, '../', req.url);
    const vueContent = fs.readFileSync(vuePath, 'utf-8');
    const vueParseContet = compileSFC.parse(vueContent);
    const scriptContent = vueParseContet.descriptor.script.content;
    const replaceScript = scriptContent.replace('export default ', 'const __script = ');
    const tpl = vueParseContet.descriptor.template.content;
    const tplCode = compileDom.compile(tpl, { mode: 'module' }).code;
    const tplCodeReplace = tplCode.replace('export function render(_ctx, _cache)', '__script.render=(_ctx, _cache)=>');
    const code = `
                ${await importAnalysis(replaceScript)}
                ${tplCodeReplace}
                export default __script;
        `;
    res.setHeader('Content-Type', 'application/javascript');
    res.statusCode = 200;
    return res.end(await importAnalysis(code));
  }
  next();
};

middlewares.use(indexHtmlMiddleware);
middlewares.use(transformMiddleware);

createServer();
