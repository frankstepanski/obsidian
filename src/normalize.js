// Normalizes responses using the query object from destructure and the response object from
// the graphql request
export default function normalizeResult(queryObj, resultObj, deleteFlag) {
  // Object to hold normalized obj
  const result = {};

  // checks if there is a delete mutation
  if (deleteFlag) {
    //creates the ROOT_MUTATION hash that is being deleted
    result['ROOT_MUTATION'] = createRootQuery(
      queryObj.mutations,
      resultObj,
      deleteFlag
    );

    //iterate thru the different response objects that were mutated

    const obj = resultObj.data;
    //checks if the current element is an array
    if (Array.isArray(obj)) {
      //iterates thru the array of objects and stores the hash in the result object with 'DELETE' as value
      obj.forEach((ele) => {
        const mutationKeys = Object.keys(ele);
        const id =
          ele[mutationKeys[0]].id ||
          ele[mutationKeys[0]].ID ||
          ele[mutationKeys[0]]._id ||
          ele[mutationKeys[0]]._ID ||
          ele[mutationKeys[0]].Id ||
          ele[mutationKeys[0]]._Id;
        const hash = ele[mutationKeys[0]].__typename + '~' + id;
        result[hash] = 'DELETED';
      });
    } else {
      //else stores the hash in the result object with the value 'DELETE'
      const mutationKeys = Object.keys(obj);

      const id =
        obj[mutationKeys[0]].id ||
        obj[mutationKeys[0]].ID ||
        obj[mutationKeys[0]]._id ||
        obj[mutationKeys[0]]._ID ||
        obj[mutationKeys[0]].Id ||
        obj[mutationKeys[0]]._Id;
      const hash = obj[mutationKeys[0]].__typename + '~' + id;
      result[hash] = 'DELETED';
    }
  }

  // creates a stringified version of query request and stores it in ROOT_QUERY key
  else if (queryObj.queries || queryObj.mutations) {
    if (queryObj.queries) {
      result['ROOT_QUERY'] = createRootQuery(queryObj.queries, resultObj);
    } else {
      result['ROOT_MUTATION'] = createRootQuery(queryObj.mutations, resultObj);
    }
    for (const curr in resultObj.data) {
      if (!Array.isArray(resultObj.data[curr])) {
        const hashObj = createHash(resultObj.data[curr]);
        for (const hash in hashObj) {
          if (result[hash]) {
            Object.assign(result[hash], hashObj[hash]);
          } else {
            result[hash] = hashObj[hash];
          }
        }
      } else {
        for (let i = 0; i < resultObj.data[curr].length; i++) {
          // pass current obj to createHash function to create  obj of hashes
          const hashObj = createHash(resultObj.data[curr][i]);
          // check if the hash object pair exists, if not create new key value pair
          // if it does exist merge the hash pair with the existing key value pair
          for (const hash in hashObj) {
            if (result[hash]) {
              Object.assign(result[hash], hashObj[hash]);
            } else {
              result[hash] = hashObj[hash];
            }
          }
        }
      }
    }
  }

  return result;
}

// creates the hashes for query requests and stores the reference has that will be stored in result
function createRootQuery(queryObjArr, resultObj) {
  const output = {};
  queryObjArr.forEach((query) => {
    const name = query.name;
    const args = query.arguments;
    const queryHash = name + args;

    // iterate thru the array of current query response
    // and store the hash of that response in an array
    const result = resultObj.data[name];
    if (Array.isArray(result)) {
      const arrOfHashes = [];
      result.forEach((obj) => {
        const id = obj.id || obj.ID || obj._id || obj._ID || obj.Id || obj._Id;
        arrOfHashes.push(obj.__typename + '~' + id);
      });
      //store the array of hashes associated with the queryHash
      output[queryHash] = arrOfHashes;
    } else {
      const id =
        result.id ||
        result.ID ||
        result._id ||
        result._ID ||
        result.Id ||
        result._Id;
      output[queryHash] = result.__typename + '~' + id;
    }
  });

  return output;
}

//returns a hash value pair of each response obj passed in
function createHash(obj, output = {}) {
  const id = obj.id || obj.ID || obj._id || obj._ID || obj.Id || obj._Id;
  //create hash
  const hash = obj.__typename + '~' + id;

  //if output doesnt have a key of hash create a new obj with that hash key
  if (!output[hash]) output[hash] = {};
  // iterate thru the fields in the current obj and check whether the current field
  // is __typename, if so continue to the next iteration
  for (const field in obj) {
    if (field === '__typename') continue;
    //check whether current field is not an array
    if (!Array.isArray(obj[field])) {
      //check whether current field is an object
      if (typeof obj[field] === 'object' && obj[field] !== null) {
        const id =
          obj[field].id ||
          obj[field].ID ||
          obj[field]._id ||
          obj[field]._ID ||
          obj[field].Id ||
          obj[field]._Id;
        output[hash][field] = obj[field].__typename + '~' + id;
        output = createHash(obj[field], output);
      } else {
        output[hash][field] = obj[field];
      }
    } // if it's an array of objects, iterate thru the array
    // create a hash for each obj in the array and store it in an array
    // recursive call on the current obj in the array
    // store the output of the recursive call in output
    else {
      output[hash][field] = [];
      obj[field].forEach((obj) => {
        const id = obj.id || obj.ID || obj._id || obj._ID || obj.Id || obj._Id;
        const arrayHash = obj.__typename + '~' + id;
        output[hash][field].push(arrayHash);
        output = createHash(obj, output);
      });
      // store hashed values in output
    }
  }
  return output;
}
