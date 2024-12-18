const path = require('path');

module.exports = {
  webpack: (config, { isServer }) => {
    // 예시: 특정 모듈을 alias로 설정
    config.resolve.alias['@components'] = path.join(__dirname, 'components');

    // 서버 전용 설정
    if (isServer) {
      // 서버 전용 Webpack 설정
    }

    // 클라이언트 전용 설정
    if (!isServer) {
      // 클라이언트 전용 Webpack 설정
    }

    return config;
  },
};  