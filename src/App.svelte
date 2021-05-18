<svelte:head>
  <link rel="stylesheet" href="https://unpkg.com/@carbon/charts/styles.min.css" />
</svelte:head>

<script>
  export let name;
  import { v4 as uuidv4 } from "uuid";
  import { LineChart } from "@carbon/charts-svelte";
  import { raw_data } from "./stores/raw_data.js";
  import { bcc_data } from "./stores/bcc_data.js";
  let chart_data = []
  const unsubscribe = bcc_data.subscribe(value => {
		chart_data = value;
	});

  let raw_data_local = [];
  let clean_data = [];
  import {} from "node:process";
  let crypto = require("crypto");
  let curves = crypto.getCurves();
  console.log("Curves ", curves);
  let ciphers_list = crypto.getCiphers();
  console.log("Ciphers ", ciphers_list);
  const Web3 = require("web3");
  const mongodb = require("mongodb").MongoClient;
  const contract = require("truffle-contract");
  const artifacts = require("./../build/contracts/Inbox.json");
  const uri =
    "mongodb://localhost:27017/?readPreference=primary&appname=MongoDB%20Compass&ssl=false";
  const IPFS = require("ipfs-api");
  const ipfs = IPFS({ host: "ipfs.infura.io", port: 5001, protocol: "https" });
  if (typeof web3 !== "undefined") {
    var web3 = new Web3(web3.currentProvider);
  } else {
    var web3 = new Web3(
      new Web3.providers.HttpProvider("http://localhost:7545")
    );
  }
  const LMS = contract(artifacts);
  LMS.setProvider(web3.currentProvider);


  //Flags
  let processing = false;
  let genralized = false;
  let translated = false;
  let nonce = null;

  //Data
  let user_id = [1, 2, 3, 4, 5, 6];
  let diagnosis = ["HIV", "Flu", "Gastritis", "Pneumonia"];
  let genders = ["Male", "Female"];

  //Selected Data
  let selected_user_id = user_id[0];
  let selected_age = 0;
  let selected_gender = genders[0];
  let selected_zip_code = 0;
  let selected_diagnosis = diagnosis[0];

  //Generalized Data
  let gen_user_id = null;
  let gen_age = null;
  let gen_gender = null;
  let gen_zip_code = null;
  let gen_diagnosis = [];

  //Groups
  let user_groups = [
    { id: 1, label: "1,2,3" },
    { id: 2, label: "4,5,6" },
  ];
  let age_groups = [
    { id: 1, label: "22-35" },
    { id: 2, label: "40-55" },
  ];

  //Genralization Function
  function generalize() {
    genralized = false;
    gen_diagnosis = [];
    nonce = null;
    //UID
    if (
      Number.parseInt(selected_user_id) >= 1 &&
      Number.parseInt(selected_user_id) <= 3
    )
      gen_user_id = user_groups[0].label;
    else if (
      Number.parseInt(selected_user_id) >= 4 &&
      Number.parseInt(selected_user_id) <= 6
    )
      gen_user_id = user_groups[1].label;

    //Age
    gen_age = `${Number.parseInt(selected_age)- getRndInteger(5,10)}-${Number.parseInt(selected_age)+getRndInteger(5,10)}` 

    //Gender
    gen_gender = selected_gender;

    //ZipCode
    let len = selected_zip_code.length - 2;
    gen_zip_code = selected_zip_code.toString();
    gen_zip_code = gen_zip_code.substr(0, 2);
    for (var i = 0; i < len; i++) {
      gen_zip_code.concat("*");
    }

    //Diagnosis
    if (selected_diagnosis == diagnosis[0]) {
      gen_diagnosis = [...gen_diagnosis, diagnosis[0]];
      gen_diagnosis = [...gen_diagnosis, diagnosis[1]];
      gen_diagnosis = [...gen_diagnosis, diagnosis[3]];
      gen_diagnosis = shuffle_array(gen_diagnosis);
      nonce = getNonce(diagnosis[0],gen_diagnosis);
    } else if (
      selected_diagnosis == diagnosis[1]
    ) {
      gen_diagnosis = [...gen_diagnosis, diagnosis[1]];
      gen_diagnosis = [...gen_diagnosis, diagnosis[0]];
      gen_diagnosis = [...gen_diagnosis, diagnosis[2]];
      gen_diagnosis = shuffle_array(gen_diagnosis);
      nonce = getNonce(diagnosis[1],gen_diagnosis);
    } else if (
      selected_diagnosis == diagnosis[2]
    ) {
      gen_diagnosis = [...gen_diagnosis, diagnosis[2]];
      gen_diagnosis = [...gen_diagnosis, diagnosis[1]];
      gen_diagnosis = [...gen_diagnosis, diagnosis[3]];
      gen_diagnosis = shuffle_array(gen_diagnosis);
      nonce = getNonce(diagnosis[2],gen_diagnosis);

    } else if (
      selected_diagnosis == diagnosis[3]
    ) {
      gen_diagnosis = [...gen_diagnosis, diagnosis[3]];
      gen_diagnosis = [...gen_diagnosis, diagnosis[0]];
      gen_diagnosis = [...gen_diagnosis, diagnosis[2]];
      gen_diagnosis = shuffle_array(gen_diagnosis);
      nonce = getNonce(diagnosis[3],gen_diagnosis);
    }  else {
      alert("No Genralization Scheme for Current Selection");
    }
    // console.log(gen_diagnosis)
    genralized = true;
  }

  function getRndInteger(min, max) {
  return Math.floor(Math.random() * (max - min) ) + min;
}

  function getNonce(position, array){
    let ind = array.indexOf(position);
    ind = ind*ind;
    return ind
  }
  function shuffle_array(array){
    var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
  }

  async function add_record() {
    let t0 = performance.now();
    let data = {
      uid: gen_user_id,
      age: gen_age,
      gender: gen_gender,
      zip: gen_zip_code,
      diagnosis: gen_diagnosis,
      nonce: nonce
    };
    data = JSON.stringify(data);
    await add_to_blockchain(data);
  }
  //Express Functions
  function add_to_mongo_db(data) {
    mongodb.connect(uri, { useUnifiedTopology: true }, async (err, client) => {
      if (err) console.error(err);
      else {
        try {
          const dbe = client.db("medical_records_bcc");
          let dbobj = dbe.collection("records");
          dbobj.insertOne(data);
        } catch (e) {
          console.log(e);
        }
      }
    });
  }

  async function add_to_blockchain(data) {
    let t0 = performance.now();
    const accounts = await web3.eth.getAccounts();
    const lms = await LMS.deployed();
    let id = uuidv4();
    var buffer = Buffer.from(data, "utf8");
    let ipfsHash = await ipfs.add(buffer);
    let hash = ipfsHash[0].hash;
    lms
      .sendIPFS(id, hash, { from: accounts[0] })
      .then((_hash, _address) => {
        let t1 = performance.now();
        bcc_data.update(v=> [...v, {
          "group": "Add To Blockchain",
          "key": hash,
          "value": t1-t0
        }])
        add_to_mongo_db({ id, hash });
        console.log("Inserted to Blockchain with hash = ", hash);
      })
      .catch((err) => {
        res
          .status(500)
          .json({ status: "Failed", reason: "Upload error occured" });
      });
  }

  async function get_raw_data() {
    raw_data_local = []
    mongodb.connect(uri, { useUnifiedTopology: true }, async (err, client) => {
      if (err) console.error(err);
      else {
        try {
          const dbe = client.db("medical_records_bcc");
          // let dbobj = dbe.collection("records");
          let mongo_data = await dbe.collection("records").find({}).toArray();
          console.log("mongo Data = ", mongo_data);
          const lms = await LMS.deployed();
          const accounts = await web3.eth.getAccounts();
          mongo_data.map((value, i) => {
            let t0 = performance.now();
            lms.getHash(value.id, { from: accounts[0] }).then(async (hash) => {
              let data = await ipfs.files.get(hash);
              data = data[0].content.toString();
          // console.log("ipfs Data = ", data);
              raw_data_local = [...raw_data_local, JSON.parse(data)];
              let t1 = performance.now();
              bcc_data.update(v=> [...v, {
              "group": "Fetch From Blockchain",
              "key": value.hash,
              "value": t1-t0
            }])
            });
          });
        } catch (e) {
          console.log(e);
        }
      }
    });
  }

  function clean_data_fn() {
    clean_data = []
    raw_data_local.map((v, i) => {
      let n = Number.parseInt(v.nonce);
      clean_data = [...clean_data, {gender:v.gender, disease: v.diagnosis[Math.sqrt(n)]}];
    });
  }
