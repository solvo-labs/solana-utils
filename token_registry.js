const mpl = require("@metaplex-foundation/mpl-token-metadata");
const web3 = require("@solana/web3.js");
const anchor = require("@project-serum/anchor");
const bs58 = require("bs58");

const INITIALIZE = true;

async function main() {
  console.log("let's name some tokens!");
  const myKeypair = web3.Keypair.fromSecretKey(bs58.decode(process.env.SECRET_KEY));
  const mint = new web3.PublicKey("");

  const seed1 = Buffer.from(anchor.utils.bytes.utf8.encode("metadata"));
  const seed2 = Buffer.from(mpl.PROGRAM_ID.toBytes());

  const seed3 = Buffer.from(mint.toBytes());

  const [metadataPDA, _bump] = web3.PublicKey.findProgramAddressSync([seed1, seed2, seed3], mpl.PROGRAM_ID);
  const accounts = {
    metadata: metadataPDA,
    mint,
    mintAuthority: myKeypair.publicKey,
    payer: myKeypair.publicKey,
    updateAuthority: myKeypair.publicKey,
  };
  const dataV2 = {
    name: "Afc",
    symbol: "Afc",
    // we don't need that
    sellerFeeBasisPoints: 0,
    creators: null,
    collection: null,
    uses: null,
    uri: "",
  };

  let ix;

  if (INITIALIZE) {
    console.log("1");
    const args = {
      createMetadataAccountArgsV3: {
        data: dataV2,
        isMutable: true,
        collectionDetails: null,
      },
    };
    ix = mpl.createCreateMetadataAccountV3Instruction(accounts, args);
  } else {
    const args = {
      updateMetadataAccountArgsV2: {
        data: dataV2,
        isMutable: true,
        updateAuthority: myKeypair.publicKey,
        primarySaleHappened: true,
      },
    };
    ix = mpl.createUpdateMetadataAccountV2Instruction(accounts, args);
  }

  const tx = new web3.Transaction();
  tx.add(ix);
  const connection = new web3.Connection(web3.clusterApiUrl("devnet"), "confirmed");
  const txid = await web3.sendAndConfirmTransaction(connection, tx, [myKeypair]);
  console.log(txid);
}

main();
