import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Technician from '../models/Technician.js';

export const protect = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.startsWith('Bearer')
      ? req.headers.authorization.split(' ')[1]
      : null;

    if (!token) return res.status(401).json({ message: 'Not authorised – no token.' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) return res.status(401).json({ message: 'User no longer exists.' });

    next();
  } catch {
    res.status(401).json({ message: 'Token invalid or expired.' });
  }
};

export const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin')
    return res.status(403).json({ message: 'Admin access required.' });
  next();
};

export const clientOnly = (req, res, next) => {
  if (req.user?.role !== 'client')
    return res.status(403).json({ message: 'Client access required.' });
  if (!req.user.customer)
    return res.status(403).json({ message: 'This account is not linked to a customer record.' });
  next();
};

export const technicianOnly = async (req, res, next) => {
  if (req.user?.role !== 'technician')
    return res.status(403).json({ message: 'Technician access required.' });
  const technician = await Technician.findOne({ user: req.user._id, isDeleted: { $ne: true } });
  if (!technician)
    return res.status(403).json({ message: 'This account is not linked to a technician record.' });
 
  req.technician = technician;
  next();
};