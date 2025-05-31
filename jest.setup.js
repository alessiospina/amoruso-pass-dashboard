// Optional: configure or set up a testing framework before each test.
// If you delete this file, remove `setupFilesAfterEnv` from `jest.config.js`

// Used for __tests__/testing-library.js
// Learn more: https://github.com/testing-library/jest-dom
// import '@testing-library/jest-dom'

// Mock environment variables for testing
process.env.SMTP_HOST = 'localhost'
process.env.SMTP_PORT = '587'
process.env.SMTP_SECURE = 'false'
process.env.SMTP_USER = 'test@example.com'
process.env.SMTP_PASSWORD = 'test-password'
process.env.SMTP_FROM_NAME = 'Test System'
process.env.SMTP_FROM_EMAIL = 'noreply@test.com'
