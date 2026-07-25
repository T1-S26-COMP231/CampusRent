import fs from 'node:fs';
import path from 'node:path';
import { Router } from 'express';
import { isValidObjectId, QueryFilter, Types } from 'mongoose';
import multer from 'multer';
import { authenticate, requireVerifiedStudent } from '../middleware/auth';
import {
  Listing,
  ListingDocument,
  ListingModel,
} from '../models/Listing';
import { RentalRequestModel } from '../models/RentalRequest';
import { UserModel } from '../models/User';
import { asyncHandler } from '../utils/asyncHandler';
import {
  isValidCategory,
  LISTING_CATEGORIES,
} from '../utils/validation';

const router = Router();
const uploadsDirectory = path.join(process.cwd(), 'uploads');
fs.mkdirSync(uploadsDirectory, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadsDirectory,
    filename: (_req, file, callback) => {
      const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
      callback(null, `${Date.now()}-${safeName}`);
    },
  }),
  limits: { files: 5, fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    callback(null, file.mimetype.startsWith('image/'));
  },
});

async function formatListing(listing: ListingDocument) {
  const owner = await UserModel.findById(listing.owner_id).select(
    'first_name last_name',
  );

  return {
    id: listing._id.toString(),
    owner_id: listing.owner_id.toString(),
    title: listing.title,
    category: listing.category,
    description: listing.description,
    rental_terms: listing.rental_terms,
    availability: listing.availability,
    images: listing.images,
    created_at: listing.created_at.toISOString(),
    updated_at: listing.updated_at.toISOString(),
    owner: owner
      ? {
          id: owner._id.toString(),
          first_name: owner.first_name,
          last_name: owner.last_name,
        }
      : null,
  };
}

function uploadedNames(req: Express.Request): string[] {
  return ((req.files as Express.Multer.File[] | undefined) ?? []).map(
    (file) => file.filename,
  );
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

router.get('/categories', (_req, res) => {
  res.json({ categories: LISTING_CATEGORIES });
});

router.post(
  '/',
  authenticate,
  requireVerifiedStudent,
  upload.array('images', 5),
  asyncHandler(async (req, res) => {
    const { title, category, description, rental_terms = '' } = req.body as {
      title?: string;
      category?: string;
      description?: string;
      rental_terms?: string;
    };

    if (!title || !category || !description) {
      return res.status(400).json({
        error: 'Title, category, and description are required',
      });
    }
    if (!isValidCategory(category)) {
      return res.status(400).json({ error: 'Choose a valid listing category' });
    }

    const listing = await ListingModel.create({
      owner_id: new Types.ObjectId(req.user!.id),
      title: title.trim(),
      category,
      description: description.trim(),
      rental_terms: rental_terms.trim(),
      availability: 'available',
      images: uploadedNames(req),
    });

    res.status(201).json({
      message: 'Listing created.',
      listing: await formatListing(listing),
    });
  }),
);

router.get(
  '/mine',
  authenticate,
  requireVerifiedStudent,
  asyncHandler(async (req, res) => {
    const listings = await ListingModel.find({
      owner_id: req.user!.id,
    }).sort({ created_at: -1 });

    res.json({
      listings: await Promise.all(listings.map(formatListing)),
    });
  }),
);

router.put(
  '/:id',
  authenticate,
  requireVerifiedStudent,
  upload.array('images', 5),
  asyncHandler(async (req, res) => {
    if (!isValidObjectId(req.params.id)) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    const listing = await ListingModel.findOne({
      _id: req.params.id,
      owner_id: req.user!.id,
    });
    if (!listing) return res.status(404).json({ error: 'Listing not found' });

    const { title, category, description, rental_terms } = req.body as {
      title?: string;
      category?: string;
      description?: string;
      rental_terms?: string;
    };
    if (category && !isValidCategory(category)) {
      return res.status(400).json({ error: 'Choose a valid listing category' });
    }

    if (title !== undefined) listing.title = title.trim();
    if (category !== undefined) listing.category = category;
    if (description !== undefined) listing.description = description.trim();
    if (rental_terms !== undefined) listing.rental_terms = rental_terms.trim();

    const newImages = uploadedNames(req);
    if (newImages.length) listing.images.push(...newImages);
    await listing.save();

    res.json({
      message: 'Listing updated.',
      listing: await formatListing(listing),
    });
  }),
);

router.delete(
  '/:id',
  authenticate,
  requireVerifiedStudent,
  asyncHandler(async (req, res) => {
    if (!isValidObjectId(req.params.id)) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    const listing = await ListingModel.findOneAndDelete({
      _id: req.params.id,
      owner_id: req.user!.id,
    });
    if (!listing) return res.status(404).json({ error: 'Listing not found' });

    await RentalRequestModel.deleteMany({ listing_id: listing._id });
    res.json({ message: 'Listing removed.' });
  }),
);

router.patch(
  '/:id/availability',
  authenticate,
  requireVerifiedStudent,
  asyncHandler(async (req, res) => {
    if (!isValidObjectId(req.params.id)) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    const availability = req.body.availability as
      | Listing['availability']
      | undefined;
    if (!availability || !['available', 'unavailable'].includes(availability)) {
      return res.status(400).json({
        error: 'Availability must be available or unavailable',
      });
    }

    const listing = await ListingModel.findOne({
      _id: req.params.id,
      owner_id: req.user!.id,
    });
    if (!listing) return res.status(404).json({ error: 'Listing not found' });

    listing.availability = availability;
    await listing.save();
    res.json({
      message: 'Availability updated.',
      listing: await formatListing(listing),
    });
  }),
);

router.get(
  '/',
  authenticate,
  requireVerifiedStudent,
  asyncHandler(async (req, res) => {
    const filter: QueryFilter<Listing> = { availability: 'available' };
    const search = String(req.query.search ?? '').trim();
    const category = String(req.query.category ?? '').trim();

    if (search) {
      const expression = new RegExp(escapeRegExp(search), 'i');
      filter.$or = [{ title: expression }, { description: expression }];
    }
    if (category) filter.category = category;

    const listings = await ListingModel.find(filter).sort({ created_at: -1 });
    res.json({
      listings: await Promise.all(listings.map(formatListing)),
    });
  }),
);

router.get(
  '/:id',
  authenticate,
  requireVerifiedStudent,
  asyncHandler(async (req, res) => {
    if (!isValidObjectId(req.params.id)) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    const listing = await ListingModel.findById(req.params.id);
    if (!listing) return res.status(404).json({ error: 'Listing not found' });
    res.json({ listing: await formatListing(listing) });
  }),
);

export default router;
