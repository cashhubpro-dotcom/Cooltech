import { Notification } from '../models/extendedModels.js';
import User from '../models/User.js';
import Technician from '../models/Technician.js';

const insertMany = async (userIds, payload) => {
  const ids = [...new Set(userIds.filter(Boolean).map(String))];
  if (!ids.length) return;
  await Notification.insertMany(ids.map(userId => ({ userId, ...payload })));
};

export const notifyAdmins = async (payload) => {
  const admins = await User.find({ role: 'admin', isActive: true }).select('_id');
  await insertMany(admins.map(a => a._id), payload);
};

// technicianId = Technician._id -> resolve to its linked User account
export const notifyTechnician = async (technicianId, payload) => {
  if (!technicianId) return;
  const tech = await Technician.findById(technicianId).select('user');
  if (tech?.user) await insertMany([tech.user], payload);
};

// customerId = Customer._id -> resolve to the client User linked to it
export const notifyClient = async (customerId, payload) => {
  if (!customerId) return;
  const client = await User.findOne({ role: 'client', customer: customerId }).select('_id');
  if (client) await insertMany([client._id], payload);
};