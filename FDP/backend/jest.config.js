const baseConfig = require('../jest.config.base');

module.exports = {
  ...baseConfig,
  rootDir: './',
  testRegex: '.*\\.spec\\.ts$', // 테스트 파일 패턴
  moduleDirectories: ['node_modules', 'src'],
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1',
  },
};