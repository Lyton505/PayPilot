import { InvoiceStatus, TransactionStatus, RiskFlagType } from '../index';

describe('PayPilot Types', () => {
  test('InvoiceStatus enum should have correct values', () => {
    expect(InvoiceStatus.DRAFT).toBe('draft');
    expect(InvoiceStatus.PENDING_APPROVAL).toBe('pending_approval');
    expect(InvoiceStatus.APPROVED).toBe('approved');
    expect(InvoiceStatus.EXECUTED).toBe('executed');
    expect(InvoiceStatus.FAILED).toBe('failed');
  });

  test('TransactionStatus enum should have correct values', () => {
    expect(TransactionStatus.PENDING).toBe('pending');
    expect(TransactionStatus.CONFIRMED).toBe('confirmed');
    expect(TransactionStatus.FAILED).toBe('failed');
    expect(TransactionStatus.CANCELLED).toBe('cancelled');
  });

  test('RiskFlagType enum should have correct values', () => {
    expect(RiskFlagType.HIGH_VOLUME).toBe('high_volume');
    expect(RiskFlagType.SUSPICIOUS_ACTIVITY).toBe('suspicious_activity');
    expect(RiskFlagType.BLACKLISTED).toBe('blacklisted');
    expect(RiskFlagType.NEW_ADDRESS).toBe('new_address');
    expect(RiskFlagType.MIXER_INTERACTION).toBe('mixer_interaction');
  });
});