</script>

<main>
  <div class="container">
    <h1>Private Health Data Collection using Blockchain</h1>
    <h3>Waseeqa Ghazanfer</h3>
    <h3>Noman Nasir Minhas</h3>
  </div>
  <div>
    <div style="width: 45%; display: inline-block;">
      <div class="actor-container">
        <h2>Add A Record</h2>
        <label>Please Select Your User ID</label>
        <select bind:value={selected_user_id}>
          {#each user_id as u_id}
            <option value={u_id}>
              {u_id}
            </option>
          {/each}
        </select>
        <label>Please Select Your Gender</label>
        <select bind:value={selected_gender}>
          {#each genders as gender}
            <option value={gender}>
              {gender}
            </option>
          {/each}
        </select>
        <label>Please Select Diagnosed Disease</label>
        <select bind:value={selected_diagnosis}>
          {#each diagnosis as disease}
            <option value={disease}>
              {disease}
            </option>
          {/each}
        </select>
        <label>Please Enter Your Age (22-55)</label>
        <input bind:value={selected_age} type="number" />
        <label>Please Enter Your Zip Code</label>
        <input bind:value={selected_zip_code} type="number" />
        <button on:click={generalize}>Generalize</button>
      </div>
    </div>
    <div style="width: 45%; display: inline-block;">
      <div class="actor-container" hidden={!genralized}>
        <h2>Generalized Data</h2>
        <label>Generalized User ID: {gen_user_id}</label>
        <label>Generalized Age: {gen_age}</label>
        <label>Generalized Gender: {gen_gender}</label>
        <label>Generalized Zip Code: {gen_zip_code}</label>
        <label
          >Generalized Diagnosis: {gen_diagnosis[0]},{gen_diagnosis[1]},{gen_diagnosis[2]}
        </label>
        <button on:click={add_record}>Add to Blockchain</button>
      </div>
    </div>
  </div>

  <div>
    <div style="width: 45%; display: inline-block;">
      <div class="actor-container">
        <h2>Data Collector</h2>
        <button on:click={get_raw_data}>Get Raw Data</button>
        {#if raw_data_local.length == 0}
          <!-- <p>No </p> -->
        {:else}
          {#each raw_data_local as rec, ind}
            <p>{ind + 1}- UID: {rec.uid}, Diagnosis: {rec.diagnosis}</p>
          {/each}
          <button on:click={clean_data_fn}>Clean Data</button>
        {/if}
      </div>
    </div>

    {#if clean_data.length > 0}
    <div style="width: 45%; display: inline-block;">
      <div class="actor-container">
        <h2>Clean Data</h2>
        {#each clean_data as clean, ind}
          <label>Patient No.{ind+1}- Gender: {clean.gender} has {clean.disease}</label>
        {/each}
      </div>
    </div>
    {/if}
  </div>

  <div>
    <div style="width: 95%; display: inline-block;">
      <div class="actor-container">
        <h2 style="text-align: center;">Performance Graph</h2>
        <LineChart data ={chart_data} options={{
          "title": "Performace Graph",
          "axes": {
            "bottom": {
              "title": "Transaction Hash",
              "mapsTo": "key",
              "scaleType": "labels"
            },
            "left": {
              "mapsTo": "value",
              "title": "Response Time (ms)",
              "scaleType": "linear"
            }
          },
          "height": "400px"
        }}/>
      </div>
    </div>
  </div>
</main>

<style>
  main {
    text-align: center;
    padding: 1em;
    max-width: 240px;
    margin: 0 auto;
  }

  h2 {
    color: #ff3e00;
    text-transform: uppercase;
  }

  h3 {
    color: #283747;
    font-weight: 400;
  }

  .container {
    border-width: 2cm;
    border-color: black;
    border-radius: 30px;
    border: solid;
  }

  h5 {
    margin: auto;
  }

  .actor-container {
    border-width: 2cm;
    border-color: black;
    border-radius: 30px;
    border: solid;
    margin: 20px;
    padding-top: 20px;
    padding-bottom: 20px;
    /* width: 95%; */
    /* height: 400px; */
  }

  @media (min-width: 640px) {
    main {
      max-width: none;
    }
  }
</style>
