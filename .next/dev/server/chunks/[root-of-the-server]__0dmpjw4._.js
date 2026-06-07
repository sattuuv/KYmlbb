module.exports = [
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
"[externals]/mongoose [external] (mongoose, cjs, [project]/node_modules/mongoose)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("mongoose-8b99e611e7552af3", () => require("mongoose-8b99e611e7552af3"));

module.exports = mod;
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__0dmpjw4._.js.map