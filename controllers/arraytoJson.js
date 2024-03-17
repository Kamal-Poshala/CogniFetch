const atoj = (data) => {
  const obj = {};
  let count = 0;
  let arr = [];
  for (x of data) {
    arr[count] = { id: count, concept: x, checked: true };
    count++;
  }

  obj["concepts"] = arr;
  console.log(obj);
  obj.concepts.map((d) => {
    console.log(d);
  });
  return obj;
};

const dta = ["hello", "this", "is", "the"];
atoj(dta);

module.exports = atoj;

/* 
{
  "concepts":[
    { id: count, concept: x, checked: true },
    { id: count, concept: x, checked: true }
    
  ]
} */
