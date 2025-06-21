/** @type {import('jest').Config} */
export default {
  // 基本配置
  preset: 'ts-jest/presets/default-esm',
  extensionsToTreatAsEsm: ['.ts'],
  testEnvironment: 'node',
  
  // 文件匹配
  testMatch: [
    '<rootDir>/tests/**/*.test.ts',
    '<rootDir>/tests/**/*.spec.ts'
  ],
  
  // 模块解析
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/core/(.*)$': '<rootDir>/src/core/$1',
    '^@/tools/(.*)$': '<rootDir>/src/tools/$1',
    '^@/utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@/types/(.*)$': '<rootDir>/src/types/$1'
  },
  
  // TypeScript 配置
  globals: {
    'ts-jest': {
      useESM: true,
      tsconfig: {
        module: 'ESNext',
        target: 'ES2022'
      }
    }
  },
  
  // 覆盖率配置
  collectCoverage: false,
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: [
    'text',
    'lcov',
    'html'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  
  // 测试设置
  setupFilesAfterEnv: [
    '<rootDir>/tests/setup.ts'
  ],
  
  // 超时配置
  testTimeout: 30000,
  
  // 输出配置
  verbose: true,
  
  // 忽略模式
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/dist/'
  ],
  
  // 转换配置
  transform: {
    '^.+\.ts$': ['ts-jest', {
      useESM: true
    }]
  }
};