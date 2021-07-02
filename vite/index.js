"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var http = require("http");
var path = require("path");
var fs = require("fs");
var connect = require("connect");
var esbuild = require("esbuild");
var es_module_lexer_1 = require("es-module-lexer");
var magic_string_1 = require("magic-string");
var compileSFC = require("@vue/compiler-sfc");
var compileDom = require("@vue/compiler-dom");
var dependencies = require('../package.json').dependencies;
// 依赖缓存目录
var cacheDir = path.join(__dirname, '../.vite');
var middlewares = connect();
var optimizeDeps = function () { return __awaiter(void 0, void 0, void 0, function () {
    var deps, result, outputs, data, dataPath;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                if (!fs.existsSync(cacheDir)) {
                    fs.mkdirSync(cacheDir, { recursive: true });
                }
                ;
                deps = Object.keys(dependencies);
                return [4 /*yield*/, esbuild.build({
                        entryPoints: deps,
                        bundle: true,
                        format: 'esm',
                        logLevel: 'error',
                        splitting: true,
                        sourcemap: true,
                        outdir: cacheDir,
                        treeShaking: 'ignore-annotations',
                        metafile: true
                    })];
            case 1:
                result = _b.sent();
                outputs = Object.keys((_a = result === null || result === void 0 ? void 0 : result.metafile) === null || _a === void 0 ? void 0 : _a.outputs);
                data = {};
                deps.forEach(function (dep) {
                    data[dep] = "/" + outputs.find(function (output) { return output.endsWith(dep + ".js"); });
                });
                console.log('data', data);
                dataPath = path.join(cacheDir, '_metadata.json');
                fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
                return [2 /*return*/];
        }
    });
}); };
var createServer = function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, optimizeDeps()];
            case 1:
                _a.sent();
                http.createServer(middlewares).listen(3000, function () {
                    console.log('simple-vite-dev-server start at localhost: 3000!');
                });
                return [2 /*return*/];
        }
    });
}); };
var indexHtmlMiddleware = function (req, res, next) {
    if (req.url === '/') {
        var htmlPath = path.join(__dirname, '../index.html');
        var htmlContent = fs.readFileSync(htmlPath, 'utf-8');
        res.setHeader('Content-Type', 'text/html');
        res.statusCode = 200;
        return res.end(htmlContent);
    }
    next();
};
var importAnalysis = function (code) { return __awaiter(void 0, void 0, void 0, function () {
    var imports, metaData, transformCode;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, es_module_lexer_1.init];
            case 1:
                _a.sent();
                imports = es_module_lexer_1.parse(code)[0];
                if (!imports || !imports.length)
                    return [2 /*return*/, code];
                metaData = require(path.join(cacheDir, '_metadata.json'));
                transformCode = new magic_string_1["default"](code);
                imports.forEach(function (importer) {
                    var n = importer.n, s = importer.s, e = importer.e;
                    var replacePath = metaData[n] || n;
                    transformCode = transformCode.overwrite(s, e, replacePath);
                });
                return [2 /*return*/, transformCode.toString()];
        }
    });
}); };
var transformMiddleware = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var jsPath, code, transformCode, _a, vuePath, vueContent, vueParseContet, scriptContent, replaceScript, tpl, tplCode, tplCodeReplace, code, _b, _c, _d;
    return __generator(this, function (_e) {
        switch (_e.label) {
            case 0:
                if (!(req.url.endsWith('.js') || req.url.endsWith('.map'))) return [3 /*break*/, 4];
                jsPath = path.join(__dirname, '../', req.url);
                code = fs.readFileSync(jsPath, 'utf-8');
                res.setHeader('Content-Type', 'application/javascript');
                res.statusCode = 200;
                if (!req.url.endsWith('.map')) return [3 /*break*/, 1];
                _a = code;
                return [3 /*break*/, 3];
            case 1: return [4 /*yield*/, importAnalysis(code)];
            case 2:
                _a = _e.sent();
                _e.label = 3;
            case 3:
                transformCode = _a;
                return [2 /*return*/, res.end(transformCode)];
            case 4:
                if (!(req.url.indexOf('.vue') !== -1)) return [3 /*break*/, 7];
                vuePath = path.join(__dirname, '../', req.url);
                vueContent = fs.readFileSync(vuePath, 'utf-8');
                vueParseContet = compileSFC.parse(vueContent);
                scriptContent = vueParseContet.descriptor.script.content;
                replaceScript = scriptContent.replace('export default ', 'const __script = ');
                tpl = vueParseContet.descriptor.template.content;
                tplCode = compileDom.compile(tpl, { mode: 'module' }).code;
                tplCodeReplace = tplCode.replace('export function render(_ctx, _cache)', '__script.render=(_ctx, _cache)=>');
                _b = "\n                ";
                return [4 /*yield*/, importAnalysis(replaceScript)];
            case 5:
                code = _b + (_e.sent()) + "\n                " + tplCodeReplace + "\n                export default __script;\n        ";
                res.setHeader('Content-Type', 'application/javascript');
                res.statusCode = 200;
                _d = (_c = res).end;
                return [4 /*yield*/, importAnalysis(code)];
            case 6: return [2 /*return*/, _d.apply(_c, [_e.sent()])];
            case 7:
                next();
                return [2 /*return*/];
        }
    });
}); };
middlewares.use(indexHtmlMiddleware);
middlewares.use(transformMiddleware);
createServer();
