const assert = require('assert');
const { fork } = require('child_process');

const knownPrimeCount = 664579;  // Known number of primes up to 10 million

console.log("Testing prime number generation...");

const child = fork('primeGenerator.js');  // Assuming 'primeGenerator.js' is your main script

child.on('message', (primes) => {
    try {
        assert.strictEqual(primes.length, knownPrimeCount, `Expected ${knownPrimeCount} primes, but found ${primes.length}`);
        console.log("Test passed: Correct number of primes generated.");
    } catch (error) {
        console.error("Test failed:", error.message);
    }
    child.kill();  // Terminate the child process
});

child.on('error', (error) => {
    console.error("Test failed with error:", error);
});

child.send({ command: 'start', min: 2, max: 1e7 });  // Send a command to start the prime number generation

