const { readFileSync } = require("fs");
//DataSet Generalization
let workclass = ["Private", "Self-emp-not-inc", "Self-emp-inc", "Federal-gov", "Local-gov", "State-gov", "Without-pay", "Never-worked"];
let education = ["Bachelors", "Some-college", "11th", "HS-grad", "Prof-school", "Assoc-acdm", "Assoc-voc", "9th", "7th-8th", "12th", "Masters", "1st-4th", "10th", "Doctorate", "5th-6th", "Preschool"];
let marital_status = ["Married-civ-spouse", "Divorced", "Never-married", "Separated", "Widowed", "Married-spouse-absent", "Married-AF-spouse"];
let occupation = ["Tech-support", "Craft-repair", "Other-service", "Sales", "Exec-managerial", "Prof-specialty", "Handlers-cleaners", "Machine-op-inspct", "Adm-clerical", "Farming-fishing", "Transport-moving", "Priv-house-serv", "Protective-serv", "Armed-Forces"];
let relationship = ["Wife", "Own-child", "Husband", "Not-in-family", "Other-relative", "Unmarried"]
let race = ["White", "Asian-Pac-Islander", "Amer-Indian-Eskimo", "Other", "Black"];
let sex = ["Female", "Male"];
let native_country = ["United-States", "Cambodia", "England", "Puerto-Rico", "Canada", "Germany", "Outlying-US(Guam-USVI-etc)", "India", "Japan", "Greece", "South", "China", "Cuba", "Iran", "Honduras", "Philippines", "Italy", "Poland", "Jamaica", "Vietnam", "Mexico", "Portugal", "Ireland", "France", "Dominican-Republic", "Laos", "Ecuador", "Taiwan", "Haiti", "Columbia", "Hungary", "Guatemala", "Nicaragua", "Scotland", "Thailand", "Yugoslavia", "El-Salvador", "Trinadad&Tobago", "Peru", "Hong", "Holand-Netherlands"];

async function test() {
  const fetch = require("node-fetch");
  const { ClientBuilder } = require("@iota/client");
  const { performance } = require("perf_hooks");
  const client = new ClientBuilder().build();
	    var text = readFileSync('adult2.csv').toString();
      // console.log("File = ", text)
		let arr_res = csvToArray(text);
		let gen_final = []
    arr_res.map((v, i)=>{
     gen_final.push(generalize_datapoint(v));
    });

	console.log("Adding DataSet to DLT")
    let t0 = performance.now();
    for(var i=0; i<gen_final.length; i++){
      const message = await client.message()
        .index('Health Records PoC')
        .data(JSON.stringify(gen_final[i]))
        .submit();

    console.log("TX Hash = ",message.messageId);

    }
    let t1 = performance.now();
    console.log("Added DataSet to DLT");

    console.log(`Time Taken ${t1-t0}`);
}


function csvToArray(str, delimiter = ",") {
  const headers = str.slice(0, str.indexOf("\n")).split(delimiter);
  const rows = str.slice(str.indexOf("\n") + 1).split("\n");
  const arr = rows.map(function (row) {
    const values = row.split(delimiter);
    const el = headers.reduce(function (object, header, index) {
      object[header] = values[index];
      return object;
    }, {});
    return el;
  });
  // return the array
  return arr.slice(0, 10);
}

function generalize_datapoint(data){
    let keys = Object.keys(data);
    let generalized_data = {};
    let nonce_array = {};
    // console.log("Keys = ", keys)
    keys.map((v,i)=>{
      let value = data[v].toString();
      if(value == "?")
      value = "NA"
      let gen_res;
      if (v == "workclass")
      {
        gen_res = generalize_string(value, workclass)
      }
      else if (v == "education")
      {
        gen_res = generalize_string(value, education)
      } 
      else if (v == "marital-status")
      {
        gen_res = generalize_string(value, marital_status)
      } 
      else if (v == "occupation")
      {
        gen_res = generalize_string(value, occupation)
      } 
      else if (v == "relationship")
      {
        gen_res = generalize_string(value, relationship)
      } 
      else if (v == "race")
      {
        gen_res = generalize_string(value, race)
      } 
      else if (v == "sex")
      {
        gen_res = [value, 0]
      } 
      else if (v == "native-country")
      {
        gen_res = generalize_string(value, native_country)
      }
      else{
        gen_res = generalize_number(Number.parseInt(value))
      } 
      nonce_array[v] = gen_res[1];
      generalized_data[v] = gen_res[0];
    });
    generalized_data['nonce'] = nonce_array
    return generalized_data
  }

  function generalize_string(val, arr){
      let gen = [val]
      while (gen.length <=3) {
        let extra = arr[Math.floor(Math.random() * arr.length)];
        if (!gen.includes(extra)){
          gen.push(extra)
        }
      }
      let shuffle = shuffle_array(gen);
      let position = getNonce(val, shuffle);
      return [shuffle, position]
  }

  function generalize_number(val){
    if(val == 0)
    return [0, -1]
    else{
      let start = val - ((val/100)*10);
      let end = val + ((val/100)*10);
      let res = `${start}-${end}`;
      return [res, -1]
    }
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

  function getNonce(position, array){
    let ind = array.indexOf(position);
    ind = ind*ind;
    return ind
  }

test();
