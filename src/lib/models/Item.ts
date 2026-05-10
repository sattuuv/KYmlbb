import mongoose, { Schema, Model } from "mongoose";

export interface IItem {
  itemId: number;
  name: string;
  type: string;
  cost: number;
  stats: {
    physicalDef: number;
    magicDef: number;
    hp: number;
    regen: number;
  };
  passive: string;
  tags: string[];
  imageUrl: string;
  counters: string[];
  updatedAt: string;
}

const ItemSchema = new Schema<IItem>({
  itemId: { type: Number, required: true, unique: true, index: true },
  name: { type: String, required: true, index: true },
  type: {
    type: String,
    enum: ["defense", "attack", "magic", "boots", "equipment"],
    required: true,
  },
  cost: { type: Number, default: 0 },
  stats: {
    physicalDef: { type: Number, default: 0 },
    magicDef: { type: Number, default: 0 },
    hp: { type: Number, default: 0 },
    regen: { type: Number, default: 0 },
  },
  passive: { type: String, default: "" },
  tags: [{ type: String }],
  imageUrl: { type: String, default: "" },
  counters: [{ type: String }],
  updatedAt: { type: String },
});

ItemSchema.index({ name: 1 }, { collation: { locale: "en", strength: 2 } });

const Item: Model<IItem> = mongoose.models.Item as Model<IItem> || mongoose.model<IItem>("Item", ItemSchema);

export default Item;