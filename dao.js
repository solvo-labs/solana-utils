// REF https://github.com/nation-io/solana-dao-sdk/blob/main/packages/solana-dao-sdk/src/internal/services/daoService.ts

require("dotenv").config();
const {
  clusterApiUrl,
  sendAndConfirmRawTransaction,
  Connection,
  PublicKey,
  TransactionInstruction,
  Keypair,
  Transaction,
  SystemProgram,
  sendAndConfirmTransaction,
} = require("@solana/web3.js");
const bs58 = require("bs58");
const {
  getRealms,
  getRealm,
  createTokenizedRealm,
  TOKEN_PROGRAM_ID,
  GOVERNANCE_CHAT_PROGRAM_ID,
  tryGetRealmConfig,
  getVoteRecord,
  getTokenOwnerRecord,
  getAllGovernances,
  getProposalsByGovernance,
  getAllProposals,
  getTokenOwnerRecordsByOwner,
  createInstructionData,
  withCreateGovernance,
  withCreateRealm,
  GoverningTokenConfigAccountArgs,
  GoverningTokenType,
  getAllTokenOwnerRecords,
  MintMaxVoteWeightSource,
  withDepositGoverningTokens,
  getTokenOwnerRecordAddress,
  GovernanceConfig,
  VoteThresholdType,
  withSetRealmAuthority,
  withCreateMintGovernance,
  VoteTipping,
  VoteThreshold,
  SetRealmAuthorityAction,
} = require("@solana/spl-governance");

const BN = require("bn.js");

const {
  createInitializeMint2Instruction,
  createAssociatedTokenAccountInstruction,
  getMinimumBalanceForRentExemptMint,
  MINT_SIZE,
  getAccount,
  getAssociatedTokenAddressSync,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccount,
  createMintToInstruction,
} = require("@solana/spl-token");
const { BigNumber } = require("bignumber.js");

const payer = Keypair.fromSecretKey(bs58.decode(process.env.SECRET_KEY));

const mintAuthority = payer;

const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

const GOVERNANCE_PROGRAM_ID = new PublicKey("GovER5Lthms3bLBqWub97yVrMmEogzX7xNjdXpPPCVZw");
const demoRealm = new PublicKey("9YRDkCdGm2VedhmRgPojqVQnrSVfunr1agL2LkMXZUX8");
const publicKey = payer.publicKey;

const tokenAmount = 1;
const decimal = 8;

const DEFAULT_COMMUNITY_MINT_MAX_VOTE_WEIGHT_SOURCE = MintMaxVoteWeightSource.FULL_SUPPLY_FRACTION;
const MIN_COMMUNITY_TOKENS_TO_CREATE_WITH_ZERO_SUPPLY = 1000000;

const testWallets = [publicKey, new PublicKey("G1xDSUJrQEFtJ1Z9ME1qcRs2w61AP5mYDDpEVBZrhPuW"), new PublicKey("GVfARe6xnujtzGbgDf1drSneKECpa65HPhQJkS6QeCz2")];

const fetch = async () => {
  const realm = await getRealm(connection, demoRealm);
  // console.log(realm);
  const config = await tryGetRealmConfig(connection, GOVERNANCE_PROGRAM_ID, demoRealm);
  console.log(config);
};

const getMembers = async () => {
  const allMembers = await getAllTokenOwnerRecords(connection, GOVERNANCE_PROGRAM_ID, demoRealm);

  console.log(allMembers);
};

