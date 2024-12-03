// frontend/jest.config.js
const baseConfig = require('../jest.config.base');

module.exports = {
  ...baseConfig,
  testEnvironment: 'jsdom', // 브라우저 환경을 위한 설정
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'], // 테스트 환경 설정 파일
};