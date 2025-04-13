// controllers/voterController.js
const voterModel = require('../models/voterModel');
const logModel = require('../models/logModel');
const { compareFingerprints } = require('../utils/fingerprintUtils');

// Register a new voter
const registerVoter = async (req, res, next) => {
  try {
    const { voter_id, name, age, nationality, fingerprint } = req.body;
    
    // Validate input
    if (!voter_id || !name || !age || !nationality || !fingerprint) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    // Check nationality is valid
    if (nationality !== 'indian' && nationality !== 'nri') {
      return res.status(400).json({ message: 'Nationality must be either indian or nri' });
    }
    
    // Register voter
    const newVoter = await voterModel.register({
      voter_id,
      name,
      age,
      nationality,
      fingerprint: Buffer.from(fingerprint)
    });
    
    // Log voter registration
    await logModel.create({
      user_id: req.user.id,
      voter_id: voter_id,
      action_type: 'register_voter',
      message: `Registered new voter: ${name} (${voter_id})`
    });
    
    res.status(201).json({
      message: 'Voter registered successfully',
      voter: newVoter
    });
  } catch (err) {
    // Handle duplicate voter ID
    if (err.code === '23505') {
      return res.status(409).json({ message: 'Voter ID already exists' });
    }
    next(err);
  }
};

// Get voter details by ID
const getVoterById = async (req, res, next) => {
  try {
    const { voterId } = req.params;
    
    // Get voter details
    const voter = await voterModel.findByVoterId(voterId);
    if (!voter) {
      return res.status(404).json({ message: 'Voter not found' });
    }
    
    // Remove sensitive information like fingerprint
    const { fingerprint, ...voterData } = voter;
    
    // Get voter verification history
    const verificationLogs = await logModel.getVoterLogs(voterId);
    
    res.json({
      voter: voterData,
      verificationHistory: verificationLogs
    });
  } catch (err) {
    next(err);
  }
};

// Verify voter's fingerprint
const verifyVoterFingerprint = async (req, res, next) => {
  try {
    const { voterId } = req.params;
    const { fingerprint } = req.body;
    
    if (!fingerprint) {
      return res.status(400).json({ message: 'Fingerprint data is required' });
    }
    
    // Get voter details
    const voter = await voterModel.findByVoterId(voterId);
    if (!voter) {
      return res.status(404).json({ message: 'Voter not found' });
    }
    
    // Compare fingerprints
    const fingerprintBuffer = Buffer.from(fingerprint);
    const isMatch = compareFingerprints(voter.fingerprint, fingerprintBuffer);
    
    res.json({
      verified: isMatch,
      voter: {
        id: voter.id,
        voter_id: voter.voter_id,
        name: voter.name,
        status: voter.status
      }
    });
  } catch (err) {
    next(err);
  }
};

// Update voter verification status
const updateVoterStatus = async (req, res, next) => {
  try {
    const { voterId } = req.params;
    const { status } = req.body;
    
    // Validate status
    if (status !== 'verified' && status !== 'rejected') {
      return res.status(400).json({ message: 'Status must be either verified or rejected' });
    }
    
    // Get current voter for status change tracking
    const currentVoter = await voterModel.findByVoterId(voterId);
    if (!currentVoter) {
      return res.status(404).json({ message: 'Voter not found' });
    }
    
    req.body.currentStatus = currentVoter.status;
    
    // Update status
    const updatedVoter = await voterModel.updateStatus(voterId, status, req.user.id);
    
    res.json({
      message: `Voter ${status === 'verified' ? 'verified' : 'rejected'} successfully`,
      voter: updatedVoter
    });
  } catch (err) {
    next(err);
  }
};

// Get all voters with pagination and filters
const getAllVoters = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, nationality } = req.query;
    
    // Build filters
    const filters = {};
    if (status) filters.status = status;
    if (nationality) filters.nationality = nationality;
    
    // Get voters with pagination
    const result = await voterModel.getVoters(filters, parseInt(page), parseInt(limit));
    
    res.json(result);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  registerVoter,
  getVoterById,
  verifyVoterFingerprint,
  updateVoterStatus,
  getAllVoters
};

