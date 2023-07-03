const { TokenListProvider, TokenInfo } = require("@solana/spl-token-registry");

new TokenListProvider().resolve().then((tokens) => {
  const tokenList = tokens.filterByClusterSlug("testnet").getList();
  console.log(tokenList.length);
});
