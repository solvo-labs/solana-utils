const solanaStakePool = require("@solana/spl-stake-pool");
const { clusterApiUrl, Lockup, Authorized, Connection, Keypair, PublicKey, LAMPORTS_PER_SOL, Transaction, sendAndConfirmTransaction, StakeProgram } = require("@solana/web3.js");
const bs58 = require("bs58");
require("dotenv").config();

const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

const payer = Keypair.fromSecretKey(bs58.decode(process.env.SECRET_KEY));

const createStakeAccount = async () => {
  const stakeAccount = Keypair.generate();

  console.log(stakeAccount.publicKey.toBase58());

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

const stakeAccount = new PublicKey("HmF4hDsNtpUGQ2VTf1XERU5k3n61yCBssvMq9akxh5dv");

const delegateStake = async () => {
  const validators = await connection.getVoteAccounts();

  const selectedValidator = validators.current[0];
  const selectedValidatorPubkey = new PublicKey(selectedValidator.votePubkey);

  const delegateTx = StakeProgram.delegate({
    stakePubkey: stakeAccount,
    authorizedPubkey: payer.publicKey,
    votePubkey: selectedValidatorPubkey,
  });

  const delegateTxId = await sendAndConfirmTransaction(connection, delegateTx, [payer]);
  console.log(`Stake account delegated to ${selectedValidatorPubkey}. Tx Id: ${delegateTxId}`);

  // Check in on our stake account. It should now be activating.
  const stakeStatus = await connection.getStakeActivation(stakeAccount);
  console.log(`Stake account status: ${stakeStatus.state}`);
};

const deactivateStake = async () => {
  const deactivateTx = StakeProgram.deactivate({
    stakePubkey: stakeAccount,
    authorizedPubkey: payer.publicKey,
  });

  const deactivateTxId = await sendAndConfirmTransaction(connection, deactivateTx, [payer]);
  console.log(deactivateTxId);
};

deactivateStake();
