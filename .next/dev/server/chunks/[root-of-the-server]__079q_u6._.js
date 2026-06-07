module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[project]/src/lib/db/mongodb.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "connectToDatabase",
    ()=>connectToDatabase
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongoose$29$__ = __turbopack_context__.i("[externals]/mongoose [external] (mongoose, cjs, [project]/node_modules/mongoose)");
;
const MONGODB_URI = process.env.MONGODB_URI || "";
let cached = /*TURBOPACK member replacement*/ __turbopack_context__.g.mongooseCache || {
    conn: null,
    promise: null
};
if (!/*TURBOPACK member replacement*/ __turbopack_context__.g.mongooseCache) {
    /*TURBOPACK member replacement*/ __turbopack_context__.g.mongooseCache = cached;
}
async function connectToDatabase() {
    // Don't throw at import time - throw only when actually called and no URI
    if (!MONGODB_URI) {
        throw new Error("Please define the MONGODB_URI environment variable");
    }
    if (cached.conn) {
        return cached.conn;
    }
    if (!cached.promise) {
        const opts = {
            bufferCommands: false,
            maxPoolSize: 5,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000
        };
        cached.promise = __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongoose$29$__["default"].connect(MONGODB_URI, opts).then((mongoose)=>{
            return mongoose;
        });
    }
    try {
        cached.conn = await cached.promise;
    } catch (e) {
        cached.promise = null;
        throw e;
    }
    return cached.conn;
}
}),
"[project]/src/lib/models/Hero.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongoose$29$__ = __turbopack_context__.i("[externals]/mongoose [external] (mongoose, cjs, [project]/node_modules/mongoose)");
;
const HeroSchema = new __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongoose$29$__["Schema"]({
    heroId: {
        type: Number,
        required: true,
        unique: true,
        index: true
    },
    name: {
        type: String,
        required: true,
        index: true
    },
    title: {
        type: String,
        default: ""
    },
    role: {
        type: String,
        enum: [
            "Tank",
            "Fighter",
            "Assassin",
            "Mage",
            "Marksman",
            "Support"
        ],
        required: true,
        index: true
    },
    damageType: {
        type: String,
        enum: [
            "physical",
            "magic",
            "mixed"
        ],
        required: true
    },
    playStyle: {
        type: String,
        enum: [
            "burst",
            "sustain",
            "poke"
        ],
        required: true
    },
    mobility: {
        type: String,
        enum: [
            "low",
            "medium",
            "high"
        ],
        required: true
    },
    crowdControl: {
        type: String,
        enum: [
            "none",
            "soft",
            "hard"
        ],
        required: true
    },
    range: {
        type: String,
        enum: [
            "melee",
            "ranged"
        ],
        required: true
    },
    survivability: {
        type: String,
        enum: [
            "low",
            "medium",
            "high"
        ],
        required: true
    },
    powerSpike: {
        type: String,
        enum: [
            "early",
            "mid",
            "late"
        ],
        required: true
    },
    tags: [
        {
            type: String
        }
    ],
    imageUrl: {
        type: String,
        default: ""
    },
    stats: {
        hp: {
            type: Number,
            default: 2500
        },
        physicalAttack: {
            type: Number,
            default: 0
        },
        magicPower: {
            type: Number,
            default: 0
        },
        physicalDef: {
            type: Number,
            default: 0
        },
        magicDef: {
            type: Number,
            default: 0
        }
    },
    skills: [
        {
            name: {
                type: String
            },
            description: {
                type: String
            },
            type: {
                type: String
            }
        }
    ],
    updatedAt: {
        type: String
    }
});
HeroSchema.index({
    name: 1
}, {
    collation: {
        locale: "en",
        strength: 2
    }
});
const Hero = __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongoose$29$__["default"].models.Hero || __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongoose$29$__["default"].model("Hero", HeroSchema);
const __TURBOPACK__default__export__ = Hero;
}),
"[project]/src/lib/models/Item.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongoose$29$__ = __turbopack_context__.i("[externals]/mongoose [external] (mongoose, cjs, [project]/node_modules/mongoose)");
;
const ItemSchema = new __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongoose$29$__["Schema"]({
    itemId: {
        type: Number,
        required: true,
        unique: true,
        index: true
    },
    name: {
        type: String,
        required: true,
        index: true
    },
    type: {
        type: String,
        enum: [
            "defense",
            "attack",
            "magic",
            "boots",
            "equipment"
        ],
        required: true
    },
    cost: {
        type: Number,
        default: 0
    },
    stats: {
        physicalDef: {
            type: Number,
            default: 0
        },
        magicDef: {
            type: Number,
            default: 0
        },
        hp: {
            type: Number,
            default: 0
        },
        regen: {
            type: Number,
            default: 0
        }
    },
    passive: {
        type: String,
        default: ""
    },
    tags: [
        {
            type: String
        }
    ],
    imageUrl: {
        type: String,
        default: ""
    },
    counters: [
        {
            type: String
        }
    ],
    updatedAt: {
        type: String
    }
});
ItemSchema.index({
    name: 1
}, {
    collation: {
        locale: "en",
        strength: 2
    }
});
const Item = __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongoose$29$__["default"].models.Item || __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$mongoose$29$__["default"].model("Item", ItemSchema);
const __TURBOPACK__default__export__ = Item;
}),
"[externals]/fs [external] (fs, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("fs", () => require("fs"));

module.exports = mod;
}),
"[externals]/path [external] (path, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("path", () => require("path"));

