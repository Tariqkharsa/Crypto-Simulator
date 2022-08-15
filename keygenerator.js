// File for generating public/private key for wallet address

//elliptic curve private/public key generator
const EC = require('elliptic').ec; 
const ec = new EC('secp256k1');

// Generate function for a new key pair and convert them to hex
const key = ec.genKeyPair();

// Your wallet address to be used by others for sending/recieving transactions
const publicKey = key.getPublic('hex');

//Your private key (hidden from public and used to sign transactions
const privateKey = key.getPrivate('hex');

// Print the keys to the console
console.log();
console.log('Your public key: \n', publicKey);

console.log();
console.log('Your private key: \n', privateKey);
