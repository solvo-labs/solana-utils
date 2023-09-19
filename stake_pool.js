require("dotenv").config();
const { clusterApiUrl, Connection, Keypair, PublicKey, sendAndConfirmTransaction, Transaction, LAMPORTS_PER_SOL } = require("@solana/web3.js");
const bs58 = require("bs58");
const solanaStakePool = require("@solana/spl-stake-pool");
const { publicKey, struct, u32, u64, u8, option, vec } = require("@coral-xyz/borsh");
const BN = require("bn.js");
const { TOKEN_PROGRAM_ID } = require("@solana/spl-token");

const feeFields = [u64("denominator"), u64("numerator")];

const StakePoolLayout = struct([
  u8("accountType"),
  publicKey("manager"),
  publicKey("staker"),
  publicKey("stakeDepositAuthority"),
  u8("stakeWithdrawBumpSeed"),
  publicKey("validatorList"),
  publicKey("reserveStake"),
  publicKey("poolMint"),
  publicKey("managerFeeAccount"),
  publicKey("tokenProgramId"),
  u64("totalLamports"),
  u64("poolTokenSupply"),
  u64("lastUpdateEpoch"),
  struct([u64("unixTimestamp"), u64("epoch"), publicKey("custodian")], "lockup"),
  struct(feeFields, "epochFee"),
  option(struct(feeFields), "nextEpochFee"),
  option(publicKey(), "preferredDepositValidatorVoteAddress"),
  option(publicKey(), "preferredWithdrawValidatorVoteAddress"),
  struct(feeFields, "stakeDepositFee"),
  struct(feeFields, "stakeWithdrawalFee"),
  option(struct(feeFields), "nextStakeWithdrawalFee"),
  u8("stakeReferralFee"),
  option(publicKey(), "solDepositAuthority"),
  struct(feeFields, "solDepositFee"),
  u8("solReferralFee"),
  option(publicKey(), "solWithdrawAuthority"),
  struct(feeFields, "solWithdrawalFee"),
  option(struct(feeFields), "nextSolWithdrawalFee"),
  u64("lastEpochPoolTokenSupply"),
  u64("lastEpochTotalLamports"),
]);

const payer = Keypair.fromSecretKey(bs58.decode(process.env.SECRET_KEY));

const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

const stakePool = {
  accountType: 1,
  manager: Keypair.generate().publicKey,
  staker: Keypair.generate().publicKey,
  stakeDepositAuthority: payer.publicKey,
  stakeWithdrawBumpSeed: 255,
  validatorList: Keypair.generate().publicKey,
  reserveStake: Keypair.generate().publicKey,
  poolMint: Keypair.generate().publicKey,
  managerFeeAccount: Keypair.generate().publicKey,
  tokenProgramId: TOKEN_PROGRAM_ID,
  totalLamports: new BN(LAMPORTS_PER_SOL * 999),
  poolTokenSupply: new BN(LAMPORTS_PER_SOL * 100),
  lastUpdateEpoch: new BN("7c", "hex"),
  lockup: {
    unixTimestamp: new BN(Date.now()),
    epoch: new BN(1),
    custodian: new PublicKey(0),
  },
  epochFee: {
    denominator: new BN(0),
    numerator: new BN(0),
  },
  nextEpochFee: {
    denominator: new BN(0),
    numerator: new BN(0),
  },
  preferredDepositValidatorVoteAddress: Keypair.generate().publicKey,
  preferredWithdrawValidatorVoteAddress: Keypair.generate().publicKey,
  stakeDepositFee: {
    denominator: new BN(0),
    numerator: new BN(0),
  },
  stakeWithdrawalFee: {
    denominator: new BN(0),
    numerator: new BN(0),
  },
  nextStakeWithdrawalFee: {
    denominator: new BN(0),
    numerator: new BN(0),
  },
  stakeReferralFee: 0,
  solDepositAuthority: payer.publicKey,
  solDepositFee: {
    denominator: new BN(0),
    numerator: new BN(0),
  },
  solReferralFee: 0,
  solWithdrawAuthority: payer.publicKey,
  solWithdrawalFee: {
    denominator: new BN(0),
    numerator: new BN(0),
  },
  nextSolWithdrawalFee: {
    denominator: new BN(0),
    numerator: new BN(0),
  },
  lastEpochPoolTokenSupply: new BN(0),
  lastEpochTotalLamports: new BN(0),
};

const stakePoolAddress = new PublicKey("SPoo1Ku8WFXoNDMHPsrGSTSG1Y47rzgn41SLUNakuHy");

const data = Buffer.alloc(1024);

StakePoolLayout.encode(stakePool, data);

const stakePoolAccount = {
  executable: true,
  owner: stakePoolAddress,
  lamports: 99999,
  data,
};

// const payload = {
//   stakePool: stakePoolAddress,
//   withdrawAuthority: payer.publicKey,
//   reserveStake: payer.publicKey,
//   fundingAccount: payer.publicKey,
//   destinationPoolAccount: payer.publicKey,
//   managerFeeAccount: payer.publicKey,
//   referralPoolAccount: payer.publicKey,
//   poolMint: payer.publicKey,
//   lamports: 99999,
// };

// const test = async () => {
//   await connection.getMinimumBalanceForRentExemption();

//   solanaStakePool.StakePoolInstruction.depositSol();

//   const result = solanaStakePool.StakePoolInstruction.depositSol(payload);

//   console.log(result);

//   const tx = await sendAndConfirmTransaction(connection, result, [payer]);

//   console.log(tx);
// };

// test();

const aa = async () => {
  const balance = 10000;
  const stakePoolAddress = new PublicKey("SPoo1Ku8WFXoNDMHPsrGSTSG1Y47rzgn41SLUNakuHy");

  connection.getAccountInfo = async (pubKey) => {
    if (pubKey === stakePoolAddress) {
      return stakePoolAccount;
    }

    return {
      executable: true,
      owner: payer,
      lamports: balance,
      data: null,
    };
  };

  const res = await solanaStakePool.depositSol(connection, stakePoolAddress, payer.publicKey, balance);
  const tx = new Transaction();

  tx.add(...res.instructions);

  console.log(res.signers[0].publicKey.toBase58());

  const txId = await sendAndConfirmTransaction(connection, tx, [payer, ...res.signers]);

  console.log(txId);
};

const test = async () => {
  const a = Keypair.generate();
  const b = Keypair.generate();
  const c = Keypair.generate();
  const d = Keypair.generate();
  const e = Keypair.generate();

  const payload = {
    stakePool: stakePoolAddress,
    withdrawAuthority: payer.publicKey,
    reserveStake: a.publicKey,
    fundingAccount: payer.publicKey,
    destinationPoolAccount: b.publicKey,
    managerFeeAccount: c.publicKey,
    referralPoolAccount: d.publicKey,
    poolMint: e.publicKey,
    lamports: 99999,
  };

  const tx = solanaStakePool.StakePoolInstruction.depositSol(payload);
  console.log(tx);
  const txId = await sendAndConfirmTransaction(connection, tx, [payer, a, b, c, d, e]);
  console.log(txId);
  // const instruction = StakePoolInstruction.depositSol(payload);
};

// test();

console.log(1863812 / LAMPORTS_PER_SOL);
