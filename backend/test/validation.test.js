import test from 'node:test';
import assert from 'node:assert/strict';
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from '../src/modules/Auth/Auth.validation.js';
import { AllMessagesSchema, createMessageSchema } from '../src/modules/messages/message.validation.js';
import { changePasswordSchema, udateProfileSchema } from '../src/modules/users/user.validation.js';
const id = '507f1f77bcf86cd799439011';
test('registration accepts strong passwords with symbols and normalizes email', () => {
  const result = registerSchema.validate({ userName: 'Test User', email: 'TEST@example.com', password: 'A-strong!Pass9', confirmPassword: 'A-strong!Pass9', phone: '+201000000000' });
  assert.equal(result.error, undefined); assert.equal(result.value.email, 'test@example.com');
});
test('login rejects malformed email', () => assert.ok(loginSchema.validate({ email: 'nope', password: 'password' }).error));
test('inbox/outbox query schema takes only a flag; owner ids are derived from the JWT, never from the client', () => {
  assert.equal(AllMessagesSchema.validate({ flag: 'inbox' }).error, undefined);
  assert.ok(AllMessagesSchema.validate({ flag: 'inbox', reciever: id }).error);
  assert.ok(AllMessagesSchema.validate({ flag: 'outbox', sender: id }).error);
  assert.ok(AllMessagesSchema.validate({ flag: 'trash' }).error);
});
test('message creation requires recipient and bounded content', () => {
  assert.equal(createMessageSchema.validate({ content: 'hello', reciever: id }).error, undefined);
  assert.ok(createMessageSchema.validate({ content: '', reciever: 'bad' }).error);
});
test('profile and password schemas match frontend payloads', () => {
  assert.equal(udateProfileSchema.validate({ email: 'a@example.com', userName: 'alice' }).error, undefined);
  assert.equal(changePasswordSchema.validate({ currentPassword: 'old-password', newPassword: 'New-password!9', confirmPassword: 'New-password!9' }).error, undefined);
});

test('password recovery schemas validate email and matching new password', () => {
  assert.equal(forgotPasswordSchema.validate({ email: 'user@example.com' }).error, undefined);
  assert.ok(forgotPasswordSchema.validate({ email: 'bad' }).error);
  assert.equal(resetPasswordSchema.validate({ resetToken: 'signed-token', newPassword: 'A-new-password!9', confirmPassword: 'A-new-password!9' }).error, undefined);
  assert.ok(resetPasswordSchema.validate({ resetToken: 'signed-token', newPassword: 'A-new-password!9', confirmPassword: 'different' }).error);
});
