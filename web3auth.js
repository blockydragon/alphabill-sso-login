import { CommonPrivateKeyProvider } from "@web3auth/base-provider";
import { OpenloginAdapter } from "@web3auth/openlogin-adapter";
import { HDKey } from "@scure/bip32";
import { mnemonicToSeedSync, entropyToMnemonic } from "bip39";

import { AB_WEB3AUTH_CONF } from "./utils/web3auth.constants.js";

let web3auth = null;
let secret = null;

/**
 * Initialize the web3auth module.
 *
 * @param {string} api_key - The API key for the client.
 * @param {object} [chainConfig=AB_WEB3AUTH_CONF.AB_testnet] - Optional. Configurations for the blockchain network. Defaults to AB_WEB3AUTH_CONF.AB_testnet.
 * @param {string} [network="sapphire_devnet"] - Optional. The network to connect to. Defaults to "sapphire_devnet".
 */
export async function init(api_key, chainConfig = AB_WEB3AUTH_CONF.AB_testnet, network = "sapphire_devnet"){

    const clientId = api_key;

    const privateKeyProvider = new CommonPrivateKeyProvider({
	config: { chainConfig },
    });
    const openloginAdapter = new OpenloginAdapter({
	privateKeyProvider: privateKeyProvider,
    });

    web3auth = new window.Modal.Web3Auth({
	clientId,
	chainConfig,
	web3AuthNetwork: network,
	authMode: "WALLET"
    });

    web3auth.configureAdapter(openloginAdapter);

    await web3auth.initModal();
}


/**
 * Recovers and returns the entropy, the starting point for generating crypto materials
 *
 * @throws {Error} Will throw an error if web3auth is not initialized.
 * @returns {boolean} - True if the secret was recovered successfully.
 */
export async function recoverSecret(){
    if(!web3auth) throw new Error("Web3auth was not initialized. Initialize web3auth first.");
    await web3auth.connect();

    const provider = web3auth.provider;
    secret = await provider.request({method: 'private_key'});

    return true;
}


/**
 * Returns the entropy (Handles sensitive secret information; ensure secure usage.).
 *
 * @throws {Error} Will throw error if web3auth is not initialized or if the entropy was not recovered.
 * @returns {string} - The secret entropy.
 */
export function getEntropy(){
    if(!web3auth) throw new Error("Web3auth was not initialized. Initialize web3auth first.");
    if(!secret) throw new Error("Something is wrong: the entropy was not recovered.");
    return secret;
}

/**
 * Returns the mnemonic (Handles sensitive secret information; ensure secure usage.).
 *
 * @returns {string} - The secret mnemonic.
 */
export function getMnemonic(){
    return entropyToMnemonic(getEntropy());
}


/**
 * Returns the seed (Handles sensitive secret information; ensure secure usage.).
 *
 * @returns {string} - The secret seed.
 */
export function getSeed(){
    return mnemonicToSeedSync(getMnemonic());
}


/**
 * Returns the master key (Handles sensitive secret information; ensure secure usage.).
 *
 * @returns {object} - The secret master key.
 */
export function getMasterKey(){
    return HDKey.fromMasterSeed(getSeed());
}


/**
 * Returns the private key object derived from master key through a bip32 HD path (Handles sensitive secret information; ensure secure usage.).
 *
 * @param {number} [accountIndex = 0] - Index of an account to be derived
 * @returns {object} - The secret private key object.
 */
export function getPrivateKey(accountIndex = 0){
    const masterKey = getMasterKey();
    return masterKey.derive(`m/44'/634'/${accountIndex}'/0/0`);
}


/**
 * Returns the private key object derived from master key through a bip32 HD path (Handles sensitive secret information; ensure secure usage.).
 *
 * @param {number} [accountIndex = 0] - Index of an account to be derived
 * @returns {bytes} - The secret private key bytes.
 */
export function getPrivateKeyBytes(accountIndex = 0){
    const priv_key = getPrivateKey(accountIndex);
    return priv_key.privateKey;
}


/**
 * Returns the public key object derived from master key through a bip32 HD path.
 *
 * @param {number} [accountIndex = 0] - Index of an account to be derived
 * @returns {bytes} - The secret public key bytes.
 */
export function getPublicKeyBytes(accountIndex = 0){
    const priv_key = getPrivateKey(accountIndex);
    return priv_key.publicKey;
}

/**
 * Removes the secret key.
 *
 * @throws {Error} Will throw an error if web3auth is not initialized.
 */
export async function forgetSecret(){
    if(!web3auth) throw new Error("Web3auth was not initialized. Initialize web3auth first.");
    await web3auth.logout();
    secret = null;
}
