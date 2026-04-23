"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lineAuth = void 0;
const app_1 = require("firebase-admin/app");
(0, app_1.initializeApp)();
var auth_1 = require("./handlers/auth");
Object.defineProperty(exports, "lineAuth", { enumerable: true, get: function () { return auth_1.lineAuth; } });
//# sourceMappingURL=index.js.map