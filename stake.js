const solanaStakePool = require("@solana/spl-stake-pool");
const { clusterApiUrl, Lockup, Authorized, Connection, Keypair, PublicKey, LAMPORTS_PER_SOL, Transaction, sendAndConfirmTransaction, StakeProgram } = require("@solana/web3.js");
const bs58 = require("bs58");
require("dotenv").config();

const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

const payer = Keypair.fromSecretKey(bs58.decode(process.env.SECRET_KEY));

const createStakeAccount = async () => {
  const stakeAccount = Keypair.generate();

  const amountUserWantsToStake = LAMPORTS_PER_SOL * 0.01;
  // Calculate how much we want to stake
  const minimumRent = await connection.getMinimumBalanceForRentExemption(StakeProgram.space);
  const amountToStake = minimumRent + amountUserWantsToStake;

  const createStakeAccountTx = StakeProgram.createAccount({
    authorized: new Authorized(payer.publicKey, payer.publicKey), // Here we set two authorities: Stake Authority and Withdrawal Authority. Both are set to our wallet.
    fromPubkey: payer.publicKey,
    lamports: amountToStake,
    lockup: new Lockup(0, 0, payer.publicKey), // Optional. We'll set this to 0 for demonstration purposes.
    stakePubkey: stakeAccount.publicKey,
  });

  const createStakeAccountTxId = await sendAndConfirmTransaction(connection, createStakeAccountTx, [
    payer,
    stakeAccount, // Since we're creating a new stake account, we have that account sign as well
  ]);

  console.log(`Stake account created. Tx Id: ${createStakeAccountTxId}`);

  // Check our newly created stake account balance. This should be 0.5 SOL.
  let stakeBalance = await connection.getBalance(stakeAccount.publicKey);
  console.log(`Stake account balance: ${stakeBalance / LAMPORTS_PER_SOL} SOL`);

  // Verify the status of our stake account. This will start as inactive and will take some time to activate.
  let stakeStatus = await connection.getStakeActivation(stakeAccount.publicKey);
  console.log(`Stake account status: ${stakeStatus.state}`);
};

createStakeAccount();
