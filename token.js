require("dotenv").config();
const {
  createMint,
  getOrCreateAssociatedTokenAccount,
  getMint,
  getAccount,
  mintTo,
  TOKEN_PROGRAM_ID,
  AccountLayout,
  transfer,
  createBurnInstruction,
  createFreezeAccountInstruction,
  createCloseAccountInstruction,
  createMultisig,
} = require("@solana/spl-token");
const { clusterApiUrl, Connection, Keypair, PublicKey, sendAndConfirmTransaction, Transaction } = require("@solana/web3.js");
const bs58 = require("bs58");

const payer = Keypair.fromSecretKey(bs58.decode(process.env.SECRET_KEY));

const mintAuthority = payer;

const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

const mintInit = async () => {
  const mint = await createMint(
    connection,
    payer, // Account that will control the minting
    mintAuthority.publicKey, // Account that will control the freezing of the token
    mintAuthority.publicKey,
    9 // We are using 9 to match the CLI decimal default exactly // for nft = 0
  );

  console.log("1", mint.toBase58());

  const mintInfo = await getMint(connection, mint);

  console.log("2", mintInfo.supply);

  const tokenAccount = await getOrCreateAssociatedTokenAccount(connection, payer, mint, payer.publicKey);

  console.log("3", tokenAccount.address.toBase58());

  const tokenAccountInfo = await getAccount(connection, tokenAccount.address);

  console.log("4", tokenAccountInfo.amount);

  await mintTo(
    connection,
    payer,
    mint,
    tokenAccount.address,
    mintAuthority,
    100000000000 // because decimals for the mint are set to 9  // for nft = 1
  );

  const mintInfo2 = await getMint(connection, mint);

  const toTokenAccount = await getOrCreateAssociatedTokenAccount(connection, payer, mint, new PublicKey("2vnr3zoMbWaKE5xpskTgmufH4aT5NQiikji9ngqGcxTe"));

  console.log("5", mintInfo2.supply);
  // // 100

  await transfer(connection, payer, tokenAccount.address, toTokenAccount.address, payer.publicKey, 50000000000);
  // 100
};

const getTokensWithAccount = async () => {
  const tokenAccounts = await connection.getTokenAccountsByOwner(payer.publicKey, {
    programId: TOKEN_PROGRAM_ID,
  });

  console.log("Token                                         Balance");
  console.log("------------------------------------------------------------");
  tokenAccounts.value.forEach((tokenAccount) => {
    const accountData = AccountLayout.decode(tokenAccount.account.data);
    console.log(`${new PublicKey(accountData.mint)}   ${accountData.amount}`);
  });
};

// programId: PublicKey,
// mint: PublicKey,
// account: PublicKey,
// owner: PublicKey,
// multiSigners: Array<Signer>,
// amount: number | u64,

// getTokensWithAccount();

// 2vnr3zoMbWaKE5xpskTgmufH4aT5NQiikji9ngqGcxTe

// CNPUD4dE3kNueEyXLWWPkZhPHemX973GWg9ncv2uTMbq
// 7DcKDF1YzpWbXuDDzV1StRQKEZijw2fnJWVf7ypWLKGL

// account, mint, owner, amount, multiSigners = [], programId = constants_js_1.TOKEN_PROGRAM_ID
const burncommand = async () => {
  const ix = await createBurnInstruction(
    new PublicKey("7DcKDF1YzpWbXuDDzV1StRQKEZijw2fnJWVf7ypWLKGL"),
    new PublicKey("CNPUD4dE3kNueEyXLWWPkZhPHemX973GWg9ncv2uTMbq"),
    payer.publicKey,
    [],
    25000000000,
    TOKEN_PROGRAM_ID
  );

  const tx = new Transaction();
  tx.add(ix);

  const txid = await sendAndConfirmTransaction(connection, tx, [payer]);
  console.log(txid);
};
// programId: PublicKey,
// account: PublicKey,
// dest: PublicKey,
// authority: PublicKey,
// multiSigners: Array<Signer>,
// account, mint, authority, multiSigners = [], programId = constants_js_1.TOKEN_PROGRAM_ID

//BfTdrxNr6SxSyMdFEsrSPjN2LdcCAVMH2CcMJUYYiMn9
//9nbwSEkvWpPndRovnFzhPyLYPcz7DWLZDryoMfANowuu
const freezeAccountCommand = async () => {
  const ix = await createFreezeAccountInstruction(
    new PublicKey("5PrM381tiagAU5AMmQg4s8Xo8mpiASn5rcdzxCKFguYQ"),
    new PublicKey("BfTdrxNr6SxSyMdFEsrSPjN2LdcCAVMH2CcMJUYYiMn9"),
    payer.publicKey,
    [],
    TOKEN_PROGRAM_ID
  );

  const tx = new Transaction();
  tx.add(ix);

  const txid = await sendAndConfirmTransaction(connection, tx, [payer]);
  console.log(txid);
};

/**
 * Construct a CloseAccount instruction
 *
 * @param account      Account to close
 * @param destination  Account to receive the remaining balance of the closed account
 * @param authority    Account close authority
 * @param multiSigners Signing accounts if `authority` is a multisig
 * @param programId    SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
const closeAccountCommand = async () => {
  const ix = await createCloseAccountInstruction(new PublicKey("5PrM381tiagAU5AMmQg4s8Xo8mpiASn5rcdzxCKFguYQ"), payer.publicKey, payer.publicKey, [], TOKEN_PROGRAM_ID);

  const tx = new Transaction();
  tx.add(ix);

  const txid = await sendAndConfirmTransaction(connection, tx, [payer]);
  console.log(txid);
};

const createMultiSig = async () => {
  const signer1 = Keypair.generate();
  const signer2 = Keypair.generate();
  const signer3 = Keypair.generate();

  const multisigKey = await createMultisig(connection, payer, [signer1.publicKey, signer2.publicKey, signer3.publicKey], 2);

  console.log(multisigKey);

  const mint = await createMint(connection, payer, multisigKey, multisigKey, 9);
  console.log("1", mint.toBase58());
  const associatedTokenAccount = await getOrCreateAssociatedTokenAccount(connection, payer, mint, signer1.publicKey);
  console.log("2", associatedTokenAccount.address.toBase58());
};

// mintInit();
createMultiSig();