const createMultisigDao = async () => {
  const recentBlockhash = await connection.getLatestBlockhash();
  const result = await daoMints(recentBlockhash);

  const mintResult = await mintCouncilTokensToMembers(testWallets, result.councilMintPk, recentBlockhash);

  const { daoPk, transaction: daoTransaction } = await createConfiguredDao(
    "nocodetooldao",
    60,
    publicKey,
    result.communityMintPk,
    result.councilMintPk,
    mintResult.walletAssociatedTokenAccountPk,
    recentBlockhash
  );

  const transactions = [result.transaction, mintResult.transaction, daoTransaction];
  const txSigns = transactions.map((tx) => {
    tx.partialSign(payer);

    return tx;
  });

  const transactionsSignatures = [];

  for (const signed of txSigns) {
    const rawTransaction = signed.serialize();
    const transactionSignature = await sendAndConfirmRawTransaction(
      connection,
      rawTransaction,
      {
        signature: bs58.encode(signed.signature),
        blockhash: recentBlockhash.blockhash,
        lastValidBlockHeight: recentBlockhash.lastValidBlockHeight,
      },
      {
        commitment: "confirmed",
      }
    );

    transactionsSignatures.push(transactionsSignatures);
  }
};

const daoMints = async (recentBlockhash) => {
  const communityMint = await createMint(null, decimal);

  const councilMint = await createMint(null, 0);

  const transaction = new Transaction({
    blockhash: recentBlockhash.blockhash,
    lastValidBlockHeight: recentBlockhash.lastValidBlockHeight,
    feePayer: publicKey,
  });

  transaction.add(communityMint.transaction);
  transaction.add(councilMint.transaction);

  transaction.partialSign(communityMint.toAccount);
  transaction.partialSign(councilMint.toAccount);

  return {
    transaction,
    communityMintPk: communityMint.toAccount.publicKey,
    councilMintPk: councilMint.toAccount.publicKey,
  };
};

const createConfiguredDao = async (name, yesVoteThreshold, walletPk, communityMintPk, councilMintPk, walletAssociatedTokenAccountPk, recentBlockhash) => {
  const { daoPk, instructions } = await createDao(name, yesVoteThreshold, walletPk, communityMintPk, councilMintPk, walletAssociatedTokenAccountPk);

  const transaction = new Transaction({
    blockhash: recentBlockhash.blockhash,
    lastValidBlockHeight: recentBlockhash.lastValidBlockHeight,
    feePayer: publicKey,
  });

  instructions.forEach((instruction) => transaction.add(instruction));

  return { daoPk, transaction };
};

const createDao = async (name, yesVoteThreshold, walletPk, communityMintPk, councilMintPk, walletAssociatedTokenAccountPk) => {
  const communityTokenConfig = undefined;
  const councilTokenConfig = undefined;
  const voterWeightRecord = undefined;
  const instructions = [];

  const minCommunityTokensToCreateAsMintValue = new BN(getMintNaturalAmountFromDecimal(MIN_COMMUNITY_TOKENS_TO_CREATE_WITH_ZERO_SUPPLY, decimal));

  const realmPk = await withCreateRealm(
    instructions,
    GOVERNANCE_PROGRAM_ID,
    3,
    name,
    walletPk,
    communityMintPk,
    walletPk,
    councilMintPk,
    DEFAULT_COMMUNITY_MINT_MAX_VOTE_WEIGHT_SOURCE,
    minCommunityTokensToCreateAsMintValue,
    communityTokenConfig,
    councilTokenConfig
  );

  await withDepositGoverningTokens(
    instructions,
    GOVERNANCE_PROGRAM_ID,
    3,
    realmPk,
    walletAssociatedTokenAccountPk,
    councilMintPk,
    walletPk,
    walletPk,
    walletPk,
    new BN(tokenAmount)
  );

  const tokenOwnerRecordPk = await getTokenOwnerRecordAddress(GOVERNANCE_PROGRAM_ID, realmPk, councilMintPk, walletPk);

  // Put community and council mints under the realm governance with default config
  const config = new GovernanceConfig({
    communityVoteThreshold: new VoteThreshold({
      type: VoteThresholdType.YesVotePercentage,
      value: yesVoteThreshold,
    }),
    minCommunityTokensToCreateProposal: minCommunityTokensToCreateAsMintValue,
    // Do not use instruction hold up time
    minInstructionHoldUpTime: 0,
    // max voting time 3 days
    maxVotingTime: getTimestampFromDays(3),
    communityVoteTipping: VoteTipping.Strict,
    minCouncilTokensToCreateProposal: new BN(1),
    councilVoteThreshold: new VoteThreshold({
      type: VoteThresholdType.YesVotePercentage,
      value: 0,
    }),
    councilVetoVoteThreshold: new VoteThreshold({
      type: VoteThresholdType.YesVotePercentage,
      value: yesVoteThreshold,
    }),
    communityVetoVoteThreshold: new VoteThreshold({
      type: VoteThresholdType.YesVotePercentage,
      value: yesVoteThreshold,
    }),
    councilVoteTipping: VoteTipping.Strict,
  });

  console.log("here", config);

  const communityMintGovPk = await withCreateMintGovernance(
    instructions,
    GOVERNANCE_PROGRAM_ID,
    3,
    realmPk,
    communityMintPk,
    config,
    !!walletPk,
    walletPk,
    tokenOwnerRecordPk,
    walletPk,
    walletPk,
    voterWeightRecord
  );

  // Set the community governance as the realm authority
  withSetRealmAuthority(instructions, GOVERNANCE_PROGRAM_ID, 3, realmPk, walletPk, communityMintGovPk, SetRealmAuthorityAction.SetChecked);

  return { daoPk: realmPk, instructions };
};

