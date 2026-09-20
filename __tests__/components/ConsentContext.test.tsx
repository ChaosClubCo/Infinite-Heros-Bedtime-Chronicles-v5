import React from 'react';
import { View, Text } from 'react-native';
import { render, screen, act, waitFor, fireEvent } from '@testing-library/react-native';
import { ConsentProvider, useConsent } from '@/lib/ConsentContext';
import { getConsentGiven } from '@/lib/consent-record';

// ConsentContext seeds app/_layout.tsx's Stack.Protected guard — every screen
// except index/parental-consent/privacy is unmountable until isConsented is
// true. It fails closed by construction (lib/ConsentContext.tsx catches any
// getConsentGiven() rejection and stays unconsented), which is the property
// this suite pins down; lib/consent-record.test.ts covers the storage-level
// record validation this hook delegates to.
jest.mock('@/lib/consent-record', () => ({
  getConsentGiven: jest.fn(),
}));

const mockedGetConsentGiven = getConsentGiven as jest.MockedFunction<typeof getConsentGiven>;

function Probe() {
  const { isLoaded, isConsented, markConsented, markUnconsented } = useConsent();
  return (
    <View>
      <Text testID="isLoaded">{String(isLoaded)}</Text>
      <Text testID="isConsented">{String(isConsented)}</Text>
      <Text testID="markConsented" onPress={markConsented}>consent</Text>
      <Text testID="markUnconsented" onPress={markUnconsented}>unconsent</Text>
    </View>
  );
}

async function renderProbe() {
  return render(
    <ConsentProvider>
      <Probe />
    </ConsentProvider>,
  );
}

describe('ConsentContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('starts unloaded and unconsented before the stored record resolves', async () => {
    mockedGetConsentGiven.mockReturnValue(new Promise(() => {})); // never resolves
    await renderProbe();
    expect(screen.getByTestId('isLoaded').props.children).toBe('false');
    expect(screen.getByTestId('isConsented').props.children).toBe('false');
  });

  it('flips to consented once a valid stored record resolves true', async () => {
    mockedGetConsentGiven.mockResolvedValue(true);
    await renderProbe();
    await waitFor(() => expect(screen.getByTestId('isLoaded').props.children).toBe('true'));
    expect(screen.getByTestId('isConsented').props.children).toBe('true');
  });

  it('stays unconsented when the stored record is missing/invalid', async () => {
    mockedGetConsentGiven.mockResolvedValue(false);
    await renderProbe();
    await waitFor(() => expect(screen.getByTestId('isLoaded').props.children).toBe('true'));
    expect(screen.getByTestId('isConsented').props.children).toBe('false');
  });

  it('fails closed (stays unconsented, but still finishes loading) when the read rejects', async () => {
    mockedGetConsentGiven.mockRejectedValue(new Error('AsyncStorage unavailable'));
    await renderProbe();
    await waitFor(() => expect(screen.getByTestId('isLoaded').props.children).toBe('true'));
    expect(screen.getByTestId('isConsented').props.children).toBe('false');
  });

  it('markConsented flips isConsented in memory without re-reading storage', async () => {
    mockedGetConsentGiven.mockResolvedValue(false);
    await renderProbe();
    await waitFor(() => expect(screen.getByTestId('isConsented').props.children).toBe('false'));

    await act(async () => {
      fireEvent.press(screen.getByTestId('markConsented'));
    });
    expect(screen.getByTestId('isConsented').props.children).toBe('true');
    // The in-memory flip does not re-invoke the storage read.
    expect(mockedGetConsentGiven).toHaveBeenCalledTimes(1);
  });

  it('markUnconsented flips isConsented back to false (e.g. after "delete all data")', async () => {
    mockedGetConsentGiven.mockResolvedValue(true);
    await renderProbe();
    await waitFor(() => expect(screen.getByTestId('isConsented').props.children).toBe('true'));

    await act(async () => {
      fireEvent.press(screen.getByTestId('markUnconsented'));
    });
    expect(screen.getByTestId('isConsented').props.children).toBe('false');
  });
});
