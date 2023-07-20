import { expect } from 'chai';
import { CoingeckoPriceRepository } from './coingecko';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';

const mockedResponse = {
  '0x202C35e517Fa803B537565c40F0a6965D7204609': {
    // wNEON
    usd: 1.003,
    eth: 0.00063646,
  },
  '0x5f38248f339Bf4e84A2caf4e4c0552862dC9F82a': {
    // wSOL
    usd: 0.995015,
    eth: 0.00063114,
  },
  '0xEA6B04272f9f62F997F666F07D3a974134f7FFb9': {
    // USDC
    usd: 1.001,
    eth: 0.00063693,
  },
  '0x5f0155d08eF4aaE2B500AefB64A3419dA8bB611a': {}, // USDT
};

const addresses = Object.keys(mockedResponse);

const repository = new CoingeckoPriceRepository(addresses, 245022934);

describe('coingecko repository', () => {
  let mock: MockAdapter;

  before(() => {
    mock = new MockAdapter(axios);
    mock.onGet(new RegExp('https://api.coingecko.com/*')).reply(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve([200, mockedResponse]), 10);
        })
    );
  });

  after(() => {
    mock.restore();
  });

  it('finds prices', async () => {
    const [price1, price2, price3, price4, price5, price6] = await Promise.all([
      repository.find(addresses[0]),
      repository.find(addresses[0].toUpperCase()),
      repository.find(addresses[1]),
      repository.find(addresses[2]),
      repository.find(addresses[3]),
      repository.find(addresses[3]),
    ]);
    expect(price1?.usd).to.be.gt(0);
    expect(price2?.usd).to.be.gt(0);
    expect(price3?.usd).to.be.gt(0);
    expect(price4?.usd).to.be.gt(0);
    expect(price5?.usd).to.be.undefined;
    expect(price6?.usd).to.be.undefined;
  });

  context('when the response is rate limited', () => {
    const repository = new CoingeckoPriceRepository(addresses, 1);

    it('throws error with status code', async () => {
      const status = 429;
      mock.onGet(new RegExp('https://api.coingecko.com/*')).reply(status);
      try {
        await repository.find(addresses[0]);
      } catch (error) {
        expect(error).to.match(new RegExp(`${status}`));
      }
    });
  });
});
