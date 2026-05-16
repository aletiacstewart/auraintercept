import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDashboardViewMode } from './useDashboardViewMode';

const STORAGE_KEY = 'aura.dashboard.view-mode';

describe('useDashboardViewMode', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('defaults to simple when no value is stored', () => {
    const { result } = renderHook(() => useDashboardViewMode());
    expect(result.current.mode).toBe('simple');
    expect(result.current.isSimple).toBe(true);
  });

  it('hydrates from localStorage on mount', () => {
    window.localStorage.setItem(STORAGE_KEY, 'pro');
    const { result } = renderHook(() => useDashboardViewMode());
    expect(result.current.mode).toBe('pro');
    expect(result.current.isPro).toBe(true);
  });

  it('persists toggle across remounts on the same device', () => {
    const first = renderHook(() => useDashboardViewMode());
    act(() => first.result.current.toggle());
    expect(first.result.current.mode).toBe('pro');
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe('pro');

    first.unmount();

    const second = renderHook(() => useDashboardViewMode());
    expect(second.result.current.mode).toBe('pro');
  });

  it('setMode writes through to localStorage', () => {
    const { result } = renderHook(() => useDashboardViewMode());
    act(() => result.current.setMode('pro'));
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe('pro');
    act(() => result.current.setMode('simple'));
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe('simple');
  });
});