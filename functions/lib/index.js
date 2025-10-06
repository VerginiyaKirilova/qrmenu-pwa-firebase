"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentWebhook = exports.ordersOnCreate = exports.updateOrderStatus = exports.createOrder = void 0;
const admin = __importStar(require("firebase-admin"));
// Initialize Firebase Admin SDK
admin.initializeApp();
// Import function modules
const createOrder_1 = require("./createOrder");
Object.defineProperty(exports, "createOrder", { enumerable: true, get: function () { return createOrder_1.createOrder; } });
const updateOrderStatus_1 = require("./updateOrderStatus");
Object.defineProperty(exports, "updateOrderStatus", { enumerable: true, get: function () { return updateOrderStatus_1.updateOrderStatus; } });
const ordersOnCreate_1 = require("./ordersOnCreate");
Object.defineProperty(exports, "ordersOnCreate", { enumerable: true, get: function () { return ordersOnCreate_1.ordersOnCreate; } });
const paymentWebhook_1 = require("./paymentWebhook");
Object.defineProperty(exports, "paymentWebhook", { enumerable: true, get: function () { return paymentWebhook_1.paymentWebhook; } });
//# sourceMappingURL=index.js.map