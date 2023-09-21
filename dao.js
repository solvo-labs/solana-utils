require("dotenv").config();
const { clusterApiUrl, Connection, PublicKey, TransactionInstruction, Keypair } = require("@solana/web3.js");
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
} = require("@solana/spl-governance");

const payer = Keypair.fromSecretKey(bs58.decode(process.env.SECRET_KEY));

const mintAuthority = payer;

const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

const GOVERNANCE_PROGRAM_ID = new PublicKey("GovER5Lthms3bLBqWub97yVrMmEogzX7xNjdXpPPCVZw");
const demoRealm = new PublicKey("9YRDkCdGm2VedhmRgPojqVQnrSVfunr1agL2LkMXZUX8");
const owner = new PublicKey("By5csp7qbtqC2ByLj7NJBwwHUHKEedeYyCsmjCm5Qkyo");

const init = async () => {
  const realm = await getRealm(connection, demoRealm);
  // console.log(realm);
  // const config = await tryGetRealmConfig(connection, GOVERNANCE_PROGRAM_ID, demoRealm);
  // const vrecord = await getVoteRecord(connection, demoRealm);
  // const tor = await getTokenOwnerRecord(connection, owner);
  // console.log(tor);

  // fetch proposals
  const prps = await getAllProposals(connection, GOVERNANCE_PROGRAM_ID, demoRealm);
  console.log(prps[0][0].account);

  // const proposals = await getProposalsByGovernance(connection, realm.owner, owner);

  // console.log(proposals);

  // fetch dao's
  const realms = await getRealms(connection, [new PublicKey(GOVERNANCE_PROGRAM_ID)]);
  console.log(realms.filter((fl) => fl.account.name === "mumumu"));
};

init();

// const grealm = await getRealm(new Connection(THEINDEX_RPC_ENDPOINT), new PublicKey(collectionAuthority.governance));

const txBatchesToInstructionSetWithSigners = (txBatch, signerBatches, batchIdx) => {
  return txBatch.map((tx, txIdx) => {
    return {
      transactionInstruction: tx,
      signers: typeof batchIdx !== "undefined" && signerBatches.length && signerBatches[batchIdx] && signerBatches[batchIdx][txIdx] ? [signerBatches[batchIdx][txIdx]] : [],
    };
  });
};

const chunks = (array, size) => {
  const result = [];
  let i, j;
  for (i = 0, j = array.length; i < j; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
};
