const { Worker, isMainThread, workerData, parentPort } = require('worker_threads');
const min = 2;
const numWorkers = 4; // Using 4 CPU cores, hardcoded
const max = 1e7;
const sqrtMax = Math.ceil(Math.sqrt(max)); 
let initialPrimes = [];
function generateInitialPrimes(limit) {
  let sieve = new Array(limit + 1).fill(true);
  sieve[0] = sieve[1] = false;
  for (let i = 2; i * i <= limit; i++) {
    if (sieve[i]) {
      for (let j = i * i; j <= limit; j += i) {
        sieve[j] = false;
      }
    }
  }
  return sieve.reduce((primes, isPrime, num) => {
    if (isPrime) primes.push(num);
    return primes;
  }, []);
}
function workerTask(start, end, initialPrimes) {
  let sieve = new Array(end - start).fill(true); // No need for +1, index already points to the right number.
  initialPrimes.forEach(prime => {
    let firstMultiple = prime * Math.ceil(start / prime);
    for (let j = Math.max(firstMultiple, prime * prime); j < end; j += prime) {
      sieve[j - start] = false;
    }
  });
  let primes = [];
  for (let i = 0; i < sieve.length; i++) {
    if (sieve[i]) primes.push(i + start);
  }
  return primes;
}
if (isMainThread) {
  initialPrimes = generateInitialPrimes(sqrtMax);
  const segmentSize = Math.ceil((max - sqrtMax) / numWorkers);
  let promises = [];
  for (let i = 0; i < numWorkers; i++) {
    const start = sqrtMax + i * segmentSize;
    const end = (i === numWorkers - 1) ? max + 1 : start + segmentSize; // Ensure the last worker covers up to max
    promises.push(new Promise((resolve, reject) => {
      const worker = new Worker(__filename, { workerData: { start, end, initialPrimes } });
      worker.on('message', resolve);
      worker.on('error', reject);
    }));
  }
  Promise.all(promises).then(segments => {
    const primes = [].concat(...segments);
    console.log(`Found ${primes.length} primes.`);
  }).catch(console.error);
} else {
  const { start, end, initialPrimes } = workerData;
  parentPort.postMessage(workerTask(start, end, initialPrimes));
}
