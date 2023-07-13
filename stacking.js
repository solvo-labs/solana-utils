const solanaStakePool = require("@solana/spl-stake-pool");
const { clusterApiUrl, Connection, Keypair, PublicKey, LAMPORTS_PER_SOL, Transaction, sendAndConfirmTransaction, StakeProgram } = require("@solana/web3.js");
const bs58 = require("bs58");
require("dotenv").config();

const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

const payer = Keypair.fromSecretKey(bs58.decode(process.env.SECRET_KEY));

const test = async () => {
  // const data = await solanaStakePool.getStakePoolAccounts(connection, solanaStakePool.STAKE_POOL_PROGRAM_ID);
  // const xx = await solanaStakePool.stakePoolInfo(connection, new PublicKey("8xWMix1995zFQovvBxcQ9xzybzpH2Uz2C7syz6dMo3V5"));
  // console.log(xx);
  const aa = await solanaStakePool.depositSol(connection, new PublicKey("SPoo1Ku8WFXoNDMHPsrGSTSG1Y47rzgn41SLUNakuHy"), payer.publicKey, LAMPORTS_PER_SOL * 0.1);
  console.log(aa);
  // const tx = new Transaction();
  // tx.add(aa);
  // const txid = await sendAndConfirmTransaction(connection, tx, [payer]);
  // console.log(txid);
  // const data2 = await solanaStakePool.getStakePoolAccount(connection, solanaStakePool.STAKE_POOL_PROGRAM_ID);
  // console.log(solanaStakePool.STAKE_POOL_PROGRAM_ID.toBase58());
  // console.log(data[180]);
  // console.log(data.length);
  // console.log(data[data.length - 1]);
  // console.log(xx);
  // console.log(data[data.length - 1]);
  // const filteredData = data.filter((dt) => dt.account.data && dt.account.data.accountType && dt.account.data.accountType === 1);
  // const pubkeys = filteredData.map((dt) => dt.pubkey);
  // // let result = [];
  // const promises = pubkeys.slice(0, 10).map((dt) => solanaStakePool.stakePoolInfo(connection, dt));
  // const finaldata = await Promise.all(promises);
  // const finalFilteredData = finaldata.filter((df) => df.details.totalPoolTokens > 0);
  // console.log(finalFilteredData);
};

test();
