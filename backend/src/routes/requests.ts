import { Router } from 'express';
import { isValidObjectId } from 'mongoose';
import { authenticate, requireVerifiedStudent } from '../middleware/auth';
import { ListingModel } from '../models/Listing';
import {
  RentalRequestDocument,
  RentalRequestModel,
} from '../models/RentalRequest';
import { UserModel } from '../models/User';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

function dateOnly(value: Date): string {
  return value.toISOString().slice(0, 10);
}

async function enrichRequest(request: RentalRequestDocument) {
  const [listing, renter] = await Promise.all([
    ListingModel.findById(request.listing_id).select('title owner_id'),
    UserModel.findById(request.renter_id).select('first_name last_name'),
  ]);

  return {
    id: request._id.toString(),
    listing_id: request.listing_id.toString(),
    renter_id: request.renter_id.toString(),
    start_date: dateOnly(request.start_date),
    end_date: dateOnly(request.end_date),
    message: request.message,
    status: request.status,
    created_at: request.created_at.toISOString(),
    updated_at: request.updated_at.toISOString(),
    listing: listing
      ? {
          id: listing._id.toString(),
          title: listing.title,
          owner_id: listing.owner_id.toString(),
        }
      : null,
    renter: renter
      ? {
          id: renter._id.toString(),
          first_name: renter.first_name,
          last_name: renter.last_name,
        }
      : null,
  };
}

router.post(
  '/',
  authenticate,
  requireVerifiedStudent,
  asyncHandler(async (req, res) => {
    const { listing_id, start_date, end_date, message = '' } = req.body as {
      listing_id?: string;
      start_date?: string;
      end_date?: string;
      message?: string;
    };
    if (!listing_id || !start_date || !end_date) {
      return res.status(400).json({
        error: 'Listing, start date, and end date are required',
      });
    }
    if (!isValidObjectId(listing_id)) {
      return res.status(404).json({ error: 'Available listing not found' });
    }

    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    if (
      Number.isNaN(startDate.getTime()) ||
      Number.isNaN(endDate.getTime())
    ) {
      return res.status(400).json({ error: 'Enter valid rental dates' });
    }
    if (startDate > endDate) {
      return res.status(400).json({
        error: 'End date must be on or after the start date',
      });
    }

    const listing = await ListingModel.findOne({
      _id: listing_id,
      availability: 'available',
    });
    if (!listing) {
      return res.status(404).json({ error: 'Available listing not found' });
    }
    if (listing.owner_id.toString() === req.user!.id) {
      return res.status(400).json({ error: 'You cannot rent your own listing' });
    }

    const duplicate = await RentalRequestModel.exists({
      listing_id: listing._id,
      renter_id: req.user!.id,
      status: 'pending',
    });
    if (duplicate) {
      return res.status(409).json({
        error: 'You already have a pending request for this item',
      });
    }

    const rentalRequest = await RentalRequestModel.create({
      listing_id: listing._id,
      renter_id: req.user!.id,
      start_date: startDate,
      end_date: endDate,
      message: message.trim(),
      status: 'pending',
    });

    res.status(201).json({
      message: 'Rental request submitted.',
      request: await enrichRequest(rentalRequest),
    });
  }),
);

router.get(
  '/incoming',
  authenticate,
  requireVerifiedStudent,
  asyncHandler(async (req, res) => {
    const ownedListings = await ListingModel.find({
      owner_id: req.user!.id,
    }).select('_id');
    const ownedIds = ownedListings.map((listing) => listing._id);

    const requests = ownedIds.length
      ? await RentalRequestModel.find({
          listing_id: { $in: ownedIds },
        }).sort({ created_at: -1 })
      : [];

    res.json({
      requests: await Promise.all(requests.map(enrichRequest)),
    });
  }),
);

router.patch(
  '/:id/approve',
  authenticate,
  requireVerifiedStudent,
  asyncHandler(async (req, res) => {
    if (!isValidObjectId(req.params.id)) {
      return res.status(404).json({ error: 'Rental request not found' });
    }

    const rentalRequest = await RentalRequestModel.findById(req.params.id);
    if (!rentalRequest) {
      return res.status(404).json({ error: 'Rental request not found' });
    }

    const listing = await ListingModel.findById(rentalRequest.listing_id);
    if (!listing || listing.owner_id.toString() !== req.user!.id) {
      return res.status(403).json({
        error: 'Only the listing owner can approve this request',
      });
    }
    if (rentalRequest.status !== 'pending') {
      return res.status(409).json({
        error: 'Only pending requests can be approved',
      });
    }

    rentalRequest.status = 'approved';
    listing.availability = 'unavailable';
    await rentalRequest.save();
    await listing.save();

    res.json({
      message: 'Rental request approved.',
      request: await enrichRequest(rentalRequest),
    });
  }),
);

export default router;
