import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePin } from '../hooks/usePin';

describe('usePin', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('inicia com PIN desativado', () => {
    const { result } = renderHook(() => usePin());
    expect(result.current.pinEnabled).toBe(false);
    expect(result.current.pinVerified).toBe(false);
  });

  it('ativa PIN corretamente', () => {
    const { result } = renderHook(() => usePin());

    act(() => {
      result.current.setPin('1234');
    });

    expect(result.current.pinEnabled).toBe(true);
    expect(result.current.pinVerified).toBe(true);
    expect(localStorage.getItem('pin_enabled')).toBe('true');
  });

  it('verifica PIN correto', () => {
    const { result } = renderHook(() => usePin());

    act(() => { result.current.setPin('5678'); });
    act(() => { result.current.lockApp(); });

    expect(result.current.pinVerified).toBe(false);

    let ok;
    act(() => { ok = result.current.verifyPin('5678'); });

    expect(ok).toBe(true);
    expect(result.current.pinVerified).toBe(true);
  });

  it('rejeita PIN incorreto', () => {
    const { result } = renderHook(() => usePin());

    act(() => { result.current.setPin('1111'); });
    act(() => { result.current.lockApp(); });

    let ok;
    act(() => { ok = result.current.verifyPin('9999'); });

    expect(ok).toBe(false);
    expect(result.current.pinVerified).toBe(false);
  });

  it('remove PIN corretamente', () => {
    const { result } = renderHook(() => usePin());

    act(() => { result.current.setPin('4321'); });
    act(() => { result.current.removePin(); });

    expect(result.current.pinEnabled).toBe(false);
    expect(localStorage.getItem('pin_enabled')).toBe('false');
  });

  it('bloqueia o app', () => {
    const { result } = renderHook(() => usePin());

    act(() => { result.current.setPin('0000'); });
    expect(result.current.pinVerified).toBe(true);

    act(() => { result.current.lockApp(); });
    expect(result.current.pinVerified).toBe(false);
  });
});
