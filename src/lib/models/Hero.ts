import mongoose, { Schema, Document, Model } from "mongoose";

export interface IHero {
  heroId: number;
  name: string;
  title: string;
  role: string;
  damageType: "physical" | "magic" | "mixed";
  playStyle: "burst" | "sustain" | "poke";
  mobility: "low" | "medium" | "high";
  crowdControl: "none" | "soft" | "hard";
  range: "melee" | "ranged";
  survivability: "low" | "medium" | "high";
  powerSpike: "early" | "mid" | "late";
  tags: string[];
  imageUrl: string;
  stats: {
    hp: number;
    physicalAttack: number;
    magicPower: number;
    physicalDef: number;
    magicDef: number;
  };
  skills: Array<{
    name: string;
    description: string;
    type: string;
  }>;
  updatedAt: string;
}

const HeroSchema = new Schema<IHero>({
  heroId: { type: Number, required: true, unique: true, index: true },
  name: { type: String, required: true, index: true },
  title: { type: String, default: "" },
  role: {
    type: String,
    enum: ["Tank", "Fighter", "Assassin", "Mage", "Marksman", "Support"],
    required: true,
    index: true,
  },
  damageType: {
    type: String,
    enum: ["physical", "magic", "mixed"],
    required: true,
  },
  playStyle: {
    type: String,
    enum: ["burst", "sustain", "poke"],
    required: true,
  },
  mobility: {
    type: String,
    enum: ["low", "medium", "high"],
    required: true,
  },
  crowdControl: {
    type: String,
    enum: ["none", "soft", "hard"],
    required: true,
  },
  range: {
    type: String,
    enum: ["melee", "ranged"],
    required: true,
  },
  survivability: {
    type: String,
    enum: ["low", "medium", "high"],
    required: true,
  },
  powerSpike: {
    type: String,
    enum: ["early", "mid", "late"],
    required: true,
  },
  tags: [{ type: String }],
  imageUrl: { type: String, default: "" },
  stats: {
    hp: { type: Number, default: 2500 },
    physicalAttack: { type: Number, default: 0 },
    magicPower: { type: Number, default: 0 },
    physicalDef: { type: Number, default: 0 },
    magicDef: { type: Number, default: 0 },
  },
  skills: [
    {
      name: { type: String },
      description: { type: String },
      type: { type: String },
    },
  ],
  updatedAt: { type: String },
});

HeroSchema.index({ name: 1 }, { collation: { locale: "en", strength: 2 } });

const Hero: Model<IHero> = mongoose.models.Hero as Model<IHero> || mongoose.model<IHero>("Hero", HeroSchema);

export default Hero;