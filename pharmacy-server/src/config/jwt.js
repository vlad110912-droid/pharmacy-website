module.exports = {
  JWT_SECRET: process.env.JWT_SECRET || 'pharmacy_dev_secret_change_in_production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '8h',
};
