import { HydratedDocument, model, Schema, Types } from 'mongoose';

export type ListingAvailability = 'available' | 'unavailable';

export interface Listing {
  owner_id: Types.ObjectId;
  title: string;
  category: string;
  description: string;
  rental_terms: string;
  availability: ListingAvailability;
  images: string[];
  created_at: Date;
  updated_at: Date;
}

export type ListingDocument = HydratedDocument<Listing>;

const listingSchema = new Schema<Listing>(
  {
    owner_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true, index: true },
    description: { type: String, required: true, trim: true },
    rental_terms: { type: String, default: '', trim: true },
    availability: {
      type: String,
      enum: ['available', 'unavailable'],
      default: 'available',
      required: true,
      index: true,
    },
    images: [{ type: String, trim: true }],
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  },
);

listingSchema.index({ availability: 1, category: 1, created_at: -1 });
listingSchema.index({ title: 'text', description: 'text' });

export const ListingModel = model<Listing>('Listing', listingSchema);