const mintCouncilTokensToMembers = async (councilWalletsPks, councilMintPk, recentBlockhash) => {
  const instructions = [];
  let walletAssociatedTokenAccountPk;

  const isWalletInCouncilWallets = councilWalletsPks.some((teamWalletPk) => teamWalletPk.equals(publicKey));

  for (const teamWalletPk of councilWalletsPks) {
    const associatedTokenAccount = await getOrCreateAssociatedTokenAccount(councilMintPk, teamWalletPk);

    const mint = mintTo(councilMintPk, associatedTokenAccount.associatedToken);

    instructions.push(associatedTokenAccount.transaction, mint);

    if (teamWalletPk.equals(publicKey)) {
      walletAssociatedTokenAccountPk = associatedTokenAccount.associatedToken;
    }
  }

  const transaction = new Transaction({
    blockhash: recentBlockhash.blockhash,
    lastValidBlockHeight: recentBlockhash.lastValidBlockHeight,
    feePayer: publicKey,
  });

  instructions.forEach((instruction) => transaction.add(instruction));

  return {
    transaction,
    walletAssociatedTokenAccountPk,
  };
};

// utils
const createMint = async (freezeAuthority, decimal) => {
  const toAccount = Keypair.generate();
  const lamports = await getMinimumBalanceForRentExemptMint(connection);

  const transaction = new Transaction().add(
    SystemProgram.createAccount({
      fromPubkey: publicKey,
      newAccountPubkey: toAccount.publicKey,
      space: MINT_SIZE,
      lamports,
      programId: TOKEN_PROGRAM_ID,
    }),

    createInitializeMint2Instruction(toAccount.publicKey, decimal, publicKey, freezeAuthority, TOKEN_PROGRAM_ID)
  );

  return { transaction, toAccount };
};

const getOrCreateAssociatedTokenAccount = async (mint, owner) => {
  let account;
  const associatedToken = getAssociatedTokenAddressSync(mint, owner, false, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID);

  try {
    account = await getAccount(connection, associatedToken);
    return { associatedToken, account };
  } catch {
    const transaction = new Transaction().add(createAssociatedTokenAccountInstruction(publicKey, associatedToken, owner, mint, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID));
    return { associatedToken, transaction };
  }
};

const mintTo = (mint, address) => {
  const ix = new Transaction().add(createMintToInstruction(mint, address, publicKey, 1 * Math.pow(10, decimal), [], TOKEN_PROGRAM_ID));

  return ix;
};

const getMintNaturalAmountFromDecimal = (decimalAmount, decimals) => {
  return new BigNumber(decimalAmount).shiftedBy(decimals).toNumber();
};

// getMembers();

const getTimestampFromDays = (days) => {
  const SECONDS_PER_DAY = 86400;

  return days * SECONDS_PER_DAY;
};

createMultisigDao();
