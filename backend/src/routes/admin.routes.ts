import { Router } from 'express';
import * as admin from '../controllers/admin.controller';
import { crudFactory } from '../controllers/crud.factory';
import { authenticate, authorize } from '../middlewares/auth';
import { imageUpload } from '../middlewares/upload';
import { Airport } from '../models/Airport';
import { Bus } from '../models/Bus';
import { Destination } from '../models/Destination';
import { Banner, Coupon, TourRequest } from '../models/Engagement';
import { Flight } from '../models/Flight';
import { Hotel } from '../models/Hotel';
import { Room } from '../models/Room';
import { Tour } from '../models/Tour';
import { VisaCountry } from '../models/Visa';

const router = Router();
router.use(authenticate, authorize('admin'));

router.get('/stats', admin.stats);

/** Registers list/get/create/update/delete routes for a content collection. */
function resource(path: string, handlers: ReturnType<typeof crudFactory>) {
  router.get(`/${path}`, handlers.list);
  router.get(`/${path}/:id`, handlers.get);
  router.post(`/${path}`, handlers.create);
  router.put(`/${path}/:id`, handlers.update);
  router.patch(`/${path}/:id`, handlers.update);
  router.delete(`/${path}/:id`, handlers.remove);
}

resource('destinations', crudFactory(Destination, { name: 'Destination', searchFields: ['name', 'country'], filterFields: ['scope', 'published', 'featured'], slugFrom: 'name', sort: { name: 1 } }));
resource('hotels', crudFactory(Hotel, { name: 'Hotel', searchFields: ['name', 'city', 'area'], filterFields: ['destination', 'published', 'propertyType'], slugFrom: 'name', populate: { path: 'destination', select: 'name slug' } }));
resource('rooms', crudFactory(Room, { name: 'Room', searchFields: ['name'], filterFields: ['hotel', 'active'], populate: { path: 'hotel', select: 'name slug' }, sort: { price: 1 } }));
resource('tours', crudFactory(Tour, { name: 'Tour', searchFields: ['title', 'startLocation'], filterFields: ['destination', 'published', 'scope'], slugFrom: 'title', populate: { path: 'destination', select: 'name slug' } }));
resource('flights', crudFactory(Flight, { name: 'Flight schedule', searchFields: ['flightNumber', 'from', 'to', 'airline.name'], filterFields: ['from', 'to', 'active'], sort: { from: 1, departureTime: 1 } }));
resource('airports', crudFactory(Airport, { name: 'Airport', searchFields: ['code', 'city', 'name'], sort: { city: 1 } }));
resource('buses', crudFactory(Bus, { name: 'Bus', searchFields: ['operator.name', 'from', 'to', 'coachNumber'], filterFields: ['from', 'to', 'active'], sort: { from: 1, departureTime: 1 } }));
resource('visa-countries', crudFactory(VisaCountry, { name: 'Visa service', searchFields: ['country'], filterFields: ['published'], slugFrom: 'country', sort: { country: 1 } }));
resource('coupons', crudFactory(Coupon, { name: 'Coupon', searchFields: ['code', 'title'], filterFields: ['active'] }));
resource('banners', crudFactory(Banner, { name: 'Banner', searchFields: ['title'], filterFields: ['placement', 'active'], sort: { placement: 1, order: 1 } }));
resource('tour-requests', crudFactory(TourRequest, { name: 'Tour request', searchFields: ['name', 'email', 'destination'], filterFields: ['status'] }));

router.get('/users', admin.listUsers);
router.patch('/users/:id', admin.updateUser);
router.delete('/users/:id', admin.deleteUser);

router.get('/bookings', admin.listBookings);
router.patch('/bookings/:id', admin.updateBooking);

router.get('/visa-applications', admin.listVisaApplications);
router.patch('/visa-applications/:id', admin.updateVisaApplication);

router.get('/payments', admin.listPayments);

router.get('/reviews', admin.listReviewsAdmin);
router.patch('/reviews/:id', admin.moderateReview);
router.delete('/reviews/:id', admin.deleteReview);

router.get('/newsletter', admin.listSubscribers);
router.delete('/newsletter/:id', admin.deleteSubscriber);

router.get('/settings', admin.getSiteSettings);
router.put('/settings', admin.updateSiteSettings);

router.post('/uploads', imageUpload.array('images', 10), admin.uploadImages);

export default router;
