// utils/encrypt.js
const argon2 = require('argon2');

// Password hashing using Argon2
const hashPassword = async (password) => {
  try {
    return await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 16384,
      timeCost: 3,
      parallelism: 2
    });
  } catch (err) {
    console.error('Error hashing password:', err);
    throw new Error('Password encryption failed');
  }
};

// Password verification using Argon2
const verifyPassword = async (hashedPassword, plainPassword) => {
  try {
    return await argon2.verify(hashedPassword, plainPassword);
  } catch (err) {
    console.error('Error verifying password:', err);
    throw new Error('Password verification failed');
  }
};

module.exports = {
  hashPassword,
  verifyPassword
};

