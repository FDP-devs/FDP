const path = require('path');

module.exports = {
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.join(__dirname, './'),
      '@components': path.join(__dirname, 'components'),
      '@contexts': path.join(__dirname, 'contexts'),
      '@types': path.join(__dirname, 'types'),
      '@styles': path.join(__dirname, 'styles')
    };
    return config;
  },
};  