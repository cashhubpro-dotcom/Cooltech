import express from 'express';
import {
  getEvents, getAllEvents, createEvent,
  updateEvent, deleteEvent, getStats,
} from '../controllers/calendarController.js';

const router = express.Router();

router.get('/stats',  getStats);
router.get('/all',    getAllEvents);
router.get('/',       getEvents);
router.post('/',      createEvent);
router.put('/:id',    updateEvent);
router.delete('/:id', deleteEvent);

export default router;