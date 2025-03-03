const { ApiPromise, WsProvider } = require("@polkadot/api");

const omnipoolAccountId = "7L53bUTBbfuj14UpdCNPwmgzzHSsrsTWBHX5pys32mVWM3C1"

async function tvl() {
  const { api: _api } = arguments[3]
  const provider = new WsProvider("wss://hydradx-rpc.dwellir.com");
  const api = await ApiPromise.create({ provider, });
  await api.isReady
  // const assetCount = +await api.query.assetRegistry.nextAssetId() // doesnt work
  const assetMetadata = []
  let i = 0;
  let hasMore = true;
  do {
    const meta = await api.query.assetRegistry.assetMetadataMap(i)
    if (meta.isNone) {
      hasMore = false
      break
    }
      
    assetMetadata.push(meta)
    i++
  } while (hasMore)
  assetMetadata.forEach((meta, i) => assetMetadata[i] = {
    symbol: meta.unwrap().symbol.toHuman(),
    decimals: +meta.unwrap().decimals,
    assetId: i,
  })
  assetMetadata.shift()

  const hdxBalance = await api.query.system.account(omnipoolAccountId)
  add('hydradx', hdxBalance.data.free / 1e12)
  for (const { decimals, assetId, symbol } of assetMetadata) {
    const cgId = cgMapping[symbol]
    if (cgId) {
      const bal = await api.query.tokens.accounts(omnipoolAccountId, assetId)
      add(cgId, bal.free / (10 ** decimals))
    } else {
      console.log(`No mapping for ${symbol}, skipping it`)
    }
  }

  return _api.getBalances()

  function add(token, bal) {
    _api.add(token, bal, { skipChain: true })
  }
}

module.exports = {
  hydradx: { tvl },
}

const cgMapping = {
  DAI: 'dai',
  INTR: 'interlay',
  GLMR: 'moonbeam',
  vDOT: 'voucher-dot',
  ZTG: 'zeitgeist',
  CFG: 'centrifuge',
  BNC: 'bifrost-native-coin',
  WETH: 'ethereum',
  DOT: 'polkadot',
  APE: 'apecoin',
  USDC: 'usd-coin',
  USDT: 'tether',
  ASTR: 'astar',
  WBTC: 'wrapped-bitcoin',
  iBTC: 'interbtc',
}

