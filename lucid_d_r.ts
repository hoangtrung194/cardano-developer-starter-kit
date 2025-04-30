import { Blockfrost, Lucid, fromText, Crypto, Data, Addresses } from "https://deno.land/x/lucid/mod.ts";

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
console.log(`Dia chi vi gui: ${ address }`);// ket noi vi bang seed phase
const alwaysSucceed_scripts = lucid.newScript({
    type: "PlutusV3",
    script: "58af01010029800aba2aba1aab9faab9eaab9dab9a48888896600264653001300700198039804000cc01c0092225980099b8748008c01cdd500144c8cc896600266e1d2000300a375400d13232598009808001456600266e1d2000300c375400713371e6eb8c03cc034dd5180798069baa003375c601e601a6ea80222c805a2c8070dd7180700098059baa0068b2012300b001300b300c0013008375400516401830070013003375400f149a26cac80081",
});

const alwaysSucceedAddress = alwaysSucceed_scripts.toAddress();
console.log(`Always succeed address: ${ alwaysSucceedAddress }`);
async function createMintingscripts(slot_in:bigint) {
    const { payment } = Addresses.inspect(
        await lucid.wallet.address(),
    );
    const mintingScripts = lucid.newScript(
        {
            type : "All",
            scripts: [
                {type: "Sig" ,keyHash: payment.hash},
                {
                    type: "Before",
                    slot: slot_in,
                },
            ],
        },
    ) ;
    return mintingScripts;
}

  
  
  export async function showAssets() {
    const address = await lucid.wallet.address();
    const utxos = await lucid.wallet.getUtxos();
  
    let adaBalance = 0n;
    const tokens: Record<string, bigint> = {};
  
   
    for (const utxo of utxos) {
      adaBalance += utxo.assets.lovelace; 
      for (const [unit, amount] of Object.entries(utxo.assets)) {
        if (unit !== "lovelace") {
          if (!tokens[unit]) {
            tokens[unit] = amount;
          } else {
            tokens[unit] += amount;
          }
        }
      }
    }
  
    // Hiển thị tài sản
    console.log(`Tài sản tại ví ${address}:`);
    console.log(`- ADA: ${adaBalance / 1_000_000n} ₳`);
  
    for (const [unit, amount] of Object.entries(tokens)) {
      console.log(`- Token: ${unit} | Số lượng: ${amount}`);
    }
  }
  
const tokenName="BK03:118";
async function mintTonken(policyId: string,tokenName: string, amount: bigint, slot_in:bigint){
    const unit = policyId + fromText(tokenName);
    const metadata= {
        [policyId]: {
            [tokenName]:{
                "description": "Token cuoi khoa BK03",
                "name" : `${tokenName}`,
                "id":1,
                "image": "ipfs://QmRE3Qnz5Q8dVtKghL4NBhJBH4cXPwfRge7HMiBhK92SJX" 
                
            }
        }
    };
    console.log(metadata);
    const tx = await lucid.newTx()
    .mint({  [unit]: amount })
    .validTo(Date.now() + 2000000)
    .attachScript(await createMintingscripts(slot_in))  
    .attachMetadata(721, metadata)
    .commit()

    return tx;
}
//const slot_in = BigInt(79187367) //BigInt(lucid.utils.unixTimeToSlots(Date.now()));
//console.log(`Slot: ${slot_in}`);
//const mintingScripts = await createMintingscripts(slot_in);
//const policyId = mintingScripts.toHash()
//console.log(`Ma chinh sach : ${policyId}`);
//const tx = await mintTonken(policyId, "BK03:118", 500_000_118n, slot_in);
//let signedtx = await tx.sign().commit();
//let txHash = await signedtx.submit();
//console.log(`${txHash}`);
const DatumSchema = Data.Object({
msg: Data.Bytes,
});
const RedeemerSchema = Data.Object({
    msg: Data.Bytes,
});
const Datum = () => Data.to({ msg: fromText("Do Hoang Trung")},DatumSchema);
console.log("Datum: ",Datum());
const Redeemer = () => Data.to({ msg: fromText("Do Hoang Trung")},RedeemerSchema);
const lovelace_lock =  50_100_118n
console.log(`Lovelace lock: ${ lovelace_lock }`);
export async function lockUtxo(lovelace: bigint, unit : string ,amount: bigint ): Promise<string> {
    const tx = await lucid
        .newTx()
        .payToContract(alwaysSucceedAddress, { Inline: Datum() }, { lovelace, [unit] : amount})
        .commit();
    const signedTx = await tx.sign().commit();
    console.log(signedTx);

    const txHash = await signedTx.submit();
    

    return txHash;
}
export async function unlockUtxo(redeemer : RedeemerSchema): Promise<string> {
    const utxo = (await lucid.utxosAt(alwaysSucceedAddress)).find((utxo) =>
        !utxo.scriptRef && utxo.datum == redeemer
    );
    console.log(`redeemer: ${redeemer}`);
    console.log(`UTxO unlock: ${utxo}`);
    console.log(utxo);
    if (!utxo) throw new Error("No UTxO with found");
    const tx = await lucid
        .newTx()
        .collectFrom([utxo], Redeemer())
        .attachScript(alwaysSucceed_scripts)
        .commit();
    const signedTx = await tx.sign().commit();
    const txHash = await signedTx.submit();
    console.log(txHash);
    return txHash;
}

async function main() {
    try {
      
      

      //const slot_in = BigInt(80000000)  //BigInt(lucid.utils.unixTimeToSlots(Date.now()));
      //console.log(`Slot: ${slot_in}`);
      //const mintingScripts = await createMintingscripts(slot_in);
     // const policyId = mintingScripts.toHash()
      //console.log(`Ma chinh sach : ${policyId}`);
      const policyId = "d1bbcb7f569d9aac34b6ef95fcc88af310a1a92280ded72628d62776"; 
const tokenName = "BK03:118";  
const unit = policyId + fromText(tokenName); 
const amount = 118n; 

console.log(`Unit: ${unit}`);
console.log(`Amount: ${amount}`);


      const tx = await mintTonken(policyId, "BK03:118", 500n, slot_in);
     let signedtx = await tx.sign().commit();
      let txHash = await signedtx.submit();
     console.log(`${txHash}`);
     const lockTxHash = await lockUtxo(lovelace_lock, unit, amount);
     console.log(`Lock transaction hash: ${lockTxHash}`);    
  const unlockTxHash = await unlockUtxo(Redeemer());
     console.log(`Unlock transaction hash: ${unlockTxHash}`);
    showAssets();
   const utxos = await lucid.utxosAt(alwaysSucceedAddress);
   
   console.log(utxos);





   
    } catch (error) {
      console.error("Error:", error);
    }
}
  
await main();