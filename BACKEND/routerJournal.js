import express from 'express';
import Journal from './modeles/journal.js';

const router = express.Router();

// GET /journal - filter by date, user, action
import { authentification } from './middelware/authentification.js';

// Only super-admins can access journal
router.get('/', authentification, async (req, res) => {
  try {
    if (req.user?.role !== 'super-admin') {
      return res.status(403).json({ error: 'Accès refusé. Super-admin requis.' });
    }
    const { start, end, userId, nom, prenom, action, collection, documentId } = req.query;
    const filter = {};
    // Fix: Only add timestamp filter if start or end is provided and valid
    if (req.query.start || req.query.end) {
      const timestampFilter = {};
      if (req.query.start && !isNaN(Date.parse(req.query.start))) {
        timestampFilter.$gte = new Date(req.query.start);
      }
      if (req.query.end && !isNaN(Date.parse(req.query.end))) {
        // Set end to end of day if only date is provided
        let endDate = new Date(req.query.end);
        if (req.query.end.length <= 10) {
          endDate.setHours(23, 59, 59, 999);
        }
        timestampFilter.$lte = endDate;
      }
      if (Object.keys(timestampFilter).length > 0) {
        filter.timestamp = timestampFilter;
      }
    }
    if (userId) filter['user.id'] = userId;
    if (nom) filter['user.nom'] = nom;
    if (prenom) filter['user.prenom'] = prenom;
    if (action) filter.action = action;
    if (collection) filter.collection = collection;
    if (documentId) filter.documentId = documentId;
    // Add search filter for user (nom or prenom)
    if (req.query.user) {
      filter.$or = [
        { 'user.nom': { $regex: req.query.user, $options: 'i' } },
        { 'user.prenom': { $regex: req.query.user, $options: 'i' } }
      ];
    }
    const journals = await Journal.find(filter).sort({ timestamp: -1 }).limit(100);
    res.json(journals);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
