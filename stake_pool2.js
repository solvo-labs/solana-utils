const {
  Connection,
  Transaction,
  Keypair,
  clusterApiUrl,
  SystemProgram,
  PublicKey,
  LAMPORTS_PER_SOL,
  sendAndConfirmRawTransaction,
  TransactionInstruction,
} = require("@solana/web3.js");

const { StakePool, StakePoolManager, StakePoolConfig } = require("@solana/spl-stake-pool");
require("dotenv").config();
const bs58 = require("bs58");

const payer = Keypair.fromSecretKey(bs58.decode(process.env.SECRET_KEY));
const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

// Create a new stake pool manager
const stakePoolManager = StakePoolManager.createStakePoolManager(connection);

// Create a new stake pool config
const stakePoolConfig = new StakePoolConfig(stakePoolManager.publicKey, payer.publicKey, "My Stake Pool", "A stake pool for my Solana node", 1000, 1000, 1000);

// Create a new stake pool
const stakePool = stakePoolManager.createStakePool(stakePoolConfig);

// Deposit SOL into the stake pool
const depositAmount = 1000 * LAMPORTS_PER_SOL;
const depositInstruction = StakePool.createDepositInstruction(stakePool.publicKey, payer.publicKey, depositAmount);

sendAndConfirmRawTransaction(connection, transaction, [depositInstruction]);
