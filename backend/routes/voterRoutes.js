const express = require('express');
const router = express.Router();
const voterController = require('../controllers/voterController');
const { authenticate, isOfficer, logAction } = require('../middlewares/authMiddleware');

// All routes require authentication
router.use(authenticate);

// Officer-only routes
router.post('/', isOfficer, logAction('register_voter'), voterController.registerVoter);
router.get('/', isOfficer, voterController.getAllVoters);
router.get('/:voterId', isOfficer, voterController.getVoterById);
router.post('/:voterId/verify-fingerprint', isOfficer, logAction('verify_fingerprint'), voterController.verifyVoterFingerprint);
router.put('/:voterId/status', isOfficer, logAction('update_status'), voterController.updateVoterStatus);

module.exports = router;

