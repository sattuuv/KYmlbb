import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICounter extends Document {
  heroId: number;
  heroName: string;
  counters: Array<{
    againstHeroId: number;
    againstHeroName: string;
    score: number;
    reason: string;
  }>;
  counteredBy: Array<{
    byHeroId: number;
    byHeroName: string;
    score: number;
    reason: string;
  }>;
  updatedAt: string;
}

const CounterSchema = new Schema<ICounter>({
  heroId: { type: Number, required: true, unique: true, index: true },
  heroName: { type: String, required: true },
  counters: [
    {
      againstHeroId: { type: Number, required: true },
      againstHeroName: { type: String, required: true },
      score: { type: Number, required: true },
      reason: { type: String, default: "" },
    },
  ],
  counteredBy: [
    {
      byHeroId: { type: Number, required: true },
      byHeroName: { type: String, required: true },
      score: { type: Number, required: true },
      reason: { type: String, default: "" },
    },
  ],
  updatedAt: { type: String },
});

export interface CounterModel extends Model<ICounter> {}

const Counter: CounterModel =
  (mongoose.models.Counter as CounterModel) ||
  mongoose.model<ICounter, CounterModel>("Counter", CounterSchema);

export default Counter;