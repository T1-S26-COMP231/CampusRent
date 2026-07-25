import { HydratedDocument, model, Schema, Types } from 'mongoose';

export type RequestStatus =
  | 'pending'
  | 'approved'
  | 'declined'
  | 'cancelled'
  | 'completed';

export interface RentalRequest {
  listing_id: Types.ObjectId;
  renter_id: Types.ObjectId;
  start_date: Date;
  end_date: Date;
  message: string;
  status: RequestStatus;
  created_at: Date;
  updated_at: Date;
}

export type RentalRequestDocument = HydratedDocument<RentalRequest>;

const rentalRequestSchema = new Schema<RentalRequest>(
  {
    listing_id: {
      type: Schema.Types.ObjectId,
      ref: 'Listing',
      required: true,
      index: true,
    },
    renter_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    start_date: { type: Date, required: true },
    end_date: { type: Date, required: true },
    message: { type: String, default: '', trim: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'declined', 'cancelled', 'completed'],
      default: 'pending',
      required: true,
      index: true,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  },
);

rentalRequestSchema.index({ listing_id: 1, renter_id: 1, status: 1 });

export const RentalRequestModel = model<RentalRequest>(
  'RentalRequest',
  rentalRequestSchema,
);
