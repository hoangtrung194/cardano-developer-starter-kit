import { Blockfrost, Lucid, fromText, Crypto, Data } from "https://deno.land/x/lucid/mod.ts";

// Provider selection
// There are multiple builtin providers you can choose from lucid

// Blockfrost

const lucid = new Lucid({
    provider: new Blockfrost(
        "https://cardano-preview.blockfrost.io/api/v0",
        "previewUdFlstN78hghk557Pjxs2v9UJii2rE6j"
    ),
});

console.log(lucid);
const seed = "motor autumn february legend tell cake invite wool era crystal nothing tail climb praise trigger gold neck scrub expand boss example sponsor topple barrel"
lucid.selectWalletFromSeed(seed, { addressType: "Base", index: 0 });
const address = await lucid.wallet.address();
console.log(`Dia chi vi gui: ${ address }`);
const alwaysSucceed_scripts = lucid.newScript({
    type: "PlutusV3",
    script: "588501010029800aba2aba1aab9faab9eaab9dab9a48888896600264653001300700198039804000cc01c0092225980099b8748008c01cdd500144c8cc896600266e1d2000300a375400d132325980098080014528c5900e1bae300e001300b375400d16402460160026016601800260106ea800a2c8030600e00260066ea801e29344d9590011",
});

const alwaysSucceedAddress = alwaysSucceed_scripts.toAddress();
console.log(`Always succeed address: ${ alwaysSucceedAddress }`);
const Datumn = () => Data.void();

const RedeemerSchema = Data.Object({
    msg: Data.Bytes,
});
const Redeemer = () => Data.to({ msg: fromText("Hello") }, RedeemerSchema);
const lovelace_lock = 118_000_000n
console.log(`Lovelace lock: ${ lovelace_lock }`);
export async function lockUtxo(lovelace: bigint): Promise<string> {
    const tx = await lucid
        .newTx()
        .payToContract(alwaysSucceedAddress, { Inline: Datumn() }, { lovelace })
        .commit();
    const signedTx = await tx.sign().commit();
    console.log(signedTx);

    const txHash = await signedTx.submit();
    

    return txHash;
}
export async function unlockUtxo(lovelace: bigint): Promise<string> {
    const utxo = (await lucid.utxosAt(alwaysSucceedAddress)).find((utxo) =>
        utxo.assets.lovelace >= lovelace && !utxo.scriptRef
    );
    console.log(await lucid.utxosAt(alwaysSucceedAddress));
    if (!utxo) throw new Error("No UTxO with lovelace > 1000 found");
    const tx = await lucid
        .newTx()
        .collectFrom([utxo], Redeemer())
        .attachScript(alwaysSucceed_scripts)
       // .payTo("addr_test1qzldl9u0j6ap7mdugtdcre43f8dfrnv7uqd3a6furpyuzw3z70zawv8g3tyg7uh833x50geeul2vpyujyzac0d6dmgcsyu5akw",{lovelace:118_000_000n})
        .payTo(await lucid.wallet.address(),{lovelace:117_000_000n})
        .commit();
    const signedTx = await tx.sign().commit();
    const txHash = await signedTx.submit();
    console.log(txHash);
    return txHash;
}
async function main() {
    try {
      
      //const lockTxHash = await lockUtxo(lovelace_lock);
      //console.log(`Lock transaction hash: ${lockTxHash}`);    
      const unlockTxHash = await unlockUtxo(lovelace_lock);
      console.log(`Unlock transaction hash: ${unlockTxHash}`);
    } catch (error) {
      console.error("Error:", error);
    }
  }
  
await main();