module.exports = mod;
}),
"[externals]/os [external] (os, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("os", () => require("os"));

module.exports = mod;
}),
"[externals]/crypto [external] (crypto, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("crypto", () => require("crypto"));

module.exports = mod;
}),
"[project]/src/lib/seed/seedDatabase.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "seedDatabase",
    ()=>seedDatabase
]);
/**
 * MLBB Counter Pro - Database Seeder
 * ------------------------------------
 * Seeds the MongoDB database with hero and item data.
 * Can be run as a script or triggered via API.
 *
 * Usage (via API): POST /api/seed
 * Usage (script): npx ts-node --compiler-options '{"module":"commonjs"}' src/lib/seed/seedDatabase.ts
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2f$mongodb$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/db/mongodb.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$models$2f$Hero$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/models/Hero.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$models$2f$Item$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/models/Item.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$fs__$5b$external$5d$__$28$fs$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/fs [external] (fs, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/path [external] (path, cjs)");
;
;
;
;
;
async function seedDatabase() {
    console.log("🌱 Seeding database...");
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2f$mongodb$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["connectToDatabase"])();
    // Load data from generated JSON files
    const dataDir = __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["default"].join(process.cwd(), 'src', 'data');
    const heroesFile = __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["default"].join(dataDir, 'heroes.json');
    const itemsFile = __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["default"].join(dataDir, 'items.json');
    let heroesData = [];
    let itemsData = [];
    try {
        if (__TURBOPACK__imported__module__$5b$externals$5d2f$fs__$5b$external$5d$__$28$fs$2c$__cjs$29$__["default"].existsSync(heroesFile)) {
            heroesData = JSON.parse(__TURBOPACK__imported__module__$5b$externals$5d2f$fs__$5b$external$5d$__$28$fs$2c$__cjs$29$__["default"].readFileSync(heroesFile, 'utf8'));
        }
        if (__TURBOPACK__imported__module__$5b$externals$5d2f$fs__$5b$external$5d$__$28$fs$2c$__cjs$29$__["default"].existsSync(itemsFile)) {
            itemsData = JSON.parse(__TURBOPACK__imported__module__$5b$externals$5d2f$fs__$5b$external$5d$__$28$fs$2c$__cjs$29$__["default"].readFileSync(itemsFile, 'utf8'));
        }
    } catch (err) {
        console.error("❌ Failed to read data files. Did you run the scraper?", err);
    }
    // Clear old data to prevent duplicate key issues with changing IDs
    await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$models$2f$Hero$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].deleteMany({});
    await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$models$2f$Item$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].deleteMany({});
    // Seed heroes using bulkWrite (upsert)
    if (heroesData.length > 0) {
        const heroOps = heroesData.map((hero)=>({
                updateOne: {
                    filter: {
                        name: hero.name
                    },
                    update: {
                        $set: hero
                    },
                    upsert: true
                }
            }));
        const heroResult = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$models$2f$Hero$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].bulkWrite(heroOps);
        console.log(`✅ Upserted ${heroResult.upsertedCount} new heroes, modified ${heroResult.modifiedCount} existing heroes (total ${heroesData.length})`);
    } else {
        console.log(`⏭️ No hero data found to seed. Skipping...`);
    }
    // Seed items using bulkWrite (upsert)
    if (itemsData.length > 0) {
        const itemOps = itemsData.map((item)=>({
                updateOne: {
                    filter: {
                        name: item.name
                    },
                    update: {
                        $set: item
                    },
                    upsert: true
                }
            }));
        const itemResult = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$models$2f$Item$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].bulkWrite(itemOps);
        console.log(`✅ Upserted ${itemResult.upsertedCount} new items, modified ${itemResult.modifiedCount} existing items (total ${itemsData.length})`);
    } else {
        console.log(`⏭️ No item data found to seed. Skipping...`);
    }
    console.log("🌱 Database seeding complete!");
    return {
        seededHeroes: heroesData.length,
        seededItems: itemsData.length
    };
}
// Run directly if called as script
if (/*TURBOPACK member replacement*/ __turbopack_context__.z.main === module) {
    __turbopack_context__.r("[project]/node_modules/dotenv/lib/main.js [app-route] (ecmascript)").config({
        path: '.env.local'
    });
    seedDatabase().then((result)=>{
        console.log("Seed result:", result);
        process.exit(0);
    }).catch((err)=>{
        console.error("Seed failed:", err);
        process.exit(1);
    });
}
}),
"[project]/src/app/api/seed/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET,
    "POST",
    ()=>POST
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$seed$2f$seedDatabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/seed/seedDatabase.ts [app-route] (ecmascript)");
;
;
async function POST(request) {
    const apiKey = request.headers.get("x-api-key");
    const expectedKey = process.env.SEED_API_KEY;
    if (expectedKey && apiKey !== expectedKey) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: false,
            error: "Unauthorized: invalid API key"
        }, {
            status: 401
        });
    }
    try {
        const result = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$seed$2f$seedDatabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["seedDatabase"])();
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: true,
            message: "Database seeded successfully",
            data: result
        });
    } catch (error) {
        console.error("Seed API error:", error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: false,
            error: error.message || "Failed to seed database"
        }, {
            status: 500
        });
    }
}
async function GET() {
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
        message: "MLBB Counter Pro - Seed API",
        usage: {
            method: "POST",
            headers: {
                "x-api-key": "<SEED_API_KEY>"
            }
        }
    });
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__079q_u6._.js.map