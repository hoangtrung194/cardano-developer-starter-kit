import { Blockfrost, Lucid, fromText, Crypto, Data, Addresses } from "https://deno.land/x/lucid/mod.ts";

// Provider selection
const lucid = new Lucid({
    provider: new Blockfrost(
        "https://cardano-preview.blockfrost.io/api/v0",
        "previewUdFlstN78hghk557Pjxs2v9UJii2rE6j"
    ),
});

const seed = "motor autumn february legend tell cake invite wool era crystal nothing tail climb praise trigger gold neck scrub expand boss example sponsor topple barrel";
lucid.selectWalletFromSeed(seed, { addressType: "Base", index: 0 });
const address = await lucid.wallet.address();
console.log(`Ví: ${address}`);

// Script và Datum
const alwaysSucceed_scripts = lucid.newScript({
    type: "PlutusV3",
    script: "58af01010029800aba2aba1aab9faab9eaab9dab9a48888896600264653001300700198039804000cc01c0092225980099b8748008c01cdd500144c8cc896600266e1d2000300a375400d13232598009808001456600266e1d2000300c375400713371e6eb8c03cc034dd5180798069baa003375c601e601a6ea80222c805a2c8070dd7180700098059baa0068b2012300b001300b300c0013008375400516401830070013003375400f149a26cac80081",
});
const alwaysSucceedAddress = alwaysSucceed_scripts.toAddress();
console.log(`Địa chỉ Always Succeed: ${alwaysSucceedAddress}`);

// Datum và Redeemer Schema
const DatumSchema = Data.Object({
    msg: Data.Bytes,
});
const RedeemerSchema = Data.Object({
    msg: Data.Bytes,
});

// Tạo Datum và Redeemer
const Datum = () => Data.to({ msg: fromText("Do Hoang Trung") }, DatumSchema);
const Redeemer = () => Data.to({ msg: fromText("Do Hoang Trung") }, RedeemerSchema);

// Lệnh khóa UTXO (ADA + Token)
export async function lockUtxo(lovelace: bigint, unit: string, amount: bigint): Promise<string> {
    const tx = await lucid
        .newTx()
        .payToContract(alwaysSucceedAddress, Datum(), { lovelace, [unit]: amount }) // Khóa ADA và Token
        .commit();
    const signedTx = await tx.sign().commit();
    console.log(signedTx);

    const txHash = await signedTx.submit();
    return txHash;
}

// Lệnh mở khóa UTXO
export async function unlockUtxo(redeemer: RedeemerSchema): Promise<string> {
    const utxo = (await lucid.utxosAt(alwaysSucceedAddress)).find((utxo) =>
        !utxo.scriptRef &&
        utxo.datum &&
        JSON.stringify(utxo.datum) === JSON.stringify(redeemer) // Đảm bảo rằng Datum và Redeemer tương ứng
    );
  
    console.log(`Redeemer: ${redeemer}`);
    console.log(`UTxO unlock: ${utxo}`);
  
    if (!utxo) throw new Error("Không tìm thấy UTxO phù hợp");
    const tx = await lucid
        .newTx()
        .collectFrom([utxo], Redeemer())  // Thu thập từ UTxO với Redeemer
        .attachScript(alwaysSucceed_scripts)
        .commit();
  
    const signedTx = await tx.sign().commit();
    const txHash = await signedTx.submit();
    console.log(txHash);
    return txHash;
}

// Chức năng tạo mint token
const tokenName = "BK03:118";
async function mintToken(policyId: string, tokenName: string, amount: bigint, slot_in: bigint) {
    const unit = policyId + fromText(tokenName);
    const metadata = {
        [policyId]: {
            [tokenName]: {
                "description": "Token cuối khóa BK03",
                "name": `${tokenName}`,
                "id": 1,
                "image": "ipfs://QmRE3Qnz5Q8dVtKghL4NBhJBH4cXPwfRge7HMiBhK92SJX",
            }
        }
    };

    const tx = await lucid.newTx()
        .mint({ [unit]: amount })
        .validTo(Date.now() + 2000000)
        .attachMetadata(721, metadata)
        .attachScript(await createMintingScripts(slot_in))  
        .commit();
    
    return tx;
}

// Tạo minting scripts
async function createMintingScripts(slot_in: bigint) {
    const { payment } = Addresses.inspect(await lucid.wallet.address());
    const mintingScripts = lucid.newScript({
        type: "All",
        scripts: [
            { type: "Sig", keyHash: payment.hash },
            { type: "Before", slot: slot_in },
        ],
    });
    return mintingScripts;
}

// Hiển thị tài sản ví
export async function showAssets() {
    const address = await lucid.wallet.address();
    const utxos = await lucid.wallet.getUtxos();

    let adaBalance = 0n;
    const tokens: Record<string, bigint> = {};

    for (const utxo of utxos) {
        adaBalance += utxo.assets.lovelace; // ADA tính bằng lovelace
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

    console.log(`Tài sản tại ví ${address}:`);
    console.log(`- ADA: ${adaBalance / 1_000_000n} ₳`);

    for (const [unit, amount] of Object.entries(tokens)) {
        console.log(`- Token: ${unit} | Số lượng: ${amount}`);
    }
}

// Hàm main
async function main() {
    try {
        const lovelace_lock = 50_100_118n; // Số ADA cần khóa
        const currentSlot = await lucid.getSlot();
        const slot_in = currentSlot + 60n; // 60 slot tiếp theo
         // Slot thích hợp

        // Mint token (Ví dụ mint token BK03:118)
        const policyId = "your_policy_id";  // ID chính sách của bạn
        const tx = await mintToken(policyId, tokenName, 500_000_118n, slot_in);
        console.log(`Tx Mint Token: ${tx}`);

        // Khóa ADA và Token
     //   const lockTxHash = await lockUtxo(lovelace_lock, "BK03:118", 500_000_118n);
       // console.log(`Tx khóa tài sản: ${lockTxHash}`);

        // Mở khóa tài sản (ví dụ sử dụng redeemer)
        //const unlockTxHash = await unlockUtxo(Redeemer());
        //console.log(`Tx mở khóa tài sản: ${unlockTxHash}`);

        // Hiển thị tài sản ví
        //showAssets();
    } catch (error) {
        console.error("Lỗi:", error);
    }
}

// Chạy main
await main();
