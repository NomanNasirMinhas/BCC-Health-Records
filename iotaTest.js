async function test() {
  const { ClientBuilder } = require("@iota/client");
  const { performance } = require("perf_hooks");
  const client = new ClientBuilder().build();
  const Iota = require("@iota/core");
  const Converter = require("@iota/converter");
  const node = "https://nodes.devnet.iota.org:443";
//   const node = getNode();
  const iota = Iota.composeAPI({
    provider: node,
  });
  const seed =
'PUEOTSEITFEVEWCWBTSIZM9NKRGJEIMXTULBACGFRQK9IMGICLBKW9TTEVSDQMGWKBXPVCBMMCXWMNPDX';
  const address =
  'HEQLOWORLDHELLOWORLDHELLOWORLDHELLOWORLDHELLOWORLDHELLOWORLDHELLOWORLDHELLOWOR99D';
  const depth = 3;
  const minimumWeightMagnitude = 9;
  const messageInTrytes = Converter.asciiToTrytes("messageInTrytes");
  const transfers = [
    {
      value: 0,
      address: address,
      message: messageInTrytes,
    },
  ];

  
  console.log("Adding DataSet to DLT");
  let t0 = performance.now();
  for (var i = 0; i < 10; i++) {
    // await client.message().submit();
    // console.log(messageId);
    await iota
      .prepareTransfers(seed, transfers)
      .then((trytes) => {
        return iota.sendTrytes(trytes, depth, minimumWeightMagnitude);
      })
      .then((bundle) => {
        // addTransaction(dbo, address, bundle[0].hash, type);
        console.log("OK")
      })
      .catch((err) => {
        console.error(err);
      });
  }
  let t1 = performance.now();
  console.log("Added DataSet to DLT");

  console.log(`Time Taken ${t1 - t0}`);
}

test();
