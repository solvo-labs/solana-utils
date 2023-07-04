const mpl = require("@metaplex-foundation/mpl-token-metadata");
const web3 = require("@solana/web3.js");
const anchor = require("@project-serum/anchor");
const bs58 = require("bs58");
require("dotenv").config();

const INITIALIZE = true;

const connection = new web3.Connection(web3.clusterApiUrl("devnet"), "confirmed");

// ref https://github.com/loopcreativeandy/video-tutorial-resources/blob/main/mpl/mpl_tutorial.ts
async function main() {
  const myKeypair = web3.Keypair.fromSecretKey(bs58.decode(process.env.SECRET_KEY));
  const mint = new web3.PublicKey("NxPKnCsptzY622kVny4oQuwV8ThSxoERAhmh8vyH7mX");

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
    name: "deN",
    symbol: "DEN",
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

  const txid = await web3.sendAndConfirmTransaction(connection, tx, [myKeypair]);
  console.log(txid);
}

// https://stackoverflow.com/questions/69900783/how-to-get-metadata-from-a-token-adress-using-web3-js-on-solana
async function getMetadataPDA(mint) {
  const [publicKey] = await web3.PublicKey.findProgramAddress([Buffer.from("metadata"), mpl.PROGRAM_ID.toBuffer(), mint.toBuffer()], mpl.PROGRAM_ID);
  return publicKey;
}

const init = async () => {
  const mint = new web3.PublicKey("NxPKnCsptzY622kVny4oQuwV8ThSxoERAhmh8vyH7mX");

  let pda = await getMetadataPDA(mint);
  let res = await mpl.Metadata.fromAccountAddress(connection, pda);
  console.log(res);
};

init();

// main();
