import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { env } from '../config/env';
import * as account from '../controllers/account.controller';
import * as auth from '../controllers/auth.controller';
import * as booking from '../controllers/booking.controller';
import * as catalog from '../controllers/catalog.controller';
import * as content from '../controllers/content.controller';
import * as payment from '../controllers/payment.controller';
import * as transport from '../controllers/transport.controller';
import * as visa from '../controllers/visa.controller';
import { authenticate, optionalAuth } from '../middlewares/auth';
import { documentUpload } from '../middlewares/upload';
import { validateBody } from '../middlewares/validate';
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  notificationPrefsSchema,
  registerSchema,
  resetPasswordSchema,
  travelerSchema,
  updateProfileSchema,
} from '../validators/auth.validator';
import {
  cancelBookingSchema,
  couponValidateSchema,
  quoteBookingSchema,
  createBookingSchema,
  initiatePaymentSchema,
  newsletterSchema,
  refundRequestSchema,
  reviewSchema,
  tourRequestSchema,
} from '../validators/booking.validator';
import adminRoutes from './admin.routes';

const router = Router();

const authLimiter = rateLimit({ windowMs: 15 * 60_000, limit: env.AUTH_RATE_LIMIT, standardHeaders: true, legacyHeaders: false });

/* ───── Auth ───── */
const authRouter = Router();
authRouter.post('/register', authLimiter, validateBody(registerSchema), auth.register);
authRouter.post('/login', authLimiter, validateBody(loginSchema), auth.login);
authRouter.post('/logout', auth.logout);
authRouter.get('/me', authenticate, auth.me);
authRouter.post('/forgot-password', authLimiter, validateBody(forgotPasswordSchema), auth.forgotPassword);
authRouter.post('/reset-password', authLimiter, validateBody(resetPasswordSchema), auth.resetPassword);
authRouter.post('/change-password', authenticate, validateBody(changePasswordSchema), auth.changePassword);
router.use('/auth', authRouter);

/* ───── Current user ───── */
const users = Router();
users.use(authenticate);
users.get('/me/overview', account.overview);
users.patch('/me', validateBody(updateProfileSchema), account.updateProfile);
users.put('/me/notification-preferences', validateBody(notificationPrefsSchema), account.updateNotificationPrefs);
users.get('/me/travelers', account.listTravelers);
users.post('/me/travelers', validateBody(travelerSchema), account.addTraveler);
users.put('/me/travelers/:travelerId', validateBody(travelerSchema), account.updateTraveler);
users.delete('/me/travelers/:travelerId', account.deleteTraveler);
users.get('/me/wishlist', account.listWishlist);
users.get('/me/wishlist/ids', account.wishlistIds);
users.post('/me/wishlist', account.toggleWishlist);
users.get('/me/notifications', account.listNotifications);
users.patch('/me/notifications/read-all', account.markAllNotificationsRead);
users.patch('/me/notifications/:id/read', account.markNotificationRead);
users.get('/me/payments', account.myPayments);
router.use('/users', users);

/* ───── Catalog ───── */
router.get('/destinations', catalog.listDestinations);
router.get('/destinations/:slug', catalog.resolveDestination);
router.get('/search/suggestions', catalog.searchSuggestions);
router.get('/hotels', catalog.listHotels);
router.get('/hotels/:slug', catalog.getHotel);
router.get('/tours', catalog.listTours);
router.get('/tours/:slug', catalog.getTour);
router.post('/tours/requests', optionalAuth, validateBody(tourRequestSchema), content.createTourRequest);

/* ───── Flights & buses ───── */
router.get('/flights/airports', transport.searchAirports);
router.post('/flights/search', validateBody(transport.flightSearchSchema), transport.searchFlights);
router.get('/flights/offers/:offerId', transport.getFlightOffer);
router.get('/buses/cities', transport.busCities);
router.get('/buses/search', transport.searchBuses);
router.get('/buses/:id/seats', transport.busSeats);

/* ───── Visa ───── */
router.get('/visa/countries', visa.listCountries);
router.get('/visa/countries/:slug', visa.getCountry);
router.get('/visa/track', visa.track);
router.post('/visa/applications', authenticate, documentUpload.array('documents', 8), visa.apply);
router.get('/visa/applications', authenticate, visa.myApplications);
router.get('/visa/applications/:id', authenticate, visa.getApplication);
router.get('/visa/applications/:id/documents/:docId', authenticate, visa.downloadDocument);

/* ───── Bookings ───── */
router.post('/bookings/quote', validateBody(quoteBookingSchema), booking.quote);
router.post('/bookings', authenticate, validateBody(createBookingSchema), booking.create);
router.get('/bookings', authenticate, booking.listMine);
router.get('/bookings/:id', authenticate, booking.getOne);
router.post('/bookings/:id/cancel', authenticate, validateBody(cancelBookingSchema), booking.requestCancellation);
router.post('/bookings/:id/refund', authenticate, validateBody(refundRequestSchema), booking.requestRefund);
router.post('/coupons/validate', validateBody(couponValidateSchema), booking.validateCoupon);

/* ───── Payments ───── */
router.get('/payments/methods', payment.methods);
router.post('/payments/initiate', authenticate, validateBody(initiatePaymentSchema), payment.initiate);
router.get('/payments/callback/:provider', payment.callback);
router.post('/payments/callback/:provider', payment.callback);
router.get('/payments/demo-gateway/:transactionId', authenticate, payment.demoGatewayInfo);
router.post('/payments/demo-gateway/:transactionId/decide', authenticate, payment.demoGatewayDecide);
router.get('/payments/:transactionId', authenticate, payment.status);

/* ───── Reviews & content ───── */
router.get('/reviews', content.listReviews);
router.post('/reviews', authenticate, validateBody(reviewSchema), content.createReview);
router.get('/content/home', content.homeContent);
router.get('/content/settings', content.publicSettings);
router.post('/newsletter', validateBody(newsletterSchema), content.subscribe);

/* ───── Admin ───── */
router.use('/admin', adminRoutes);

export default router;
