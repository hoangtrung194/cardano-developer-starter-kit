use aiken/primitive/string
use cardano/transaction.{OutputReference, Transaction}
pub type Redeemer {
  value: ByteArray,
}
pub type Datum{
  value: ByteArray,
}

validator alwayssuccess {
  spend(
    datum: Option<Datum>,
    redeemer: Redeemer,
    _utxo: OutputReference,
    _self: Transaction,
  ){
    expect Some (datum_input) = datum
    let d: Datum=datum_input
    trace @"redeemer": string.from_bytearray(redeemer.value)
    let a = d.value == redeemer.value
    a?
  }
  else (_)
  {
    fail
  }
}


